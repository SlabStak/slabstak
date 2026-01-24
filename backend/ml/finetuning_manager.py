"""
Fine-Tuning Manager for OpenAI Models

Manages the complete fine-tuning lifecycle:
- Uploading training data
- Creating fine-tuning jobs
- Monitoring job status
- Managing fine-tuned models
"""

import os
import json
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from openai import OpenAI


class FineTuningManager:
    """Manages OpenAI fine-tuning jobs and models"""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the fine-tuning manager

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")

        self.client = OpenAI(api_key=self.api_key)

    def upload_training_file(
        self,
        file_path: str,
        purpose: str = "fine-tune"
    ) -> str:
        """Upload a training file to OpenAI

        Args:
            file_path: Path to the JSONL training file
            purpose: Purpose of the file ('fine-tune')

        Returns:
            File ID from OpenAI
        """
        print(f"Uploading training file: {file_path}")

        with open(file_path, 'rb') as f:
            response = self.client.files.create(
                file=f,
                purpose=purpose
            )

        file_id = response.id
        print(f"File uploaded successfully: {file_id}")

        return file_id

    def create_finetuning_job(
        self,
        training_file_id: str,
        model: str = "gpt-4o-mini-2024-07-18",
        suffix: Optional[str] = None,
        hyperparameters: Optional[Dict[str, Any]] = None,
        validation_file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a fine-tuning job

        Args:
            training_file_id: ID of uploaded training file
            model: Base model to fine-tune (gpt-4o-mini-2024-07-18 or gpt-3.5-turbo)
            suffix: Optional suffix for the model name (max 40 chars)
            hyperparameters: Optional training hyperparameters
            validation_file_id: Optional validation file ID

        Returns:
            Fine-tuning job details
        """
        print(f"Creating fine-tuning job for file: {training_file_id}")

        # Build request parameters
        params = {
            "training_file": training_file_id,
            "model": model
        }

        if suffix:
            params["suffix"] = suffix[:40]  # Max 40 characters

        if hyperparameters:
            params["hyperparameters"] = hyperparameters

        if validation_file_id:
            params["validation_file"] = validation_file_id

        # Create the job
        job = self.client.fine_tuning.jobs.create(**params)

        job_info = {
            "job_id": job.id,
            "model": job.model,
            "status": job.status,
            "created_at": job.created_at,
            "training_file": job.training_file,
            "fine_tuned_model": job.fine_tuned_model
        }

        print(f"Fine-tuning job created: {job.id}")
        print(f"Status: {job.status}")

        return job_info

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """Get the status of a fine-tuning job

        Args:
            job_id: The fine-tuning job ID

        Returns:
            Job status details
        """
        job = self.client.fine_tuning.jobs.retrieve(job_id)

        return {
            "job_id": job.id,
            "status": job.status,
            "model": job.model,
            "fine_tuned_model": job.fine_tuned_model,
            "created_at": job.created_at,
            "finished_at": job.finished_at,
            "trained_tokens": job.trained_tokens,
            "error": job.error if hasattr(job, 'error') else None
        }

    def list_jobs(self, limit: int = 10) -> List[Dict[str, Any]]:
        """List recent fine-tuning jobs

        Args:
            limit: Maximum number of jobs to return

        Returns:
            List of job details
        """
        jobs = self.client.fine_tuning.jobs.list(limit=limit)

        return [
            {
                "job_id": job.id,
                "status": job.status,
                "model": job.model,
                "fine_tuned_model": job.fine_tuned_model,
                "created_at": job.created_at,
                "finished_at": job.finished_at
            }
            for job in jobs.data
        ]

    def wait_for_completion(
        self,
        job_id: str,
        check_interval: int = 60,
        timeout: int = 3600
    ) -> Dict[str, Any]:
        """Wait for a fine-tuning job to complete

        Args:
            job_id: The fine-tuning job ID
            check_interval: Seconds between status checks
            timeout: Maximum seconds to wait

        Returns:
            Final job status

        Raises:
            TimeoutError: If job doesn't complete within timeout
        """
        start_time = time.time()
        print(f"Waiting for job {job_id} to complete...")

        while True:
            status = self.get_job_status(job_id)

            print(f"Status: {status['status']} (checked at {datetime.now().strftime('%H:%M:%S')})")

            # Check if completed
            if status['status'] == 'succeeded':
                print(f"Job completed! Fine-tuned model: {status['fine_tuned_model']}")
                return status

            # Check if failed
            if status['status'] == 'failed':
                error_msg = status.get('error', 'Unknown error')
                raise RuntimeError(f"Fine-tuning job failed: {error_msg}")

            # Check if cancelled
            if status['status'] == 'cancelled':
                raise RuntimeError("Fine-tuning job was cancelled")

            # Check timeout
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Fine-tuning job did not complete within {timeout} seconds")

            # Wait before next check
            time.sleep(check_interval)

    def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """Cancel a running fine-tuning job

        Args:
            job_id: The fine-tuning job ID

        Returns:
            Cancelled job status
        """
        job = self.client.fine_tuning.jobs.cancel(job_id)

        print(f"Job {job_id} cancelled")

        return {
            "job_id": job.id,
            "status": job.status
        }

    def list_models(self) -> List[Dict[str, Any]]:
        """List all fine-tuned models

        Returns:
            List of fine-tuned model details
        """
        models = self.client.models.list()

        # Filter for fine-tuned models (contain 'ft:' prefix)
        fine_tuned = [
            {
                "id": model.id,
                "created": model.created,
                "owned_by": model.owned_by
            }
            for model in models.data
            if model.id.startswith('ft:')
        ]

        return fine_tuned

    def delete_model(self, model_id: str) -> bool:
        """Delete a fine-tuned model

        Args:
            model_id: The fine-tuned model ID

        Returns:
            True if successfully deleted
        """
        response = self.client.models.delete(model_id)

        if response.deleted:
            print(f"Model {model_id} deleted successfully")
            return True
        else:
            print(f"Failed to delete model {model_id}")
            return False

    def get_job_events(self, job_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get events/logs for a fine-tuning job

        Args:
            job_id: The fine-tuning job ID
            limit: Maximum number of events to return

        Returns:
            List of job events
        """
        events = self.client.fine_tuning.jobs.list_events(
            fine_tuning_job_id=job_id,
            limit=limit
        )

        return [
            {
                "created_at": event.created_at,
                "level": event.level,
                "message": event.message
            }
            for event in events.data
        ]

    def estimate_cost(
        self,
        training_file_path: str,
        model: str = "gpt-4o-mini-2024-07-18",
        epochs: int = 3
    ) -> Dict[str, Any]:
        """Estimate the cost of fine-tuning

        Args:
            training_file_path: Path to training file
            model: Base model to fine-tune
            epochs: Number of training epochs

        Returns:
            Cost estimation details
        """
        # Count tokens in training file (rough estimate)
        total_tokens = 0
        with open(training_file_path, 'r') as f:
            for line in f:
                # Rough estimate: 1 token ≈ 4 characters
                total_tokens += len(line) // 4

        training_tokens = total_tokens * epochs

        # Pricing configuration (in USD per 1M tokens)
        # Can be overridden with environment variables
        pricing_config = {
            "gpt-4o-mini": float(os.getenv("FINETUNING_PRICE_GPT4O_MINI", "3.00")),
            "gpt-3.5-turbo": float(os.getenv("FINETUNING_PRICE_GPT35_TURBO", "8.00")),
            "default": float(os.getenv("FINETUNING_PRICE_DEFAULT", "3.00")),
        }

        cost_per_1m = pricing_config.get("default", 3.00)
        for model_name, price in pricing_config.items():
            if model_name != "default" and model_name in model:
                cost_per_1m = price
                break

        estimated_cost = (training_tokens / 1_000_000) * cost_per_1m

        return {
            "model": model,
            "estimated_tokens": training_tokens,
            "epochs": epochs,
            "cost_per_1m_tokens": cost_per_1m,
            "estimated_cost_usd": round(estimated_cost, 2)
        }


# CLI helper functions
def main():
    """CLI interface for fine-tuning management"""
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python finetuning_manager.py upload <file_path>")
        print("  python finetuning_manager.py create <training_file_id> [model] [suffix]")
        print("  python finetuning_manager.py status <job_id>")
        print("  python finetuning_manager.py wait <job_id>")
        print("  python finetuning_manager.py list-jobs")
        print("  python finetuning_manager.py list-models")
        print("  python finetuning_manager.py estimate <file_path>")
        return

    manager = FineTuningManager()
    command = sys.argv[1]

    if command == "upload":
        file_path = sys.argv[2]
        file_id = manager.upload_training_file(file_path)
        print(f"\nFile ID: {file_id}")
        print("Use this ID to create a fine-tuning job")

    elif command == "create":
        training_file_id = sys.argv[2]
        model = sys.argv[3] if len(sys.argv) > 3 else "gpt-4o-mini-2024-07-18"
        suffix = sys.argv[4] if len(sys.argv) > 4 else None

        job = manager.create_finetuning_job(training_file_id, model, suffix)
        print(json.dumps(job, indent=2))

    elif command == "status":
        job_id = sys.argv[2]
        status = manager.get_job_status(job_id)
        print(json.dumps(status, indent=2))

    elif command == "wait":
        job_id = sys.argv[2]
        result = manager.wait_for_completion(job_id)
        print("\n" + "="*50)
        print("FINE-TUNING COMPLETE!")
        print("="*50)
        print(json.dumps(result, indent=2))

    elif command == "list-jobs":
        jobs = manager.list_jobs()
        print(json.dumps(jobs, indent=2))

    elif command == "list-models":
        models = manager.list_models()
        print(json.dumps(models, indent=2))

    elif command == "estimate":
        file_path = sys.argv[2]
        estimate = manager.estimate_cost(file_path)
        print(json.dumps(estimate, indent=2))

    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
