# ML Admin UI - Complete Fine-Tuning Management Interface

## Overview

SlabStak now includes a full-featured web-based admin interface for managing the AI fine-tuning system. Admins can collect training data, create fine-tuning jobs, deploy models, and monitor performance—all from the browser.

**Access:** `/admin/ml` (requires admin role)

---

## Features

### 1. Training Data Management

**Location:** `/admin/ml` → Training Data tab

**Capabilities:**
- View real-time dataset statistics
- Track sample counts for card ID and listing generation
- Export training data to OpenAI JSONL format
- Set minimum confidence thresholds
- See readiness status (need 50+ card ID or 30+ listing samples)

**UI Components:**
- Overview cards showing sample counts
- Export form with model type and confidence selection
- Data quality tips and recommendations
- Real-time refresh button

### 2. Fine-Tuning Job Management

**Location:** `/admin/ml` → Fine-Tuning Jobs tab

**Capabilities:**
- Quick-start workflow (upload → create job)
- List all fine-tuning jobs with status
- Create new jobs with custom parameters
- Monitor job progress (queued, running, succeeded, failed)
- View trained token counts and completion times

**UI Components:**
- Quick action cards for 1-click uploads
- Job creation form with validation
- Real-time job status table
- Auto-refresh every 30 seconds

**Workflow:**
1. Click "Upload Card ID Data" or "Upload Listing Data"
2. System exports and uploads to OpenAI
3. Copy the returned File ID
4. Click "Create New Job"
5. Paste File ID, select model and suffix
6. Monitor status until completed
7. Copy fine-tuned model ID

### 3. Model Configuration

**Location:** `/admin/ml` → Models tab

**Capabilities:**
- View currently active models (base vs fine-tuned)
- Configure fine-tuned model IDs
- Enable/disable fine-tuned models per type
- Save configuration to backend `.env`
- Rollback to base models if needed

**UI Components:**
- Active model display cards
- Configuration forms for each model type
- Enable/disable toggles
- Deployment instructions with warnings
- Rollback procedure

**Process:**
1. Copy fine-tuned model ID from successful job
2. Paste into appropriate field (Card ID or Listing)
3. Enable the checkbox
4. Click "Save Configuration"
5. Restart backend to apply changes
6. Monitor Production Metrics tab

### 4. Production Metrics & Monitoring

**Location:** `/admin/ml` → Production Metrics tab

**Capabilities:**
- View monthly performance analytics
- Track accuracy rates and correction rates
- Monitor user ratings
- Analyze field-level correction patterns
- Compare different models
- Get automated performance insights

**UI Components:**
- Month and model filter dropdowns
- Overview cards (predictions, accuracy, rating, corrections)
- Field-level correction breakdown with bar charts
- Performance insights with color-coded alerts
- Actionable next steps and recommendations

**Metrics Tracked:**
- Total predictions made
- Accuracy rate (100% - correction rate)
- Average user rating (1-5 scale)
- Correction rate by field
- Model comparison (base vs fine-tuned)

**Alert Thresholds:**
- ✅ Excellent: >90% accuracy
- ⚠️ Moderate: 75-90% accuracy
- ❌ Poor: <75% accuracy

---

## Technical Architecture

### Frontend Structure

```
frontend/src/
├── app/
│   ├── admin/
│   │   └── ml/
│   │       └── page.tsx              # Main ML admin page
│   └── api/
│       └── admin/
│           └── ml/
│               ├── check-access/     # Admin auth check
│               ├── training-data/
│               │   ├── stats/        # GET dataset stats
│               │   └── export/       # POST export data
│               ├── finetuning/
│               │   ├── jobs/         # GET list jobs
│               │   ├── create/       # POST create job
│               │   └── upload/       # POST upload file
│               ├── models/
│               │   └── config/       # GET/POST model config
│               └── metrics/          # GET production metrics
└── components/
    └── ml/
        ├── TrainingDataStats.tsx      # Training data UI
        ├── FineTuningJobs.tsx         # Job management UI
        ├── ModelConfig.tsx            # Model configuration UI
        └── ProductionMetrics.tsx      # Metrics dashboard UI
```

