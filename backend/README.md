# SlabStak Backend

FastAPI backend for SlabStak card scanning and AI identification.

## Features

- Card image OCR (Tesseract)
- AI-powered card identification (OpenAI GPT-4)
- Market data simulation (placeholder for real APIs)
- CORS-enabled for Next.js frontend

## Prerequisites

1. **Python 3.9+**
2. **Tesseract OCR** installed:
   - macOS: `brew install tesseract`
   - Ubuntu: `sudo apt-get install tesseract-ocr`
   - Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
3. **OpenAI API Key**: Get from https://platform.openai.com/api-keys
4. **OpenAI Assistant**: Create in OpenAI Playground

## Setup

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create OpenAI Assistant

1. Go to https://platform.openai.com/assistants
2. Click "Create Assistant"
3. Configure:
   - **Name**: SlabStak Card Identifier
   - **Model**: gpt-4-turbo-preview (or gpt-4)
   - **Instructions**:
     ```
     You are a professional sports card grader and market analyst.
     When given OCR text from a trading card, identify the card and provide valuation.
     Always return responses in strict JSON format with no markdown or extra commentary.
     ```
   - **Tools**: None (text-only)
4. Save and copy the Assistant ID (starts with `asst_`)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
OPENAI_API_KEY=sk-your-key-here
ASSISTANT_ID=asst_your_assistant_id_here
ALLOWED_ORIGIN=http://localhost:3000
TESSERACT_CMD=/opt/homebrew/bin/tesseract  # Update for your system
```

### 4. Verify Tesseract Installation

```bash
tesseract --version
```

If command not found, update `TESSERACT_CMD` in `.env` to the correct path.

## Running

### Development

```bash
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server runs at: http://localhost:8000

### Production

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

See full documentation at `/docs` (Swagger UI) when server is running.

## Troubleshooting

### Tesseract Not Found
Install Tesseract and update `TESSERACT_CMD` in `.env`

### OpenAI API Errors
Add valid API key to `.env`

### CORS Errors
Check `ALLOWED_ORIGIN` matches frontend URL
