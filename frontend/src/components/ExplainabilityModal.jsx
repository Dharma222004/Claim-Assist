import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertTriangle, Cpu, ShieldCheck, Clock, Layers, Sparkles, Bot, RotateCcw, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { fetchWithTimeout } from '../api';

export default function ExplainabilityModal({ record, onClose }) {
  const [llmResult, setLlmResult] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmStatusText, setLlmStatusText] = useState('');
  const [llmError, setLlmError] = useState(null);
  const pollTimerRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    isCancelledRef.current = false;
    return () => {
      isCancelledRef.current = true;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  if (!record) return null;

  const prio = record.final_priority || 'LOW';
  const pred = record.prediction || 'NORMAL';
  const prob = record.probability ? (record.probability * 100).toFixed(1) : '0.0';

  const prioClass = `badge-${prio.toLowerCase()}`;
  const predClass = `badge-${pred.toLowerCase()}`;
  const slaClass = `badge-${(record.sla_risk || 'LOW').toLowerCase()}`;

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const pollExplanationStatus = (requestId) => {
    stopPolling();

    let attempts = 0;
    let consecutiveErrors = 0;
    const maxAttempts = 75; // 75 * 800ms = 60s timeout

    console.log("[LLM] starting poll for requestId:", requestId);

    pollTimerRef.current = setInterval(async () => {
      if (isCancelledRef.current) {
        stopPolling();
        return;
      }

      attempts += 1;
      console.log(`[LLM] polling requestId: ${requestId} (attempt ${attempts})`);

      try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/llm/explanation/${requestId}`, {}, 5000);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        consecutiveErrors = 0;
        console.log(`[LLM] status response:`, data);

        if (isCancelledRef.current) {
          stopPolling();
          return;
        }

        if (data.status === 'SUCCESS') {
          stopPolling();
          setLlmResult(data);
          setLlmError(null);
          setLlmLoading(false);
        } else if (data.status === 'LLM_UNAVAILABLE') {
          stopPolling();
          setLlmResult(data);
          setLlmError(null);
          setLlmLoading(false);
        } else if (data.status === 'ERROR') {
          stopPolling();
          setLlmError(data.message || 'LLM explanation generation failed.');
          setLlmLoading(false);
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setLlmError('LLM explanation request timed out after 60s. Please click Retry.');
          setLlmLoading(false);
        }
      } catch (err) {
        console.error(`[LLM] poll error (attempt ${attempts}):`, err);
        consecutiveErrors += 1;

        if (consecutiveErrors >= 3 || attempts >= maxAttempts) {
          stopPolling();
          if (!isCancelledRef.current) {
            setLlmError(err.message || 'Failed to communicate with LLM status endpoint.');
            setLlmLoading(false);
          }
        }
      }
    }, 800);
  };

  const handleGenerateLlmExplanation = async () => {
    stopPolling();
    setLlmLoading(true);
    setLlmError(null);
    setLlmResult(null);
    setLlmStatusText('Generating evidence-grounded explanation via Llama 3.2 3B...');

    const authId = record.auth_id;
    console.log("[LLM] initiating request for authId:", authId);

    try {
      let res = await fetchWithTimeout(`${API_BASE_URL}/llm/explain/authorization/${authId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, 15000);

      let data;
      if (res.ok) {
        data = await res.json();
        console.log("[LLM] authorization endpoint response:", data);
      } else {
        // Fallback to manual payload if record not in DB yet
        const payload = {
          issue_type: 'AUTHORIZATION_ANOMALY',
          reference_id: authId,
          evidence: {
            auth_id: authId,
            prediction: pred,
            probability: record.probability,
            threshold: 0.81,
            final_priority: prio,
            sla_risk: record.sla_risk,
            rule_violations_count: record.rule_violations_count,
            existing_reasons: record.reasons || []
          }
        };
        const resManual = await fetchWithTimeout(`${API_BASE_URL}/llm/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }, 15000);
        if (resManual.ok) {
          data = await resManual.json();
        } else {
          throw new Error(`HTTP ${resManual.status}`);
        }
      }

      if (data.status === 'PROCESSING' && data.request_id) {
        pollExplanationStatus(data.request_id);
      } else if (data.status === 'SUCCESS') {
        setLlmResult(data);
        setLlmLoading(false);
      } else if (data.status === 'LLM_UNAVAILABLE') {
        setLlmResult(data);
        setLlmLoading(false);
      } else {
        setLlmError(data.message || 'Unexpected response status.');
        setLlmLoading(false);
      }
    } catch (err) {
      console.error("[LLM] initiation failed:", err);
      setLlmLoading(false);
      setLlmError(err.message || 'LLM service unreachable.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'var(--bg-dark)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-card)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', marginBottom: '4px' }}>Authorization Decision Audit</div>
            <h2 className="mono" style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff' }}>
              {record.auth_id}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Matrix Grid Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} color="#06b6d4" /> ML Inference Result
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${predClass}`}>{pred}</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>{prob}%</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>Threshold: 81.0%</div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} color="#8b5cf6" /> Final Priority
            </div>
            <div>
              <span className={`badge ${prioClass}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>{prio} Priority</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>Hybrid Risk Decision</div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#3b82f6" /> Business Rule Flags
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: record.rule_violations_count > 0 ? '#f87171' : '#34d399' }}>
              {record.rule_violations_count || 0} Triggered
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-card)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#f59e0b" /> SLA Urgency
            </div>
            <div>
              <span className={`badge ${slaClass}`}>{record.sla_risk || 'LOW'} SLA Risk</span>
            </div>
          </div>
        </div>

        {/* Human Readable Reasons */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
            Deterministic Rules & SLA Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(record.reasons || []).length === 0 ? (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> All policy rules, SLA timeframes, and ML metrics are within standard operating parameters.
              </div>
            ) : (
              (record.reasons || []).map((reason, idx) => (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)', color: '#e5e7eb', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertTriangle size={16} color="#fbbf24" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{reason}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Phase 5 Evidence-Grounded LLM Explanation Button */}
        <div style={{ marginBottom: '24px', borderTop: '1px solid var(--border-card)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} /> Evidence-Grounded LLM Explanation (Llama 3.2 3B)
            </h3>
            <button
              onClick={handleGenerateLlmExplanation}
              disabled={llmLoading}
              style={{
                backgroundColor: llmLoading ? '#0369a1' : '#0284c7',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: llmLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {llmLoading ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
              {llmLoading ? 'Generating...' : 'Generate AI Explanation'}
            </button>
          </div>

          {llmLoading && (
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', color: '#38bdf8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Loader2 size={16} className="spin" />
              <span>{llmStatusText || 'Generating evidence-grounded explanation...'}</span>
            </div>
          )}

          {llmError && (
            <div style={{ padding: '14px', background: '#451a1a', border: '1px solid #991b1b', color: '#fca5a5', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>LLM explanation unavailable:</strong> {llmError}</span>
              <button
                onClick={handleGenerateLlmExplanation}
                style={{ background: '#991b1b', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          )}

          {llmResult && llmResult.status === 'LLM_UNAVAILABLE' && !llmError && (
            <div style={{ padding: '16px', background: '#3f2c11', border: '1px solid #a16207', borderRadius: '8px', color: '#fde047', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>LLM explanation unavailable:</strong> {llmResult.message || 'Ollama server offline.'}</span>
              <button
                onClick={handleGenerateLlmExplanation}
                style={{ background: '#854d0e', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          )}

          {llmResult && llmResult.status === 'SUCCESS' && (
            <div style={{ background: '#0f172a', border: '1px solid #0284c7', borderRadius: '10px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0369a1', color: '#e0f2fe' }}>
                  AI-generated operational explanation
                </span>
                <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 'bold' }}>
                  Confidence: {((llmResult.confidence || 0) * 100).toFixed(0)}% ({llmResult.model})
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px', fontStyle: 'italic' }}>
                Disclaimer: LLM explanation is informational only and cannot modify ML prediction, risk priority, SLA status, or business-rule decisions.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div>
                  <strong style={{ color: '#f8fafc' }}>LIKELY CAUSE:</strong>
                  <p style={{ margin: '4px 0 0', color: '#e2e8f0' }}>{llmResult.likely_cause}</p>
                </div>
                <div>
                  <strong style={{ color: '#f8fafc' }}>BUSINESS IMPACT:</strong>
                  <p style={{ margin: '4px 0 0', color: '#e2e8f0' }}>{llmResult.business_impact}</p>
                </div>
                <div>
                  <strong style={{ color: '#4ade80' }}>RECOMMENDED FIX:</strong>
                  <p style={{ margin: '4px 0 0', color: '#e2e8f0' }}>{llmResult.recommended_fix}</p>
                </div>
                {llmResult.evidence_used?.length > 0 && (
                  <div>
                    <strong style={{ color: '#38bdf8' }}>EVIDENCE USED:</strong>
                    <ul style={{ margin: '4px 0 0', paddingLeft: '20px', color: '#94a3b8' }}>
                      {llmResult.evidence_used.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
