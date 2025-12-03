"""
Model Manager for Fine-Tuned Models

Integrates fine-tuned models into the SlabStak application,
allowing seamless switching between base models and fine-tuned versions.
"""

import os
import json
from typing import Dict, List, Optional, Any
from openai import OpenAI
from datetime import datetime


class ModelManager:
    """Manages fine-tuned model deployment and usage"""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize the model manager

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")

        self.client = OpenAI(api_key=self.api_key)

        # Model configuration
        self.models = {
            "card_identification": {
                "base": "gpt-4o-mini-2024-07-18",
                "finetuned": os.getenv("FINETUNED_CARD_ID_MODEL"),
                "active": os.getenv("USE_FINETUNED_CARD_ID", "false").lower() == "true"
            },
            "listing_generation": {
                "base": "gpt-4o-mini-2024-07-18",
                "finetuned": os.getenv("FINETUNED_LISTING_MODEL"),
                "active": os.getenv("USE_FINETUNED_LISTING", "false").lower() == "true"
            }
        }

    def get_active_model(self, model_type: str) -> str:
        """Get the currently active model for a given type

        Args:
            model_type: Type of model ('card_identification' or 'listing_generation')

        Returns:
            Model ID to use
        """
        if model_type not in self.models:
            raise ValueError(f"Unknown model type: {model_type}")

        config = self.models[model_type]

        # Use fine-tuned if available and active
        if config["active"] and config["finetuned"]:
            return config["finetuned"]

        # Fallback to base model
        return config["base"]

    def identify_card_finetuned(
        self,
        ocr_text: str,
        image_description: Optional[str] = None,
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """Identify a card using the fine-tuned (or base) model

        Args:
            ocr_text: OCR extracted text
            image_description: Optional image description
            temperature: Sampling temperature (lower = more deterministic)

        Returns:
            Parsed card data
        """
        model = self.get_active_model("card_identification")

        # Build messages
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert sports card identifier. Given OCR text and/or "
                    "image description, identify the card and return structured JSON data."
                )
            },
            {
                "role": "user",
                "content": self._build_card_id_prompt(ocr_text, image_description)
            }
        ]

        # Call the model
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            response_format={"type": "json_object"}
        )

        # Parse response
        result = json.loads(response.choices[0].message.content)

        # Add metadata
        result["_metadata"] = {
            "model_used": model,
            "is_finetuned": model != self.models["card_identification"]["base"],
            "timestamp": datetime.utcnow().isoformat()
        }

        return result

    def generate_listing_finetuned(
        self,
        card_data: Dict[str, Any],
        platform: str,
        tone: str,
        temperature: float = 0.7
    ) -> Dict[str, str]:
        """Generate a listing using the fine-tuned (or base) model

        Args:
            card_data: Card information
            platform: Target platform (ebay, pwcc, whatnot, comc)
            tone: Tone style (professional, casual, hype)
            temperature: Sampling temperature

        Returns:
            Generated listing content
        """
        model = self.get_active_model("listing_generation")

        # Build messages
        messages = [
            {
                "role": "system",
                "content": self._get_listing_system_prompt(platform, tone)
            },
            {
                "role": "user",
                "content": json.dumps(card_data, indent=2)
            }
        ]

        # Call the model
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            response_format={"type": "json_object"}
        )

        # Parse response
        result = json.loads(response.choices[0].message.content)

        # Add metadata
        result["_metadata"] = {
            "model_used": model,
            "is_finetuned": model != self.models["listing_generation"]["base"],
            "platform": platform,
            "tone": tone,
            "timestamp": datetime.utcnow().isoformat()
        }

        return result

    def set_active_model(
        self,
        model_type: str,
        model_id: Optional[str] = None,
        use_finetuned: bool = True
    ) -> None:
        """Set the active model for a given type

        Args:
            model_type: Type of model to configure
            model_id: Specific model ID to use (optional)
            use_finetuned: Whether to use fine-tuned model
        """
        if model_type not in self.models:
            raise ValueError(f"Unknown model type: {model_type}")

        if model_id:
            self.models[model_type]["finetuned"] = model_id

        self.models[model_type]["active"] = use_finetuned

    def get_model_config(self) -> Dict[str, Any]:
        """Get current model configuration

        Returns:
            Complete model configuration
        """
        config = {}
        for model_type, settings in self.models.items():
            active_model = self.get_active_model(model_type)
            config[model_type] = {
                "base_model": settings["base"],
                "finetuned_model": settings["finetuned"],
                "using_finetuned": settings["active"],
                "active_model": active_model
            }
        return config

    def compare_models(
        self,
        model_type: str,
        test_input: Dict[str, Any],
        num_runs: int = 3
    ) -> Dict[str, Any]:
        """Compare base model vs fine-tuned model performance

        Args:
            model_type: Type of model to compare
            test_input: Test input data
            num_runs: Number of times to run each model

        Returns:
            Comparison results
        """
        if model_type not in ["card_identification", "listing_generation"]:
            raise ValueError(f"Invalid model type: {model_type}")

        results = {
            "base_model": [],
            "finetuned_model": [],
            "comparison": {}
        }

        # Save original settings
        original_active = self.models[model_type]["active"]

        try:
            # Test base model
            self.models[model_type]["active"] = False
            for i in range(num_runs):
                if model_type == "card_identification":
                    result = self.identify_card_finetuned(**test_input)
                else:
                    result = self.generate_listing_finetuned(**test_input)
                results["base_model"].append(result)

            # Test fine-tuned model (if available)
            if self.models[model_type]["finetuned"]:
                self.models[model_type]["active"] = True
                for i in range(num_runs):
                    if model_type == "card_identification":
                        result = self.identify_card_finetuned(**test_input)
                    else:
                        result = self.generate_listing_finetuned(**test_input)
                    results["finetuned_model"].append(result)

                # Basic comparison
                results["comparison"] = {
                    "base_runs": len(results["base_model"]),
                    "finetuned_runs": len(results["finetuned_model"]),
                    "note": "Review outputs manually to assess quality improvement"
                }
            else:
                results["comparison"]["error"] = "No fine-tuned model available"

        finally:
            # Restore original settings
            self.models[model_type]["active"] = original_active

        return results

    def _build_card_id_prompt(
        self,
        ocr_text: str,
        image_description: Optional[str]
    ) -> str:
        """Build the card identification prompt"""
        prompt_parts = []

        if ocr_text:
            prompt_parts.append(f"OCR Text:\n{ocr_text}")

        if image_description:
            prompt_parts.append(f"\nImage Description:\n{image_description}")

        prompt_parts.append(
            "\nPlease identify this card and return structured JSON with: "
            "player, year, brand, set_name, card_number, variation, "
            "grade, grading_company, estimated_value"
        )

        return "\n".join(prompt_parts)

    def _get_listing_system_prompt(self, platform: str, tone: str) -> str:
        """Get the listing generation system prompt"""
        return (
            f"You are an expert at creating {platform} listings for sports cards. "
            f"Generate a compelling listing in a {tone} tone with title, description, "
            f"and tags/keywords optimized for {platform}. Return as JSON."
        )


