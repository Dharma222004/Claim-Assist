import React from 'react';
import { Database, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

export default function MetricCards({ stats }) {
  const total = stats.total_requests || 0;
  const normal = stats.normal_count || 0;
  const anomaly = stats.anomaly_count || 0;
  const anomalyRate = total > 0 ? ((anomaly / total) * 100).toFixed(1) : '0.0';

  const criticalHigh = (stats.priority_distribution?.CRITICAL || 0) + (stats.priority_distribution?.HIGH || 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {/* 1. Total Requests */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Total Requests</span>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Database size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
          {total.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Persisted in SQLite</div>
      </div>

      {/* 2. Normal Count */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Normal Authorizations</span>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <ShieldCheck size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#34d399', marginBottom: '4px' }}>
          {normal.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {total > 0 ? ((normal / total) * 100).toFixed(1) : '0.0'}% of total
        </div>
      </div>

      {/* 3. Anomaly Count */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>ML Anomaly Detections</span>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f472b6', marginBottom: '4px' }}>
          {anomaly.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ color: '#f472b6', fontWeight: '600' }}>{anomalyRate}%</span> anomaly rate (&ge;0.81 threshold)
        </div>
      </div>

      {/* 4. Critical & High Priority */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Critical / High Priority</span>
          <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <Flame size={18} />
          </div>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f87171', marginBottom: '4px' }}>
          {criticalHigh.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Hybrid Risk Matrix classification
        </div>
      </div>
    </div>
  );
}
