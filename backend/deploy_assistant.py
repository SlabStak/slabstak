import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Missing OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

INSTRUCTIONS = '''
You are the "SlabStak Card Evaluator".
You help sports card collectors and sellers understand what their cards might be worth.

You receive OCR text from the front of a sports card or slab.
You infer player, set, year, variant if obvious, and likely grade outcome.
You then estimate a value range in USD based on typical comps and condition.

You always respond with STRICT JSON; no commentary.
'''

assistant = client.beta.assistants.create(
    name="SlabStak Card Evaluator",
    instructions=INSTRUCTIONS,
    model="gpt-4.1-mini",
)

print("Assistant created. ID: ", assistant.id)
print("Set ASSISTANT_ID in backend environment to this value.")
