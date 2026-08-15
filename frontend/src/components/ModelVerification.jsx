import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Cpu, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';


const NORMAL_TEST_PAYLOAD = {
  auth_id: 'VERIFY_NORMAL_001',
  ml_req_units: 2.0,
  ml_aprvd_units: 2.0,
  ml_units_diff: 0.0,
  ml_units_ratio: 1.0,
  ml_latency_hours: 12.0,
  ml_bene_carrier_cnt: 1.0,
  ml_bene_outpatient_cnt: 0.0,
  ml_bene_pde_cnt: 2.0,
  ml_bene_total_utilization: 5.0,
  ml_bene_gender: 1.0,
  ml_bene_race: 1.0,
  ml_bene_age: 68.0,
  ml_prov_partd_clms: 15.0,
  ml_prov_partd_cost: 450.0,
  ml_prov_avg_cost_per_clm: 30.0,
  has_partd_provider_match: 1.0
};

const ANOMALY_TEST_PAYLOAD = {
  auth_id: 'VERIFY_ANOMALY_001',
  ml_req_units: 180.0,
  ml_aprvd_units: 1.0,
  ml_units_diff: 179.0,
  ml_units_ratio: 180.0,
  ml_latency_hours: 780.0,
  ml_bene_carrier_cnt: 5.0,
  ml_bene_outpatient_cnt: 2.0,
  ml_bene_pde_cnt: 10.0,
  ml_bene_total_utilization: 150.0,
  ml_bene_gender: 1.0,
  ml_bene_race: 1.0,
  ml_bene_age: 78.0,
  ml_prov_partd_clms: 100.0,
  ml_prov_partd_cost: 25000.0,
  ml_prov_avg_cost_per_clm: 600.0,
  has_partd_provider_match: 0.0
};

export default function ModelVerification({ onVerificationComplete }) {
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState(null); // 'NORMAL' or 'ANOMALY'
  const [apiResult, setApiResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const runTest = async (testType) => {
    setLoading(true);
    setError(null);
    setActiveTest(testType);

    const payload = testType === 'NORMAL' ? NORMAL_TEST_PAYLOAD : ANOMALY_TEST_PAYLOAD;

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 10000);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Verification API call failed.');
      }

      const data = await response.json();
      setApiResult(data);
      if (onVerificationComplete) {
        onVerificationComplete(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cpu size={22} color="#06b6d4" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>ML Model Verification Suite</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Test frozen backend model prediction outputs (<code style={{ color: '#38bdf8' }}>POST /api/predict</code>, threshold 0.81)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => runTest('NORMAL')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: activeTest === 'NORMAL' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading && activeTest === 'NORMAL' ? <Loader2 size={15} className="spin" /> : <ShieldCheck size={15} />}
            Test Normal Authorization
          </button>

          <button
            onClick={() => runTest('ANOMALY')}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              background: activeTest === 'ANOMALY' ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.12)',
              color: '#f472b6',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading && activeTest === 'ANOMALY' ? <Loader2 size={15} className="spin" /> : <AlertTriangle size={15} />}
            Test Anomalous Authorization
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Verification Output Panel */}
      {apiResult ? (
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#10b981" />
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                Backend ML Response Verified for <code className="mono" style={{ color: '#38bdf8' }}>{apiResult.auth_id}</code>
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Source: <code style={{ color: '#38bdf8' }}>POST /api/predict</code>
            </span>
          </div>

          {/* Grid Displaying Response Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            
            {/* 1. ML Prediction */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ML Prediction</div>
              <span className={`badge badge-${(apiResult.prediction || 'NORMAL').toLowerCase()}`}>
                {apiResult.prediction}
              </span>
            </div>

            {/* 2. ML Probability */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ML Probability</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
                {(apiResult.probability * 100).toFixed(1)}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>({apiResult.probability})</span>
              </div>
            </div>

            {/* 3. ML Threshold */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ML Threshold</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#38bdf8' }}>0.81 (81.0%)</div>
            </div>

            {/* 4. Final Priority */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Final Priority</div>
              <span className={`badge badge-${(apiResult.final_priority || 'LOW').toLowerCase()}`}>
                {apiResult.final_priority}
              </span>
            </div>

            {/* 5. SLA Risk */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SLA Risk</div>
              <span className={`badge badge-${(apiResult.sla_risk || 'LOW').toLowerCase()}`}>
                {apiResult.sla_risk}
              </span>
            </div>

            {/* 6. Rule Violations */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Rule Violations</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: apiResult.rule_violations_count > 0 ? '#f87171' : '#34d399' }}>
                {apiResult.rule_violations_count || 0}
              </div>
            </div>

            {/* 7. Inference Latency */}
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Inference Latency</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#c084fc' }}>
                {apiResult.inference_latency_ms} ms
              </div>
            </div>

          </div>

          {/* Reasons List */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Returned Decision Reasons ({apiResult.reasons?.length || 0}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(apiResult.reasons || []).map((reason, idx) => (
                <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', fontSize: '0.8rem', color: '#e5e7eb' }}>
                  • {reason}
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Raw API Response Section */}
          <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
            >
              {showRawJson ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showRawJson ? 'Hide Raw API Response' : 'View Raw API Response'}
            </button>

            {showRawJson && (
              <pre className="mono" style={{ marginTop: '10px', padding: '14px', borderRadius: '8px', background: '#0b0f19', border: '1px solid var(--border-card)', fontSize: '0.75rem', color: '#34d399', overflowX: 'auto' }}>
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            )}
          </div>

        </div>
      ) : (
        <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
          Click one of the verification buttons above to execute a live test request against <code style={{ color: '#38bdf8' }}>POST /api/predict</code>.
        </div>
      )}

    </div>
  );
}
