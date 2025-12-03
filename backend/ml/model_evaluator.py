"""
Model Evaluator for Fine-Tuned Models

Provides tools for evaluating and monitoring fine-tuned model performance,
including accuracy metrics, A/B testing, and quality assessment.
"""

import json
import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from pathlib import Path
import statistics


class ModelEvaluator:
    """Evaluates fine-tuned model performance"""

    def __init__(self, results_dir: str = "ml/evaluation_results"):
        """Initialize the model evaluator

        Args:
            results_dir: Directory to store evaluation results
        """
        self.results_dir = Path(results_dir)
        self.results_dir.mkdir(parents=True, exist_ok=True)

    def evaluate_card_identification(
        self,
        predictions: List[Dict[str, Any]],
        ground_truth: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Evaluate card identification model accuracy

        Args:
            predictions: List of model predictions
            ground_truth: List of correct answers

        Returns:
            Evaluation metrics
        """
        if len(predictions) != len(ground_truth):
            raise ValueError("Predictions and ground truth must have same length")

        # Track accuracy by field
        field_accuracy = {
            "player": [],
            "year": [],
            "brand": [],
            "set_name": [],
            "card_number": [],
            "variation": [],
            "grade": [],
            "grading_company": []
        }

        exact_matches = 0
        total = len(predictions)

        for pred, truth in zip(predictions, ground_truth):
            # Check exact match
            if self._dicts_match(pred, truth):
                exact_matches += 1

            # Check field-by-field accuracy
            for field in field_accuracy.keys():
                pred_value = str(pred.get(field, "")).lower().strip()
                truth_value = str(truth.get(field, "")).lower().strip()

                if pred_value == truth_value:
                    field_accuracy[field].append(1)
                else:
                    field_accuracy[field].append(0)

        # Calculate metrics
        metrics = {
            "total_samples": total,
            "exact_match_accuracy": exact_matches / total if total > 0 else 0,
            "field_accuracy": {
                field: sum(scores) / len(scores) if scores else 0
                for field, scores in field_accuracy.items()
            },
            "average_field_accuracy": statistics.mean([
                sum(scores) / len(scores) if scores else 0
                for scores in field_accuracy.values()
            ]),
            "evaluated_at": datetime.utcnow().isoformat()
        }

        return metrics

    def evaluate_listing_quality(
        self,
        generated_listings: List[Dict[str, str]],
        quality_criteria: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate listing generation quality

        Args:
            generated_listings: List of generated listings
            quality_criteria: Optional custom quality criteria

        Returns:
            Quality metrics
        """
        if quality_criteria is None:
            quality_criteria = {
                "min_title_length": 30,
                "max_title_length": 80,
                "min_description_length": 100,
                "required_keywords": ["card", "condition"],
                "max_tags": 20
            }

        metrics = {
            "total_listings": len(generated_listings),
            "quality_scores": [],
            "issues": []
        }

        for i, listing in enumerate(generated_listings):
            score = 0
            max_score = 0
            issues = []

            # Title length check
            title = listing.get("title", "")
            max_score += 1
            if quality_criteria["min_title_length"] <= len(title) <= quality_criteria["max_title_length"]:
                score += 1
            else:
                issues.append(f"Title length {len(title)} outside range")

            # Description length check
            description = listing.get("description", "")
            max_score += 1
            if len(description) >= quality_criteria["min_description_length"]:
                score += 1
            else:
                issues.append(f"Description too short ({len(description)} chars)")

            # Required keywords check
            combined_text = (title + " " + description).lower()
            max_score += len(quality_criteria["required_keywords"])
            for keyword in quality_criteria["required_keywords"]:
                if keyword.lower() in combined_text:
                    score += 1
                else:
                    issues.append(f"Missing keyword: {keyword}")

            # Tags check
            tags = listing.get("tags", [])
            if isinstance(tags, str):
                tags = tags.split(",")
            max_score += 1
            if 0 < len(tags) <= quality_criteria["max_tags"]:
                score += 1
            else:
                issues.append(f"Invalid number of tags: {len(tags)}")

            # Calculate percentage score
            percentage = (score / max_score * 100) if max_score > 0 else 0
            metrics["quality_scores"].append(percentage)

            if issues:
                metrics["issues"].append({
                    "listing_index": i,
                    "score": percentage,
                    "issues": issues
                })

        # Summary statistics
        if metrics["quality_scores"]:
            metrics["average_quality"] = statistics.mean(metrics["quality_scores"])
            metrics["min_quality"] = min(metrics["quality_scores"])
            metrics["max_quality"] = max(metrics["quality_scores"])
            metrics["median_quality"] = statistics.median(metrics["quality_scores"])
        else:
            metrics["average_quality"] = 0

        metrics["evaluated_at"] = datetime.utcnow().isoformat()

        return metrics

    def ab_test(
        self,
        model_a_results: List[Dict[str, Any]],
        model_b_results: List[Dict[str, Any]],
        ground_truth: List[Dict[str, Any]],
        model_a_name: str = "Base Model",
        model_b_name: str = "Fine-Tuned Model"
    ) -> Dict[str, Any]:
        """Run A/B test between two models

        Args:
            model_a_results: Results from model A
            model_b_results: Results from model B
            ground_truth: Correct answers
            model_a_name: Name of model A
            model_b_name: Name of model B

        Returns:
            Comparison results
        """
        # Evaluate both models
        metrics_a = self.evaluate_card_identification(model_a_results, ground_truth)
        metrics_b = self.evaluate_card_identification(model_b_results, ground_truth)

        # Calculate improvement
        improvement = {
            "exact_match": (
                metrics_b["exact_match_accuracy"] - metrics_a["exact_match_accuracy"]
            ),
            "average_field": (
                metrics_b["average_field_accuracy"] - metrics_a["average_field_accuracy"]
            ),
            "field_by_field": {}
        }

        for field in metrics_a["field_accuracy"].keys():
            improvement["field_by_field"][field] = (
                metrics_b["field_accuracy"][field] - metrics_a["field_accuracy"][field]
            )

        # Determine winner
        if improvement["exact_match"] > 0:
            winner = model_b_name
        elif improvement["exact_match"] < 0:
            winner = model_a_name
        else:
            winner = "Tie"

        return {
            "model_a": {
                "name": model_a_name,
                "metrics": metrics_a
            },
            "model_b": {
                "name": model_b_name,
                "metrics": metrics_b
            },
            "improvement": improvement,
            "winner": winner,
            "recommendation": self._get_recommendation(improvement),
            "tested_at": datetime.utcnow().isoformat()
        }

    def track_production_performance(
        self,
        model_prediction: Dict[str, Any],
        user_correction: Optional[Dict[str, Any]] = None,
        user_rating: Optional[int] = None,
        model_id: str = "unknown"
    ) -> bool:
        """Track model performance in production

        Args:
            model_prediction: The model's prediction
            user_correction: User's correction (if any)
            user_rating: User's rating 1-5 (if any)
            model_id: Model identifier

        Returns:
            True if successfully logged
        """
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "model_id": model_id,
            "prediction": model_prediction,
            "user_correction": user_correction,
            "user_rating": user_rating,
            "was_corrected": user_correction is not None,
            "corrected_fields": []
        }

        # Identify which fields were corrected
        if user_correction:
            for field, value in user_correction.items():
                if model_prediction.get(field) != value:
                    log_entry["corrected_fields"].append(field)

        # Log to file
        log_file = self.results_dir / f"production_log_{datetime.utcnow().strftime('%Y%m')}.jsonl"
        try:
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + "\n")
            return True
        except Exception as e:
            print(f"Error logging production performance: {e}")
            return False

    def analyze_production_logs(
        self,
        month: Optional[str] = None,
        model_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze production performance logs

        Args:
            month: Month to analyze (YYYYMM format, defaults to current)
            model_id: Optional filter by model ID

        Returns:
            Analysis results
        """
        if month is None:
            month = datetime.utcnow().strftime('%Y%m')

        log_file = self.results_dir / f"production_log_{month}.jsonl"

        if not log_file.exists():
            return {"error": f"No logs found for {month}"}

        # Load and filter logs
        logs = []
        with open(log_file, 'r') as f:
            for line in f:
                log = json.loads(line)
                if model_id is None or log.get("model_id") == model_id:
                    logs.append(log)

        if not logs:
            return {"error": "No matching logs found"}

        # Analyze
        total = len(logs)
        corrected_count = sum(1 for log in logs if log["was_corrected"])
        correction_rate = corrected_count / total if total > 0 else 0

        # Field-level accuracy
        field_corrections = {}
        for log in logs:
            for field in log.get("corrected_fields", []):
                field_corrections[field] = field_corrections.get(field, 0) + 1

        # User ratings
        ratings = [log["user_rating"] for log in logs if log.get("user_rating")]
        avg_rating = statistics.mean(ratings) if ratings else None

        return {
            "month": month,
            "model_id": model_id or "all",
            "total_predictions": total,
            "corrections": corrected_count,
            "correction_rate": correction_rate,
            "accuracy_rate": 1 - correction_rate,
            "field_corrections": field_corrections,
            "average_user_rating": avg_rating,
            "total_ratings": len(ratings),
            "analyzed_at": datetime.utcnow().isoformat()
        }

    def save_evaluation(
        self,
        metrics: Dict[str, Any],
        eval_type: str,
        filename: Optional[str] = None
    ) -> str:
        """Save evaluation results to file

        Args:
            metrics: Evaluation metrics
            eval_type: Type of evaluation
            filename: Optional custom filename

        Returns:
            Path to saved file
        """
        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{eval_type}_{timestamp}.json"

        filepath = self.results_dir / filename

        with open(filepath, 'w') as f:
            json.dump(metrics, f, indent=2)

        print(f"Evaluation saved to: {filepath}")
        return str(filepath)

    def _dicts_match(self, dict1: Dict[str, Any], dict2: Dict[str, Any]) -> bool:
        """Check if two dictionaries match (ignoring case and whitespace)"""
        if set(dict1.keys()) != set(dict2.keys()):
            return False

        for key in dict1.keys():
            val1 = str(dict1[key]).lower().strip()
            val2 = str(dict2[key]).lower().strip()
            if val1 != val2:
                return False

        return True

    def _get_recommendation(self, improvement: Dict[str, float]) -> str:
        """Get recommendation based on improvement metrics"""
        exact_match_improvement = improvement["exact_match"]

        if exact_match_improvement > 0.05:  # 5% improvement
            return "✅ Fine-tuned model shows significant improvement. Recommend deploying to production."
        elif exact_match_improvement > 0:
            return "⚠️ Fine-tuned model shows minor improvement. Consider collecting more training data."
        elif exact_match_improvement == 0:
            return "⚠️ No improvement detected. More training data or different approach needed."
        else:
            return "❌ Fine-tuned model performs worse. Do not deploy. Review training data quality."


if __name__ == "__main__":
    # Example usage
    evaluator = ModelEvaluator()

    # Example: Evaluate card identification
    predictions = [
        {"player": "Michael Jordan", "year": "1986", "brand": "Fleer"},
        {"player": "LeBron James", "year": "2003", "brand": "Topps"}
    ]

    ground_truth = [
        {"player": "Michael Jordan", "year": "1986-87", "brand": "Fleer"},
        {"player": "LeBron James", "year": "2003", "brand": "Topps"}
    ]

    metrics = evaluator.evaluate_card_identification(predictions, ground_truth)
    print(json.dumps(metrics, indent=2))

    # Save evaluation
    evaluator.save_evaluation(metrics, "card_id_test")