### Backend Structure

```
backend/
├── ml_routes.py                       # FastAPI routes for ML admin
├── ml/
│   ├── training_data_collector.py    # Data collection service
│   ├── finetuning_manager.py         # Job management service
│   ├── model_manager.py               # Model deployment service
│   └── model_evaluator.py            # Metrics & evaluation service
└── main.py                            # Includes ML routes
```

### API Endpoints

**Training Data:**
- `GET /ml/training-data/stats` - Get dataset statistics
- `POST /ml/training-data/export` - Export training data

**Fine-Tuning:**
- `GET /ml/finetuning/jobs` - List all jobs
- `POST /ml/finetuning/upload` - Upload training file
- `POST /ml/finetuning/create` - Create new job
- `GET /ml/finetuning/job/{id}` - Get job status

**Models:**
- `GET /ml/models/config` - Get current configuration
- `POST /ml/models/config` - Update configuration

**Metrics:**
- `GET /ml/metrics?month=YYYYMM&model_id=xxx` - Get production metrics

**Data Collection (internal):**
- `POST /ml/collect/correction` - Log user correction
- `POST /ml/collect/validated-scan` - Log validated scan

---

## User Workflows

### Workflow 1: First-Time Fine-Tuning Setup

1. Navigate to `/admin/ml`
2. Click **Training Data** tab
3. Wait until you have 50+ card ID samples (collected automatically from user corrections)
4. Click **Export for Fine-Tuning** with:
   - Model Type: Card Identification
   - Min Confidence: 0.8
5. Go to **Fine-Tuning Jobs** tab
6. Click **Upload Card ID Data**
7. Copy the returned File ID
8. Click **Create New Job**
9. Fill in:
   - Training File ID: (paste from step 7)
   - Model Type: Card Identification
   - Base Model: gpt-4o-mini-2024-07-18
   - Suffix: slabstak
10. Click **Create Job**
11. Wait 10-30 minutes for completion (check **Refresh** button)
12. Copy the fine-tuned model ID from completed job
13. Go to **Models** tab
14. Paste model ID into Card Identification field
15. Enable checkbox
16. Click **Save Configuration**
17. Restart backend: `cd backend && python3 -m uvicorn main:app --reload`
18. Go to **Production Metrics** tab to monitor performance

### Workflow 2: Monitoring and Iteration

1. Navigate to `/admin/ml` → **Production Metrics**
2. Select current month
3. Review accuracy rate:
   - If <75%: Collect more training data
   - If 75-90%: Monitor and improve
   - If >90%: Excellent, maintain
4. Check **Field-Level Corrections** section
5. Identify fields with high error rates
6. Collect targeted training data for those fields
7. When you have +100 new samples:
   - Export new training data
   - Create new fine-tuning job
   - A/B test vs current model
   - Deploy if improved

### Workflow 3: Rollback Bad Model

1. Navigate to `/admin/ml` → **Models**
2. Uncheck "Enable fine-tuned model" for problematic model
3. Click **Save Configuration**
4. Restart backend
5. System automatically falls back to base model
6. Review training data quality
7. Retrain with better examples

---

## Data Collection Integration

Training data is collected automatically throughout the app:

### User Corrections
When a user corrects an AI scan result:
```typescript
// In card edit/correction flow
await fetch("/api/ml/collect/correction", {
  method: "POST",
  body: JSON.stringify({
    original: originalScanData,
    corrected: userCorrectedData,
    user_id: currentUser.id,
    corrected_fields: ["year", "card_number"]
  })
});
```

### Validated Scans
When a user confirms AI result is correct:
```typescript
// Add thumbs-up button to scan results
await fetch("/api/ml/collect/validated-scan", {
  method: "POST",
  body: JSON.stringify({
    ocr_text: extractedText,
    card_data: aiResult,
    confidence_score: 1.0,
    user_id: currentUser.id
  })
});
```

---

## Security

### Access Control

