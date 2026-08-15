import React from 'react';
import { Radio, Eye, Clock, ShieldAlert } from 'lucide-react';

export default function LiveFeed({ liveEvents, onSelectRecord }) {
  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={18} color="#06b6d4" />
          <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>Real-Time Live Event Stream</h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Listening to <code style={{ color: '#38bdf8' }}>/ws/live</code>
        </span>
      </div>

      {liveEvents.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          <ShieldAlert size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <div>No live stream events received yet.</div>
          <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Click "Simulate Auth" above or perform an inference request to stream live events.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
          {liveEvents.map((evt, idx) => {
            const data = evt.data || {};
            const prio = data.final_priority || 'LOW';
            const pred = data.prediction || 'NORMAL';
            const prob = data.probability ? (data.probability * 100).toFixed(1) : '0.0';

            const prioClass = `badge-${prio.toLowerCase()}`;
            const predClass = `badge-${pred.toLowerCase()}`;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className="mono" style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>
                    {data.auth_id}
                  </span>
                  <span className={`badge ${predClass}`}>{pred}</span>
                  <span className={`badge ${prioClass}`}>{prio} Priority</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fff' }}>Prob: <strong>{prob}%</strong></div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {data.inference_latency_ms} ms
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectRecord(data)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.1)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <Eye size={13} /> Inspect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
