from fastapi import FastAPI, UploadFile, HTTPException
from PIL import Image
import pytesseract, openai, os, time
from dotenv import load_dotenv
load_dotenv()

pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"  # Update if different

openai.api_key = "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"

ASSISTANT_ID = "asst_NaDjGPOrslYhgyfv839axp5G"  # ← ✅ Use your latest GPT-4 TEXT assistant

app = FastAPI()

@app.post("/scan")
async def scan_card(image: UploadFile):
    try:
        # Save uploaded image locally
        image_path = f"temp_{image.filename}"
        with open(image_path, "wb") as f:
            f.write(await image.read())

        # Extract visible text from the card
        img = Image.open(image_path)
        extracted_text = pytesseract.image_to_string(img)

        # Delete file after processing
        os.remove(image_path)

        # Send extracted text to assistant
        thread = openai.beta.threads.create()
        openai.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=f"""
This is the visible text from a scanned sports card image:

\"\"\"
{extracted_text}
\"\"\"

Please identify the player, set, estimated value, and recommend one of the following: Flip, Hold, Grade, or Bundle. Return the result as JSON.
"""
        )

        run = openai.beta.threads.runs.create(thread_id=thread.id, assistant_id=ASSISTANT_ID)

        while run.status in ["queued", "in_progress"]:
            time.sleep(1)
            run = openai.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)

        if run.status == "completed":
            messages = openai.beta.threads.messages.list(thread_id=thread.id)
            return {"result": messages.data[0].content[0].text.value}

        raise HTTPException(500, f"Run failed with status: {run.status}")

    except Exception as e:
        raise HTTPException(500, str(e))

