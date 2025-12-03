# Fine-Tuning Guide for SlabStak AI Models

## Overview

SlabStak includes a complete fine-tuning system for improving AI model performance on card identification and listing generation tasks. This guide covers the entire workflow from data collection to production deployment.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Collection](#data-collection)
3. [Preparing Training Data](#preparing-training-data)
4. [Creating Fine-Tuning Jobs](#creating-fine-tuning-jobs)
5. [Evaluating Models](#evaluating-models)
6. [Deploying to Production](#deploying-to-production)
7. [Monitoring Performance](#monitoring-performance)
8. [Cost Management](#cost-management)

---

## System Architecture

The fine-tuning system consists of four main components:

```
backend/ml/
├── training_data_collector.py  # Collects validated scans and corrections
├── finetuning_manager.py       # Manages OpenAI fine-tuning jobs
├── model_manager.py             # Integrates fine-tuned models
└── model_evaluator.py           # Evaluates and monitors performance
```

### Data Flow

```
User Scans Card → AI Identifies → User Corrects (if needed)
                                         ↓
                              Training Data Collector
                                         ↓
                              Export Training Dataset
                                         ↓
                              Upload to OpenAI
                                         ↓
                              Create Fine-Tuning Job
                                         ↓
                              Evaluate Fine-Tuned Model
                                         ↓
                              Deploy to Production (if improved)
```

---

## Data Collection

### 1. Automatic Collection

The system automatically collects training data from:

**User Corrections:**
When users correct AI scan results, the correction is saved as training data.

```python
from ml.training_data_collector import TrainingDataCollector

collector = TrainingDataCollector()

# Automatically called when user corrects a scan
collector.collect_user_correction(
    original_scan_data={
        "player": "Michael Jordan",
        "year": "1986",  # Wrong
        "brand": "Fleer"
    },
    corrected_data={
        "player": "Michael Jordan",
        "year": "1986-87",  # Corrected
        "brand": "Fleer"
    },
    user_id="user123",
    correction_fields=["year"]
)
```

**Validated Scans:**
When users confirm AI results are correct (via thumbs up, etc.):

```python
collector.collect_card_identification_sample(
    ocr_text="MICHAEL JORDAN 1986-87 FLEER #57 ROOKIE CARD BGS 9.5",
    image_description="Red and blue bordered card",
    correct_card_data={
        "player": "Michael Jordan",
        "year": "1986-87",
        "brand": "Fleer",
        "card_number": "57",
        "grade": "9.5",
        "grading_company": "BGS"
    },
    confidence_score=1.0,
    user_id="user123"
)
```

### 2. Manual Collection

For high-value cards or edge cases, manually add training samples:

```bash
cd backend
python3 -c "
from ml.training_data_collector import TrainingDataCollector
collector = TrainingDataCollector()

# Add your training example here
collector.collect_card_identification_sample(...)
"
```

### 3. Check Dataset Stats

```bash
cd backend
python3 ml/training_data_collector.py
```

Output:
```json
{
  "card_identification": 150,
  "listing_generation": 75,
  "user_corrections": 45,
  "total_samples": 225,
  "last_updated": "2024-12-02T10:30:00Z"
}
```

---

## Preparing Training Data

### 1. Export Training Dataset

```python
from ml.training_data_collector import TrainingDataCollector

collector = TrainingDataCollector()

# Export card identification dataset
file_path = collector.export_for_finetuning(
    model_type="card_identification",
    min_confidence=0.8,  # Only include high-confidence samples
    output_file="ml/training_data/card_id_ready.jsonl"
)

print(f"Exported to: {file_path}")
```

### 2. Review Export

The exported file is in OpenAI's JSONL format:

```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

### 3. Validate Data Quality

**Minimum Requirements:**
- **Card ID:** 50+ high-quality samples (100+ recommended)
- **Listings:** 30+ samples per platform/tone combination

**Quality Checks:**
- ✅ No duplicate samples
- ✅ Consistent formatting
- ✅ Accurate ground truth data
- ✅ Diverse examples (different sports, years, brands)

---

## Creating Fine-Tuning Jobs

### 1. Estimate Cost

```bash
cd backend
python3 ml/finetuning_manager.py estimate ml/training_data/card_id_ready.jsonl
```

Output:
```json
{
  "model": "gpt-4o-mini-2024-07-18",
  "estimated_tokens": 450000,
  "epochs": 3,
  "cost_per_1m_tokens": 3.00,
  "estimated_cost_usd": 1.35
}
```

### 2. Upload Training File

```bash
python3 ml/finetuning_manager.py upload ml/training_data/card_id_ready.jsonl
```

Output:
```
Uploading training file: ml/training_data/card_id_ready.jsonl
File uploaded successfully: file-abc123xyz

File ID: file-abc123xyz
Use this ID to create a fine-tuning job
```

### 3. Create Fine-Tuning Job

```bash
python3 ml/finetuning_manager.py create file-abc123xyz gpt-4o-mini-2024-07-18 slabstak-card-id
```

Parameters:
- `file-abc123xyz`: Training file ID
- `gpt-4o-mini-2024-07-18`: Base model
- `slabstak-card-id`: Model name suffix (optional)

Output:
```json
{
  "job_id": "ftjob-abc123",
  "model": "gpt-4o-mini-2024-07-18",
  "status": "queued",
  "created_at": 1701532800,
  "fine_tuned_model": null
}
```

### 4. Monitor Job Status

```bash
# Check status
python3 ml/finetuning_manager.py status ftjob-abc123

# Wait for completion (blocks until done)
python3 ml/finetuning_manager.py wait ftjob-abc123
```

Fine-tuning typically takes **10-30 minutes** depending on dataset size.

### 5. List All Jobs

```bash
python3 ml/finetuning_manager.py list-jobs
```

---

## Evaluating Models

### 1. Prepare Test Set

Create a separate test dataset (not used in training):

```python
from ml.training_data_collector import TrainingDataCollector

collector = TrainingDataCollector()

# Export with different date range or flagged as "test"
test_file = collector.export_for_finetuning(
    model_type="card_identification",
    output_file="ml/test_data.jsonl"
)
```

### 2. Run A/B Test

```python
from ml.model_evaluator import ModelEvaluator
from ml.model_manager import ModelManager

evaluator = ModelEvaluator()
manager = ModelManager()

# Prepare test cases
test_inputs = [
    {"ocr_text": "LEBRON JAMES 2003 TOPPS CHROME #111 BGS 9"},
    {"ocr_text": "TOM BRADY 2000 PLAYOFF CONTENDERS #144 PSA 10"}
]

ground_truth = [
    {"player": "LeBron James", "year": "2003", "brand": "Topps Chrome", ...},
    {"player": "Tom Brady", "year": "2000", "brand": "Playoff Contenders", ...}
]

# Compare models
comparison = manager.compare_models(
    model_type="card_identification",
    test_input=test_inputs[0],
    num_runs=3
)

print(json.dumps(comparison, indent=2))
```

### 3. Evaluate Accuracy

```python
# Get predictions from both models
base_predictions = [...]  # Run test set through base model
finetuned_predictions = [...]  # Run test set through fine-tuned model

# A/B test
results = evaluator.ab_test(
    model_a_results=base_predictions,
    model_b_results=finetuned_predictions,
    ground_truth=ground_truth,
    model_a_name="GPT-4o-mini Base",
    model_b_name="SlabStak Fine-Tuned"
)

print(f"Winner: {results['winner']}")
print(f"Improvement: {results['improvement']['exact_match']:.1%}")
print(f"Recommendation: {results['recommendation']}")
```

### 4. Save Evaluation Results

```python
evaluator.save_evaluation(
    metrics=results,
    eval_type="ab_test_card_id",
    filename="card_id_eval_20241202.json"
)
```

---

## Deploying to Production

### 1. Update Environment Variables

After fine-tuning completes, you'll get a model ID like: `ft:gpt-4o-mini-2024-07-18:slabstak:card-id:abc123`

Add to `backend/.env`:

```bash
# Fine-Tuned Models
FINETUNED_CARD_ID_MODEL=ft:gpt-4o-mini-2024-07-18:slabstak:card-id:abc123
USE_FINETUNED_CARD_ID=true

# Optional: Listing generation fine-tuned model
FINETUNED_LISTING_MODEL=ft:gpt-4o-mini-2024-07-18:slabstak:listing:xyz789
USE_FINETUNED_LISTING=true
```

### 2. Test in Development

```python
from ml.model_manager import ModelManager

manager = ModelManager()

# Verify it's using the fine-tuned model
config = manager.get_model_config()
print(config)

# Test a prediction
result = manager.identify_card_finetuned(
    ocr_text="MICHAEL JORDAN 1986-87 FLEER #57 BGS 9.5"
)

print(f"Model used: {result['_metadata']['model_used']}")
print(f"Is fine-tuned: {result['_metadata']['is_finetuned']}")
```

### 3. Gradual Rollout (Recommended)

Start with a percentage of traffic:

```python
import random

# 20% of users get fine-tuned model
use_finetuned = random.random() < 0.20

if use_finetuned:
    result = manager.identify_card_finetuned(...)
else:
    # Use base model
    result = identify_card_base(...)
```

### 4. Full Production Deployment

Once validated, set `USE_FINETUNED_CARD_ID=true` in production environment.

---

## Monitoring Performance

### 1. Track Production Usage

```python
from ml.model_evaluator import ModelEvaluator

evaluator = ModelEvaluator()

# Log every prediction
evaluator.track_production_performance(
    model_prediction={"player": "Michael Jordan", ...},
    user_correction={"year": "1986-87"},  # If user corrected
    user_rating=5,  # If user rated (1-5)
    model_id="ft:gpt-4o-mini-2024-07-18:slabstak:card-id:abc123"
)
```

### 2. Analyze Monthly Performance

```bash
cd backend
python3 -c "
from ml.model_evaluator import ModelEvaluator

evaluator = ModelEvaluator()
analysis = evaluator.analyze_production_logs(
    month='202412',
    model_id='ft:gpt-4o-mini-2024-07-18:slabstak:card-id:abc123'
)

import json
print(json.dumps(analysis, indent=2))
"
```

Output:
```json
{
  "month": "202412",
  "total_predictions": 1250,
  "corrections": 85,
  "correction_rate": 0.068,
  "accuracy_rate": 0.932,
  "average_user_rating": 4.6,
  "field_corrections": {
    "year": 32,
    "card_number": 18,
    "variation": 15
  }
}
```

### 3. Set Up Alerts

Monitor for:
- **Correction rate > 15%**: Model needs retraining
- **Average rating < 4.0**: Quality issues
- **Specific field errors**: Need more training data for that field

---

## Cost Management

### Training Costs

**GPT-4o-mini (Recommended):**
- Training: $3.00 per 1M tokens
- Inference: $0.150 per 1M input tokens, $0.600 per 1M output tokens

**Example:**
- 100 training samples × 500 tokens each × 3 epochs = 150K tokens
- Cost: $0.45 for training
- Monthly inference (10K predictions): ~$15-25

### Cost Optimization Tips

1. **Start with GPT-4o-mini** (1/3 the cost of GPT-3.5-turbo training)
2. **Quality over quantity**: 100 high-quality samples > 500 mediocre ones
3. **Use validation set**: Prevent overfitting, reduce wasted training
4. **Monitor correction rate**: High accuracy = fewer customer support costs
5. **Cache common results**: Store popular card IDs

---

## Best Practices

### Data Collection

✅ **DO:**
- Collect diverse examples (all sports, years, brands)
- Include edge cases (misprints, variations, oddball sets)
- Validate corrections from experienced users
- Include both graded and raw cards

❌ **DON'T:**
- Use duplicate or near-duplicate samples
- Include unverified user data
- Train on outdated card information
- Ignore user corrections

### Training

✅ **DO:**
- Start with 50-100 high-quality samples
- Use a validation set (10-20% of data)
- Evaluate before deploying
- Version your models

❌ **DON'T:**
- Train on fewer than 30 samples
- Skip evaluation
- Deploy without A/B testing
- Forget to monitor production performance

### Deployment

✅ **DO:**
- Gradual rollout (20% → 50% → 100%)
- Monitor correction rates
- Keep base model as fallback
- Track user satisfaction

❌ **DON'T:**
- Deploy without testing
- Remove base model option
- Ignore user feedback
- Stop collecting training data

---

## Troubleshooting

### "Not enough training data"

**Solution:** Collect at least 50 samples before fine-tuning. Use the data collector to track progress.

### "Fine-tuned model performs worse"

**Causes:**
- Low-quality training data
- Overfitting (too many epochs)
- Not enough diversity in examples

**Solution:**
- Review training samples for accuracy
- Reduce epochs to 1-2
- Collect more diverse examples

### "High cost, low improvement"

**Solution:**
- Use GPT-4o-mini instead of larger models
- Focus on specific problem areas
- Ensure training data quality

### "Model not being used in production"

**Check:**
1. Environment variable set: `USE_FINETUNED_CARD_ID=true`
2. Model ID correct in `.env`
3. Backend restarted after env changes

---

## Quick Reference Commands

```bash
# Check training data stats
python3 ml/training_data_collector.py

# Export training data
python3 -c "from ml.training_data_collector import TrainingDataCollector; TrainingDataCollector().export_for_finetuning('card_identification')"

# Estimate cost
python3 ml/finetuning_manager.py estimate <file_path>

# Upload training file
python3 ml/finetuning_manager.py upload <file_path>

# Create fine-tuning job
python3 ml/finetuning_manager.py create <file_id> gpt-4o-mini-2024-07-18 slabstak-card-id

# Monitor job
python3 ml/finetuning_manager.py wait <job_id>

# List all jobs
python3 ml/finetuning_manager.py list-jobs

# List fine-tuned models
python3 ml/finetuning_manager.py list-models
```

---

## Support

For issues or questions:
- **GitHub Issues:** https://github.com/SlabStak/slabstak/issues
- **Documentation:** See other docs in `/docs` directory
- **OpenAI Fine-Tuning Docs:** https://platform.openai.com/docs/guides/fine-tuning

---

**Generated:** December 2, 2024
**Version:** 1.0
**Status:** Production Ready
