import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';
import { RefreshCw, Database } from 'lucide-react';

export default function DataQualityView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const url = force
      ? `${API_BASE_URL}/data-quality/refresh?max_chunks=3`
      : `${API_BASE_URL}/data-quality/report?max_chunks=3`;
    const method = force ? 'POST' : 'GET';

    console.log("[DataQuality] requesting:", url);
    try {
      const response = await fetchWithTimeout(url, { method }, 15000);
      console.log("[DataQuality] HTTP:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const resultData = await response.json();
      console.log("[DataQuality] response:", resultData);
      setData(resultData);
      setError(null);
    } catch (err) {
      console.error("[DataQuality] failed:", err);
      setError(err.message || "Unable to load Data Quality report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReport(false);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <RefreshCw size={18} className="spin" />
        <span>Loading CMS Data Quality Engine Report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#451a1a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ display: 'block', fontSize: '15px', color: '#f87171' }}>Unable to load Data Quality report</strong>
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
        </div>
        <button onClick={() => fetchReport(false)} style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const datasets = data?.datasets || {};
  const meta = data?.metadata || {};
  const isCached = meta.cached ?? true;
  const generatedAt = meta.generated_at ? new Date(meta.generated_at).toLocaleString() : 'N/A';

  return (
    <div>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '24px',
        border: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>CMS Data Quality Engine Audit</h2>
            <span style={{
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isCached ? '#1e3a8a' : '#065f46',
              color: isCached ? '#93c5fd' : '#6ee7b7',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Database size={12} /> {isCached ? 'Cached audit' : 'Fresh audit'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Production-quality data validation across 7 raw CMS healthcare datasets &bull; <span style={{ color: '#cbd5e1' }}>Last audited: {generatedAt}</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => fetchReport(true)}
            disabled={refreshing}
            style={{
              backgroundColor: '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Auditing...' : 'Refresh Audit'}
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Overall Quality Score</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#38bdf8' }}>
              {summary.overall_cms_quality_score ?? 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 7 CMS Datasets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {Object.entries(datasets).map(([name, ds]) => {
          const mode = ds.evaluation_mode || 'SAMPLE';
          const score = ds.overall_quality_score || 0;
          const details = ds.details || {};

          return (
            <div key={name} style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>{name}</h3>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: mode === 'FULL_DATASET' ? '#065f46' : '#1e3a8a',
                    color: mode === 'FULL_DATASET' ? '#6ee7b7' : '#93c5fd'
                  }}>
                    {mode}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: score >= 90 ? '#4ade80' : '#facc15' }}>
                    {score}%
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Coverage: {ds.coverage_percentage}% ({ds.rows_evaluated?.toLocaleString()} / {ds.rows_available?.toLocaleString()} rows)
                  </span>
                </div>

                {/* Score Progress Bar */}
                <div style={{ backgroundColor: '#0f172a', height: '6px', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${score}%`,
                    height: '100%',
                    backgroundColor: score >= 90 ? '#22c55e' : '#eab308'
                  }} />
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
                  <div>Completeness: <strong>{ds.completeness_score}%</strong></div>
                  <div>Validity: <strong>{ds.validity_score}%</strong></div>
                  <div>Uniqueness: <strong>{ds.uniqueness_score}%</strong></div>
                  <div>Consistency: <strong>{ds.consistency_score}%</strong></div>
                </div>
              </div>

              {/* Categorized Cell Breakdown */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Required Missing:</span>
                  <strong style={{ color: details.required_missing_count > 0 ? '#f87171' : '#4ade80' }}>
                    {details.required_missing_count?.toLocaleString() || 0}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Optional Missing:</span>
                  <strong style={{ color: '#cbd5e1' }}>{details.optional_missing_count?.toLocaleString() || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CMS Privacy Suppressed:</span>
                  <strong style={{ color: details.suppressed_count > 0 ? '#38bdf8' : '#94a3b8' }}>
                    {details.suppressed_count?.toLocaleString() || 0}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
