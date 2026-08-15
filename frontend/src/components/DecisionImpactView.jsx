import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';
import { RefreshCw, Database } from 'lucide-react';

export default function DecisionImpactView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const url = force
      ? `${API_BASE_URL}/decision-impact/refresh`
      : `${API_BASE_URL}/decision-impact/report`;
    const method = force ? 'POST' : 'GET';

    console.log("[DecisionImpact] requesting:", url);
    try {
      const response = await fetchWithTimeout(url, { method }, 15000);
      console.log("[DecisionImpact] HTTP:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const d = await response.json();
      console.log("[DecisionImpact] response:", d);
      setData(d);
      setError(null);
    } catch (err) {
      console.error("[DecisionImpact] failed:", err);
      setError(err.message || "Unable to load decision impact report");
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
        <span>Loading Downstream Decision Impact Analysis...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#451a1a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ display: 'block', fontSize: '15px', color: '#f87171' }}>Unable to load Decision Impact report</strong>
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
        </div>
        <button onClick={() => fetchReport(false)} style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const impacts = data?.impacts || [];
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
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>Downstream Business Decision Impact Mapping</h2>
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
            Predictive mapping of data quality, freshness, domain findings, and AI anomalies to payer business domains &bull; <span style={{ color: '#cbd5e1' }}>Last audited: {generatedAt}</span>
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

      {/* Impact Area Distribution Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {Object.entries(summary.impact_area_distribution || {}).map(([area, count]) => (
          <div key={area} style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{area}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#38bdf8' }}>{count} Potential Impacts</div>
          </div>
        ))}
      </div>

      {/* Impacts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {impacts.map((imp, idx) => (
          <div key={idx} style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#1e3a8a',
                  color: '#93c5fd'
                }}>
                  {imp.impact_area}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>
                  Potential Impact: {imp.source_issue}
                </span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: imp.severity === 'CRITICAL' ? '#7f1d1d' : (imp.severity === 'HIGH' ? '#991b1b' : '#065f46'),
                color: imp.severity === 'CRITICAL' ? '#fca5a5' : (imp.severity === 'HIGH' ? '#fca5a5' : '#86efac')
              }}>
                {imp.severity} Severity ({(imp.confidence_score * 100).toFixed(0)}% Confidence)
              </span>
            </div>

            <p style={{ margin: '0 0 12px', color: '#cbd5e1', fontSize: '13.5px' }}>
              <strong>Potential Business Consequence:</strong> {imp.reason}
            </p>

            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#4ade80' }}>
              <strong>Recommended Review Action:</strong> {imp.recommended_action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
