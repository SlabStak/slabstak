import openai, os
from dotenv import load_dotenv
load_dotenv()

openai.api_key = os.getenv("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")

assistant = openai.beta.assistants.create(
    name="SlabStak Card Evaluator",
    instructions="You're an expert sports card evaluator. When given card images, clearly provide the player name, card set, estimated market value, and recommendation (Flip, Hold, Grade, Bundle).",
    model="gpt-4-1106-preview"  # <-- clearly updated model here!
)

print("New Assistant ID:", assistant.id)

