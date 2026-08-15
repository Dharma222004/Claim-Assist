import React from 'react';
import { Activity, Upload, Play, RefreshCw, Zap } from 'lucide-react';

export default function Header({ wsConnected, onOpenSinglePredict, onOpenCsvUpload, onSimulateEvent, onRefreshStats }) {
  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            Final Anomaly System <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', marginLeft: '8px' }}>v2.0 Enterprise</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Frozen ML Inference (25 Features, 0.81 Threshold) &amp; Hybrid Risk Decision Matrix
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Connection Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', background: wsConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: wsConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className={wsConnected ? 'pulse-dot' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: wsConnected ? '#10b981' : '#ef4444' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: wsConnected ? '#34d399' : '#f87171' }}>
            {wsConnected ? 'WebSocket Live' : 'Disconnected'}
          </span>
        </div>

        <button
          onClick={onSimulateEvent}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)', color: '#fff', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}
        >
          <Zap size={15} color="#38bdf8" /> Simulate Auth
        </button>

        <button
          onClick={onOpenCsvUpload}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}
        >
          <Upload size={15} /> Batch CSV
        </button>

        <button
          onClick={onOpenSinglePredict}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)' }}
        >
          <Play size={15} /> Run Inference
        </button>
      </div>
    </header>
  );
}
