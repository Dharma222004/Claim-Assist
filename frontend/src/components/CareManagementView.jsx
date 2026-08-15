import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';
import { RefreshCw, Database } from 'lucide-react';

export default function CareManagementView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const url = force
      ? `${API_BASE_URL}/care-management/refresh`
      : `${API_BASE_URL}/care-management/signals`;
    const method = force ? 'POST' : 'GET';

    console.log("[CareManagement] requesting:", url);
    try {
      const response = await fetchWithTimeout(url, { method }, 15000);
      console.log("[CareManagement] HTTP:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const d = await response.json();
      console.log("[CareManagement] response:", d);
      setData(d);
      setError(null);
    } catch (err) {
      console.error("[CareManagement] failed:", err);
      setError(err.message || "Unable to load care management signals");
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
        <span>Loading Operational Care Management Signals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#451a1a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ display: 'block', fontSize: '15px', color: '#f87171' }}>Unable to load Care Management signals</strong>
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
        </div>
        <button onClick={() => fetchReport(false)} style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const signals = data?.signals || [];
  const meta = data?.metadata || {};
  const isCached = meta.cached ?? true;
  const generatedAt = meta.generated_at ? new Date(meta.generated_at).toLocaleString() : 'N/A';

  return (
    <div>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '1px solid #334155',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>Operational Care Management Signals</h2>
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
            Administrative claims utilization alerts for care coordination and high-risk case management &bull; <span style={{ color: '#cbd5e1' }}>Last audited: {generatedAt}</span>
          </p>
        </div>
        <div>
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
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div style={{
        backgroundColor: '#3b0764',
        borderLeft: '4px solid #c084fc',
        padding: '14px 20px',
        borderRadius: '6px',
        marginBottom: '24px',
        color: '#f3e8ff',
        fontSize: '13px'
      }}>
        <strong>Operational Disclaimer:</strong> These are utilization-based operational administrative signals and are NOT medical diagnoses, clinical predictions, or health condition determinations.
      </div>

      {/* Signal Type Distribution Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(summary.signal_type_distribution || {}).map(([sType, count]) => (
          <div key={sType} style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sType}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#38bdf8' }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Signals List / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {signals.map((sig, idx) => {
          const isNotAvailable = sig.beneficiary_id === 'NOT_AVAILABLE_WITH_SOURCE_DATA';

          return (
            <div key={idx} style={{
              backgroundColor: '#1e293b',
              border: isNotAvailable ? '1px dashed #eab308' : '1px solid #334155',
              borderRadius: '10px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: isNotAvailable ? '#713f12' : '#065f46',
                    color: isNotAvailable ? '#fde047' : '#86efac'
                  }}>
                    {sig.signal_type}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f8fafc', fontFamily: 'monospace' }}>
                    Beneficiary ID: {sig.beneficiary_id}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: sig.severity === 'HIGH' ? '#7f1d1d' : '#1e3a8a',
                  color: sig.severity === 'HIGH' ? '#fca5a5' : '#93c5fd'
                }}>
                  {sig.severity} Severity
                </span>
              </div>

              <p style={{ margin: '0 0 8px', color: '#cbd5e1', fontSize: '13px' }}>
                <strong>Evidence:</strong> {sig.evidence}
              </p>

              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#93c5fd' }}>
                <strong>Recommended Review:</strong> {sig.recommended_review}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
