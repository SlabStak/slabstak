"""
ML Admin API Routes for Fine-Tuning Management

These routes provide an API interface for the ML admin dashboard.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os

from ml.training_data_collector import TrainingDataCollector
from ml.finetuning_manager import FineTuningManager
from ml.model_manager import ModelManager
from ml.model_evaluator import ModelEvaluator

router = APIRouter(prefix="/ml", tags=["ML Administration"])

# Initialize services
collector = TrainingDataCollector()
finetuning_manager = None  # Lazy init (needs API key)
model_manager = None  # Lazy init
evaluator = ModelEvaluator()


def get_finetuning_manager():
    """Lazy initialize finetuning manager"""
    global finetuning_manager
    if finetuning_manager is None:
        finetuning_manager = FineTuningManager()
    return finetuning_manager


def get_model_manager():
    """Lazy initialize model manager"""
    global model_manager
    if model_manager is None:
        model_manager = ModelManager()
    return model_manager


# Pydantic models
class ExportRequest(BaseModel):
    model_type: str
    min_confidence: float = 0.8


class CreateJobRequest(BaseModel):
    training_file_id: str
    model: str = "gpt-4o-mini-2024-07-18"
    suffix: Optional[str] = None
    model_type: str = "card_identification"


class ModelConfigUpdate(BaseModel):
    model_id: Optional[str]
    enabled: bool


class UpdateConfigRequest(BaseModel):
    card_identification: ModelConfigUpdate
    listing_generation: ModelConfigUpdate


# Training Data Routes
@router.get("/training-data/stats")
async def get_training_data_stats():
    """Get training data statistics"""
    try:
        stats = collector.get_dataset_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/training-data/export")
async def export_training_data(request: ExportRequest):
    """Export training data for fine-tuning"""
    try:
        file_path = collector.export_for_finetuning(
            model_type=request.model_type,
            min_confidence=request.min_confidence
        )

        # Count samples in export
        sample_count = 0
        with open(file_path, 'r') as f:
            for _ in f:
                sample_count += 1

        return {
            "file_path": file_path,
            "sample_count": sample_count,
            "model_type": request.model_type,
            "min_confidence": request.min_confidence
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Fine-Tuning Routes
@router.get("/finetuning/jobs")
async def list_finetuning_jobs():
    """List recent fine-tuning jobs"""
    try:
        manager = get_finetuning_manager()
        jobs = manager.list_jobs(limit=20)
        return {"jobs": jobs}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/finetuning/upload")
async def upload_training_file(request: ExportRequest):
    """Upload training file to OpenAI"""
    try:
        # First export the data
        file_path = collector.export_for_finetuning(
            model_type=request.model_type,
            min_confidence=request.min_confidence
        )

        # Upload to OpenAI
        manager = get_finetuning_manager()
        file_id = manager.upload_training_file(file_path)

        return {
            "file_id": file_id,
            "file_path": file_path,
            "model_type": request.model_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/finetuning/create")
async def create_finetuning_job(request: CreateJobRequest):
    """Create a new fine-tuning job"""
    try:
        manager = get_finetuning_manager()
        job = manager.create_finetuning_job(
            training_file_id=request.training_file_id,
            model=request.model,
            suffix=request.suffix
        )
        return job
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/finetuning/job/{job_id}")
async def get_job_status(job_id: str):
    """Get status of a fine-tuning job"""
    try:
        manager = get_finetuning_manager()
        status = manager.get_job_status(job_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Model Configuration Routes
@router.get("/models/config")
async def get_model_config():
    """Get current model configuration"""
    try:
        manager = get_model_manager()
        config = manager.get_model_config()
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/models/config")
async def update_model_config(request: UpdateConfigRequest):
    """Update model configuration in .env file"""
    try:
        # Build .env updates
        env_updates = []

        if request.card_identification.model_id:
            env_updates.append(
                f"FINETUNED_CARD_ID_MODEL={request.card_identification.model_id}"
            )
        env_updates.append(
            f"USE_FINETUNED_CARD_ID={'true' if request.card_identification.enabled else 'false'}"
        )

        if request.listing_generation.model_id:
            env_updates.append(
                f"FINETUNED_LISTING_MODEL={request.listing_generation.model_id}"
            )
        env_updates.append(
            f"USE_FINETUNED_LISTING={'true' if request.listing_generation.enabled else 'false'}"
        )

        # Write to .env file
        env_file = os.path.join(os.path.dirname(__file__), ".env")

        # Read existing .env
        env_lines = []
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                env_lines = f.readlines()

        # Update or add ML config lines
        ml_keys = {
            "FINETUNED_CARD_ID_MODEL",
            "USE_FINETUNED_CARD_ID",
            "FINETUNED_LISTING_MODEL",
            "USE_FINETUNED_LISTING"
        }

        # Remove existing ML config
        env_lines = [line for line in env_lines if not any(line.startswith(key) for key in ml_keys)]

        # Add new config
        env_lines.append("\n# Fine-Tuned Model Configuration (Updated via Admin UI)\n")
        for update in env_updates:
            env_lines.append(f"{update}\n")

        # Write back
        with open(env_file, 'w') as f:
            f.writelines(env_lines)

        return {
            "success": True,
            "message": "Configuration saved. Restart backend to apply changes."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Production Metrics Routes
@router.get("/metrics")
async def get_production_metrics(month: Optional[str] = None, model_id: Optional[str] = None):
    """Get production performance metrics"""
    try:
        if model_id == "all":
            model_id = None

        analysis = evaluator.analyze_production_logs(
            month=month,
            model_id=model_id
        )

        if "error" in analysis:
            return {
                "month": month or "current",
                "model_id": model_id or "all",
                "total_predictions": 0,
                "corrections": 0,
                "correction_rate": 0,
                "accuracy_rate": 0,
                "average_user_rating": None,
                "total_ratings": 0,
                "field_corrections": {}
            }

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Utility route for collecting training data (called by main app)
@router.post("/collect/correction")
async def collect_user_correction(
    original: dict,
    corrected: dict,
    user_id: str,
    corrected_fields: list[str]
):
    """Collect a user correction for training data"""
    try:
        success = collector.collect_user_correction(
            original_scan_data=original,
            corrected_data=corrected,
            user_id=user_id,
            correction_fields=corrected_fields
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collect/validated-scan")
async def collect_validated_scan(
    ocr_text: str,
    card_data: dict,
    confidence_score: float = 1.0,
    user_id: Optional[str] = None
):
    """Collect a validated scan for training data"""
    try:
        success = collector.collect_card_identification_sample(
            ocr_text=ocr_text,
            correct_card_data=card_data,
            confidence_score=confidence_score,
            user_id=user_id
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
