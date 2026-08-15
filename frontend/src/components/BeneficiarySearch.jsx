import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';

export default function BeneficiarySearch() {
  const [beneId, setBeneId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!beneId.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const url = `${API_BASE_URL}/beneficiary/${encodeURIComponent(beneId.trim())}/decision-context`;
    console.log("[BeneficiarySearch] requesting:", url);
    try {
      const res = await fetchWithTimeout(url, {}, 10000);
      console.log("[BeneficiarySearch] HTTP:", res.status);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log("[BeneficiarySearch] response:", data);
      setResult(data);
    } catch (err) {
      console.error("[BeneficiarySearch] failed:", err);
      setError(err.message || 'Beneficiary lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '18px' }}>Beneficiary Decision Context Lookup</h3>
      <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '14px' }}>
        Search longitudinal Medicare beneficiary ID for unified cross-domain decision context & operational signals
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          value={beneId}
          onChange={(e) => setBeneId(e.target.value)}
          placeholder="Enter Beneficiary ID (e.g. SIM_001 or BENE_ID)..."
          style={{
            flex: 1,
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            color: '#f8fafc',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Searching...' : 'Search Context'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '16px', backgroundColor: '#451a1a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '6px', fontSize: '14px' }}>
          Lookup error: {error}
        </div>
      )}

      {result && result.status === 'NOT_AVAILABLE_WITH_SOURCE_DATA' && (
        <div style={{ padding: '16px', backgroundColor: '#3f2c11', border: '1px solid #a16207', color: '#fde047', borderRadius: '6px', fontSize: '14px' }}>
          <strong>Status: NOT_AVAILABLE_WITH_SOURCE_DATA</strong> — {result.message}
        </div>
      )}

      {result && result.status === 'AVAILABLE' && (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '16px' }}>
              Beneficiary Context: {result.beneficiary_id}
            </h4>
            <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold' }}>Data Available</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '14px', color: '#cbd5e1' }}>
            <div>AI Prediction: <strong style={{ color: '#f8fafc' }}>{result.unified_context?.ml_prediction}</strong></div>
            <div>Hybrid Risk Priority: <strong style={{ color: '#f8fafc' }}>{result.unified_context?.final_priority}</strong></div>
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#93c5fd', marginBottom: '16px' }}>
            <strong>Recommended Action:</strong> {result.unified_context?.recommended_action}
          </div>

          <h5 style={{ margin: '0 0 8px', color: '#f8fafc', fontSize: '14px' }}>Operational Care Management Signals:</h5>
          {result.unified_context?.operational_care_signals?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.unified_context.operational_care_signals.map((sig, i) => (
                <div key={i} style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', color: '#cbd5e1' }}>
                  <strong style={{ color: '#38bdf8' }}>{sig.signal_type}:</strong> {sig.evidence}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>No active care management risk signals for this beneficiary.</div>
          )}
        </div>
      )}
    </div>
  );
}
