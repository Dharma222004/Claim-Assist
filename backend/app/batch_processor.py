import io
import pandas as pd
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from app.database import save_authorization_record

# Forbidden ground-truth columns that must NEVER be passed to ML inference
FORBIDDEN_FIELDS = {"EXPECTED_ANOMALY", "EXPECTED_TYPE", "IS_ANOMALY", "ANOMALY_TYPE"}


def process_csv_batch(
    csv_bytes: bytes,
    pipeline_func,
    db: Session = None
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Process authorization CSV file using the EXACT SAME inference pipeline function as /api/predict.
    """
    df = pd.read_csv(io.BytesIO(csv_bytes))

    # Strip forbidden columns if present in CSV
    clean_columns = [col for col in df.columns if col not in FORBIDDEN_FIELDS and col.upper() not in FORBIDDEN_FIELDS]
    df_clean = df[clean_columns]

    records = df_clean.to_dict(orient="records")

    total_records = len(records)
    normal_count = 0
    anomaly_count = 0
    priority_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    total_latency_ms = 0.0

    detailed_results = []

    for index, row in enumerate(records):
        if "auth_id" not in row or not row["auth_id"]:
            row["auth_id"] = f"CSV_AUTH_{index + 1:04d}"

        # Call the exact same inference pipeline function used by /api/predict
        result = pipeline_func(row, db=db)

        prediction = result.get("prediction", "NORMAL")
        final_priority = result.get("final_priority", "LOW")
        latency = float(result.get("inference_latency_ms", 0.0))

        if prediction == "ANOMALY":
            anomaly_count += 1
        else:
            normal_count += 1

        priority_counts[final_priority] = priority_counts.get(final_priority, 0) + 1
        total_latency_ms += latency

        detailed_results.append(result)

    avg_latency_ms = round(total_latency_ms / total_records, 3) if total_records > 0 else 0.0

    summary = {
        "total_records": total_records,
        "normal_count": normal_count,
        "anomaly_count": anomaly_count,
        "anomaly_rate": round(anomaly_count / total_records, 4) if total_records > 0 else 0.0,
        "priority_distribution": priority_counts,
        "avg_inference_latency_ms": avg_latency_ms,
    }

    return summary, detailed_results
