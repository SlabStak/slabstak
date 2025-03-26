from fastapi import FastAPI, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from PIL import Image
import pytesseract
import openai
import os
import time
import json
import csv
from datetime import datetime
from dotenv import load_dotenv

# Load secrets
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID")

# FastAPI app
app = FastAPI()
templates = Jinja2Templates(directory="templates")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root route
@app.get("/")
def read_root():
    return {"message": "🔥 SlabStak AI is live. Go to /docs or /upload to scan cards."}

# Mobile upload form route
@app.get("/upload", response_class=HTMLResponse)
def upload_page(request: Request):
    return templates.TemplateResponse("upload.html", {"request": request})

# Main scan endpoint
@app.post("/scan")
async def scan_card(image: UploadFile):
    try:
        # Save uploaded image
        image_path = f"temp_{image.filename}"
        with open(image_path, "wb") as f:
            f.write(await image.read())

        # OCR the image
        img = Image.open(image_path)
        extracted_text = pytesseract.image_to_string(img)
        os.remove(image_path)

        if not extracted_text.strip():
            return {"result": {
                "player": "Unknown",
                "set": "Unknown",
                "value": "Unknown",
                "recommendation": "None",
                "reason": "No readable text"
            }}

        # OpenAI assistant eval
        thread = openai.beta.threads.create()
        openai.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=(
                "OCR text from card:\n\n"
                f"{extracted_text}\n\n"
                "Return JSON:\n"
                "{\n"
                '  "player": "...",\n'
                '  "set": "...",\n'
                '  "value": "...",\n'
                '  "recommendation": "...",\n'
                '  "reason": "..." \n'
                "}"
            )
        )

        run = openai.beta.threads.runs.create(thread_id=thread.id, assistant_id=ASSISTANT_ID)
        while run.status in ["queued", "in_progress"]:
            time.sleep(1)
            run = openai.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)

        if run.status != "completed":
            raise HTTPException(500, f"Assistant run failed: {run.status}")

        messages = openai.beta.threads.messages.list(thread_id=thread.id)
        response_text = messages.data[0].content[0].text.value
        data = json.loads(response_text)

        # Log to vault
        if not os.path.exists("vault.csv"):
            with open("vault.csv", "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(["player", "set", "value", "recommendation", "reason", "timestamp"])

        with open("vault.csv", "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                data.get("player", "Unknown"),
                data.get("set", "Unknown"),
                data.get("value", "Unknown"),
                data.get("recommendation", "Unknown"),
                data.get("reason", ""),
                datetime.now().isoformat()
            ])

        return {"result": data}

    except Exception as e:
        raise HTTPException(500, detail=str(e))

