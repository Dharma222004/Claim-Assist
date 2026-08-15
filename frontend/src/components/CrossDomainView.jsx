import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';
import { RefreshCw, Database } from 'lucide-react';

export default function CrossDomainView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const url = force
      ? `${API_BASE_URL}/cross-domain/refresh`
      : `${API_BASE_URL}/cross-domain/report`;
    const method = force ? 'POST' : 'GET';

    console.log("[CrossDomain] requesting:", url);
    try {
      const response = await fetchWithTimeout(url, { method }, 15000);
      console.log("[CrossDomain] HTTP:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const d = await response.json();
      console.log("[CrossDomain] response:", d);
      setData(d);
      setError(null);
    } catch (err) {
      console.error("[CrossDomain] failed:", err);
      setError(err.message || "Unable to load cross-domain report");
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
        <span>Loading Cross-Domain Consistency Audit...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#451a1a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ display: 'block', fontSize: '15px', color: '#f87171' }}>Unable to load Cross-Domain report</strong>
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{error}</span>
        </div>
        <button onClick={() => fetchReport(false)} style={{ background: '#991b1b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const checks = data?.checks || [];
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
            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px' }}>Cross-Domain Consistency Engine Audit</h2>
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
            Domain key integrity, temporal post-death validation, and provider taxonomy alignment &bull; <span style={{ color: '#cbd5e1' }}>Last audited: {generatedAt}</span>
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
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Corrected Consistency Score</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4ade80' }}>
              {summary.overall_cross_domain_consistency_score ?? 100}%
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Actionable Violations</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: summary.actionable_violations > 0 ? '#f87171' : '#4ade80' }}>
            {summary.actionable_violations || 0}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Expected Differences</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#38bdf8' }}>
            {summary.expected_differences?.toLocaleString() || 0}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Informational Findings</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#cbd5e1' }}>
            {summary.informational_findings?.toLocaleString() || 0}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Not Linkable Checks</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#facc15' }}>
            {summary.checks_not_linkable || 0}
          </div>
        </div>
      </div>

      {/* Explanatory Panel */}
      <div style={{
        backgroundColor: '#0f2942',
        borderLeft: '4px solid #38bdf8',
        padding: '16px 20px',
        borderRadius: '6px',
        marginBottom: '24px',
        color: '#e0f2fe',
        fontSize: '13px'
      }}>
        <strong style={{ color: '#38bdf8' }}>Business Semantics Notice:</strong> Not all cross-domain differences are data-quality failures.
        Physician claim NPIs vs pharmacy Part D prescribers exhibit expected domain taxonomy differences (`EXPECTED_DIFFERENCE`), and multi-year prescriber changes represent normal annual provider turnover (`INFORMATIONAL`). Consistency scores are evaluated strictly from actionable data-quality violations.
      </div>

      {/* Check Table */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', color: '#cbd5e1' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '12px 10px' }}>Check Name</th>
              <th style={{ padding: '12px 10px' }}>Target Relationship</th>
              <th style={{ padding: '12px 10px' }}>Finding Classification</th>
              <th style={{ padding: '12px 10px' }}>Evaluation Mode</th>
              <th style={{ padding: '12px 10px' }}>Records Checked</th>
              <th style={{ padding: '12px 10px' }}>Actionable Violations</th>
              <th style={{ padding: '12px 10px' }}>Expected / Info Count</th>
            </tr>
          </thead>
          <tbody>
            {checks.map(c => {
              const fType = c.finding_type || c.status;
              let badgeColor = '#94a3b8';
              let badgeBg = '#1e293b';

              if (fType === 'ACTIONABLE_VIOLATION') { badgeColor = '#fca5a5'; badgeBg = '#7f1d1d'; }
              else if (fType === 'EXPECTED_DIFFERENCE') { badgeColor = '#93c5fd'; badgeBg = '#1e3a8a'; }
              else if (fType === 'INFORMATIONAL') { badgeColor = '#86efac'; badgeBg = '#065f46'; }
              else if (fType === 'NOT_LINKABLE_WITH_AVAILABLE_KEYS') { badgeColor = '#fde047'; badgeBg = '#713f12'; }

              return (
                <tr key={c.check_name} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#f8fafc' }}>{c.check_name}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{c.key_relationship_used}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', backgroundColor: badgeBg, color: badgeColor }}>
                      {fType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>{c.evaluation_mode || 'SAMPLE'} ({c.coverage_percentage || 0}%)</td>
                  <td style={{ padding: '12px 10px' }}>{c.records_checked?.toLocaleString() || 0}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: c.actionable_violations > 0 ? '#f87171' : '#4ade80' }}>
                    {c.actionable_violations || 0}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {(c.expected_differences || c.informational_findings || 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
