"""
Training Data Collector for Fine-Tuning Card Identification Models

This module collects and formats user corrections and validated scans
to build high-quality training datasets for fine-tuning OpenAI models.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path


class TrainingDataCollector:
    """Collects and manages training data for fine-tuning"""

    def __init__(self, data_dir: str = "ml/training_data"):
        """Initialize the training data collector

        Args:
            data_dir: Directory to store training data files
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Separate files for different model types
        self.card_id_file = self.data_dir / "card_identification.jsonl"
        self.listing_gen_file = self.data_dir / "listing_generation.jsonl"
        self.corrections_file = self.data_dir / "user_corrections.jsonl"

    def collect_card_identification_sample(
        self,
        ocr_text: str,
        image_description: Optional[str],
        correct_card_data: Dict[str, Any],
        confidence_score: float = 1.0,
        user_id: Optional[str] = None
    ) -> bool:
        """Collect a validated card identification sample

        Args:
            ocr_text: OCR extracted text from the card
            image_description: Optional visual description of the card
            correct_card_data: The correct card information
            confidence_score: Confidence in this sample (0-1)
            user_id: Optional user who provided this data

        Returns:
            True if successfully saved
        """
        # Format as OpenAI fine-tuning format (chat completion)
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an expert sports card identifier. Given OCR text and/or "
                    "image description, identify the card and return structured data."
                )
            },
            {
                "role": "user",
                "content": self._build_identification_prompt(ocr_text, image_description)
            },
            {
                "role": "assistant",
                "content": json.dumps(correct_card_data, indent=2)
            }
        ]

        training_sample = {
            "messages": messages,
            "metadata": {
                "collected_at": datetime.utcnow().isoformat(),
                "confidence_score": confidence_score,
                "user_id": user_id,
                "source": "validated_scan"
            }
        }

        return self._append_to_file(self.card_id_file, training_sample)

    def collect_user_correction(
        self,
        original_scan_data: Dict[str, Any],
        corrected_data: Dict[str, Any],
        user_id: str,
        correction_fields: List[str]
    ) -> bool:
        """Collect a user correction to improve the model

        Args:
            original_scan_data: The original AI scan results
            corrected_data: The user's corrected data
            user_id: User who made the correction
            correction_fields: Which fields were corrected

        Returns:
            True if successfully saved
        """
        correction_sample = {
            "original": original_scan_data,
            "corrected": corrected_data,
            "corrected_fields": correction_fields,
            "user_id": user_id,
            "corrected_at": datetime.utcnow().isoformat()
        }

        # Also add as training sample with corrected data
        if "ocr_text" in original_scan_data:
            self.collect_card_identification_sample(
                ocr_text=original_scan_data["ocr_text"],
                image_description=original_scan_data.get("image_description"),
                correct_card_data=corrected_data,
                confidence_score=0.9,  # Slightly lower since it's a correction
                user_id=user_id
            )

        return self._append_to_file(self.corrections_file, correction_sample)

    def collect_listing_generation_sample(
        self,
        card_data: Dict[str, Any],
        platform: str,
        tone: str,
        generated_listing: Dict[str, str],
        user_rating: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> bool:
        """Collect a listing generation sample

        Args:
            card_data: The card information used
            platform: Target platform (ebay, pwcc, whatnot, comc)
            tone: Tone style (professional, casual, hype)
            generated_listing: The generated listing content
            user_rating: Optional user rating (1-5)
            user_id: Optional user who rated this

        Returns:
            True if successfully saved
        """
        messages = [
            {
                "role": "system",
                "content": self._get_listing_system_prompt(platform, tone)
            },
            {
                "role": "user",
                "content": json.dumps(card_data, indent=2)
            },
            {
                "role": "assistant",
                "content": json.dumps(generated_listing, indent=2)
            }
        ]

        training_sample = {
            "messages": messages,
            "metadata": {
                "collected_at": datetime.utcnow().isoformat(),
                "platform": platform,
                "tone": tone,
                "user_rating": user_rating,
                "user_id": user_id,
                "source": "generated_listing"
            }
        }

        return self._append_to_file(self.listing_gen_file, training_sample)

    def get_dataset_stats(self) -> Dict[str, Any]:
        """Get statistics about collected training data

        Returns:
            Dictionary with stats for each dataset
        """
        stats = {
            "card_identification": self._count_samples(self.card_id_file),
            "listing_generation": self._count_samples(self.listing_gen_file),
            "user_corrections": self._count_samples(self.corrections_file),
            "total_samples": 0,
            "last_updated": None
        }

        stats["total_samples"] = (
            stats["card_identification"] +
            stats["listing_generation"]
        )

        # Get last modified time
        files = [self.card_id_file, self.listing_gen_file, self.corrections_file]
        mod_times = [f.stat().st_mtime for f in files if f.exists()]
        if mod_times:
            stats["last_updated"] = datetime.fromtimestamp(max(mod_times)).isoformat()

        return stats

    def export_for_finetuning(
        self,
        model_type: str = "card_identification",
        min_confidence: float = 0.8,
        output_file: Optional[str] = None
    ) -> str:
        """Export training data in OpenAI fine-tuning format

        Args:
            model_type: Type of model ('card_identification' or 'listing_generation')
            min_confidence: Minimum confidence score to include
            output_file: Optional output file path

        Returns:
            Path to the exported file
        """
        if model_type == "card_identification":
            source_file = self.card_id_file
        elif model_type == "listing_generation":
            source_file = self.listing_gen_file
        else:
            raise ValueError(f"Unknown model type: {model_type}")

        if not source_file.exists():
            raise FileNotFoundError(f"No training data found at {source_file}")

        # Output file
        if output_file is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_file = self.data_dir / f"{model_type}_export_{timestamp}.jsonl"
        else:
            output_file = Path(output_file)

        # Filter by confidence and export
        exported_count = 0
        with open(source_file, 'r') as infile, open(output_file, 'w') as outfile:
            for line in infile:
                sample = json.loads(line)

                # Check confidence score
                confidence = sample.get("metadata", {}).get("confidence_score", 1.0)
                if confidence >= min_confidence:
                    # Write in OpenAI format (just messages, no metadata)
                    outfile.write(json.dumps({"messages": sample["messages"]}) + "\n")
                    exported_count += 1

        print(f"Exported {exported_count} samples to {output_file}")
        return str(output_file)

    def _build_identification_prompt(
        self,
        ocr_text: str,
        image_description: Optional[str]
    ) -> str:
        """Build the user prompt for card identification"""
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
        """Get the system prompt for listing generation"""
        return (
            f"You are an expert at creating {platform} listings for sports cards. "
            f"Generate a compelling listing in a {tone} tone with title, description, "
            f"and tags/keywords optimized for {platform}."
        )

    def _append_to_file(self, file_path: Path, data: Dict[str, Any]) -> bool:
        """Append a JSON line to a file"""
        try:
            with open(file_path, 'a') as f:
                f.write(json.dumps(data) + "\n")
            return True
        except Exception as e:
            print(f"Error writing to {file_path}: {e}")
            return False

    def _count_samples(self, file_path: Path) -> int:
        """Count the number of samples in a JSONL file"""
        if not file_path.exists():
            return 0

        count = 0
        with open(file_path, 'r') as f:
            for _ in f:
                count += 1
        return count


# Example usage
if __name__ == "__main__":
    collector = TrainingDataCollector()

    # Example: Collect a validated scan
    collector.collect_card_identification_sample(
        ocr_text="MICHAEL JORDAN 1986-87 FLEER #57 ROOKIE CARD BGS 9.5",
        image_description="Red and blue bordered card with player in Bulls uniform",
        correct_card_data={
            "player": "Michael Jordan",
            "year": "1986-87",
            "brand": "Fleer",
            "set_name": "Fleer Basketball",
            "card_number": "57",
            "variation": "Base",
            "grade": "9.5",
            "grading_company": "BGS",
            "estimated_value": 50000
        },
        confidence_score=1.0,
        user_id="user123"
    )

    # Print stats
    stats = collector.get_dataset_stats()
    print(json.dumps(stats, indent=2))
