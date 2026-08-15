import pytest
from pathlib import Path
from app.cms_ingestion import get_raw_file_paths, stream_cms_dataset
from app.data_quality import CMSDataQualityEngine


def test_cms_ingestion_registry():
    """Verify that all 7 raw CMS datasets are registered with correct delimiters."""
    registry = get_raw_file_paths()
    expected_datasets = [
        "Carrier", "Outpatient", "Part D 2023", "Part D 2024",
        "Beneficiary 2022", "Beneficiary 2023", "Beneficiary 2024"
    ]
    for dataset_name in expected_datasets:
        assert dataset_name in registry
        info = registry[dataset_name]
        assert info["exists"] is True
        assert info["size_bytes"] > 0
        assert info["delimiter"] in ["|", ","]


def test_cms_ingestion_streaming():
    """Verify memory-efficient chunked streaming of Carrier raw dataset."""
    chunks = list(stream_cms_dataset("Carrier", chunksize=500, max_chunks=2))
    assert len(chunks) >= 1
    assert chunks[0].shape[0] > 0
    assert "CLM_ID" in chunks[0].columns
    assert "BENE_ID" in chunks[0].columns


def test_data_quality_engine_single_dataset():
    """Verify single dataset quality evaluation metrics for Beneficiary 2022."""
    engine = CMSDataQualityEngine()
    result = engine.evaluate_dataset("Beneficiary 2022", chunksize=1000, max_chunks=2)
    assert result["status"] == "EVALUATED"
    assert result["dataset_name"] == "Beneficiary 2022"
    assert result["cols_detected"] > 0
    assert result["rows_evaluated"] > 0
    assert 0.0 <= result["completeness_score"] <= 100.0
    assert 0.0 <= result["validity_score"] <= 100.0
    assert 0.0 <= result["uniqueness_score"] <= 100.0
    assert 0.0 <= result["consistency_score"] <= 100.0
    assert 0.0 <= result["overall_quality_score"] <= 100.0



def test_data_quality_full_report():
    """Verify full quality report for all 7 raw CMS datasets."""
    engine = CMSDataQualityEngine()
    report = engine.generate_full_report(chunksize=1000, max_chunks_per_file=1)
    summary = report.get("summary", {})
    assert summary.get("total_datasets_evaluated") == 7
    assert len(summary.get("datasets_processed", [])) == 7
    assert summary.get("overall_cms_quality_score") > 0.0

    datasets = report.get("datasets", {})
    for name in summary["datasets_processed"]:
        assert name in datasets
        assert datasets[name]["status"] == "EVALUATED"
        assert datasets[name]["cols_detected"] > 0
        assert datasets[name]["rows_evaluated"] > 0