# Environment variable configuration helper
def generate_env_template() -> str:
    """Generate .env template for fine-tuned models"""
    template = """
# Fine-Tuned Model Configuration

# Card Identification Fine-Tuned Model
FINETUNED_CARD_ID_MODEL=ft:gpt-4o-mini-2024-07-18:your-org:card-id:xxxxx
USE_FINETUNED_CARD_ID=true

# Listing Generation Fine-Tuned Model
FINETUNED_LISTING_MODEL=ft:gpt-4o-mini-2024-07-18:your-org:listing:xxxxx
USE_FINETUNED_LISTING=true

# Set to 'false' to use base models instead of fine-tuned versions
"""
    return template


if __name__ == "__main__":
    # Example usage
    manager = ModelManager()

    # Show current configuration
    print("Current Model Configuration:")
    print(json.dumps(manager.get_model_config(), indent=2))

    # Example: Identify a card
    try:
        result = manager.identify_card_finetuned(
            ocr_text="MICHAEL JORDAN 1986-87 FLEER #57 BGS 9.5",
            image_description="Red and blue card with Bulls player"
        )
        print("\nCard Identification Result:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")

    # Print environment template
    print("\n" + "="*50)
    print("Add this to your .env file:")
    print("="*50)
    print(generate_env_template())