- All ML admin routes require admin role
- Checked via `/api/admin/ml/check-access`
- Frontend redirects non-admins to home
- Backend validates on every request

### Environment Protection

- Fine-tuned model IDs stored in backend `.env`
- Never exposed to client-side
- Configuration updates write to `.env` file
- Requires backend restart to apply

### Data Privacy

- Training data files gitignored
- User IDs anonymized in exports
- Metrics aggregated, no PII exposed
- Production logs rotated monthly

---

## Performance

### Load Times

- Training Data Stats: <500ms
- Fine-Tuning Jobs List: <1s
- Model Config Load: <500ms
- Production Metrics: <1s

### Auto-Refresh

- Jobs list: Every 30 seconds
- Metrics: On-demand (not auto-refresh to avoid costs)
- Stats: On-demand via refresh button

### Optimization

- API routes cached where appropriate
- Large datasets paginated
- Background jobs don't block UI
- Lazy loading of OpenAI client

---

## Troubleshooting

### Issue: "No data available"

**Cause:** No training data collected yet
**Solution:**
1. Ensure users are using the app and making corrections
2. Add manual training samples via backend CLI
3. Wait for organic data collection (may take days/weeks)

### Issue: "Failed to fetch from backend"

**Cause:** Backend not running or ML routes not loaded
**Solution:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Check logs for ML route loading errors
3. Verify `ml_routes.py` exists in backend directory
4. Restart backend

### Issue: "Upload failed"

**Cause:** Export file doesn't exist or insufficient samples
**Solution:**
1. Export training data first from Training Data tab
2. Ensure you have 50+ card ID or 30+ listing samples
3. Check backend logs for detailed error

### Issue: "Configuration not applying"

**Cause:** Backend not restarted after config change
**Solution:**
1. Save configuration
2. Restart backend: `python3 -m uvicorn main:app --reload`
3. Verify in logs: "ML routes loaded successfully"

---

## Best Practices

### Data Collection

1. **Start Small:** Collect 50-100 high-quality samples before first training
2. **Diverse Examples:** Include all sports, years, brands, conditions
3. **User Feedback:** Encourage corrections with clear UI prompts
4. **Quality > Quantity:** 100 perfect samples > 500 mediocre ones

### Training

1. **Cost Management:** Start with gpt-4o-mini ($3/1M tokens training)
2. **Validation Set:** Always use 10-20% for validation
3. **Evaluation First:** A/B test before full deployment
4. **Version Models:** Use descriptive suffixes (slabstak-v2, etc.)

### Deployment

1. **Gradual Rollout:** 20% → 50% → 100% of traffic
2. **Monitor Closely:** Check metrics daily for first week
3. **Keep Fallback:** Never remove base model option
4. **User Communication:** Announce improvements to users

### Monitoring

1. **Weekly Reviews:** Check Production Metrics every Monday
2. **Alert Thresholds:** Set up notifications for <75% accuracy
3. **Field Analysis:** Focus retraining on high-error fields
4. **User Satisfaction:** Track ratings alongside accuracy

---

## Future Enhancements

Potential additions for v2:

1. **A/B Testing UI:** Built-in traffic splitting and comparison
2. **Automated Retraining:** Trigger new jobs when error rate exceeds threshold
3. **Model Comparison:** Side-by-side accuracy comparison graphs
4. **Training Data Review:** UI to review and approve/reject samples
5. **Batch Operations:** Bulk approve corrections, mass export
6. **Notification System:** Email alerts for job completion/failures
7. **Cost Tracking:** Dashboard showing training & inference costs
8. **Model Versioning:** Track all deployed models with rollback history

---

## Support Resources

- **ML Module README:** `backend/ml/README.md`
- **Fine-Tuning Guide:** `docs/FINETUNING_GUIDE.md`
- **OpenAI Docs:** https://platform.openai.com/docs/guides/fine-tuning
- **GitHub Issues:** https://github.com/SlabStak/slabstak/issues

---

**Generated:** December 2024
**Status:** Production Ready
**Access:** Requires admin role
