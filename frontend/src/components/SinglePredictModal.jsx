import React, { useState } from 'react';
import { X, Play, Loader2 } from 'lucide-react';

export default function SinglePredictModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    auth_id: `AUTH_UI_${Math.floor(1000 + Math.random() * 9000)}`,
    ml_req_units: 50.0,
    ml_aprvd_units: 10.0,
    ml_latency_hours: 48.0,
    ml_bene_carrier_cnt: 2.0,
    ml_bene_outpatient_cnt: 1.0,
    ml_bene_pde_cnt: 5.0,
    ml_bene_total_utilization: 30.0,
    ml_bene_gender: 1.0,
    ml_bene_race: 1.0,
    ml_bene_age: 72.0,
    ml_prov_partd_clms: 50.0,
    ml_prov_partd_cost: 6000.0,
    ml_prov_avg_cost_per_clm: 120.0,
    has_partd_provider_match: 1.0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'auth_id' ? value : (value === '' ? '' : parseFloat(value) || 0)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Inference call failed.');
      }

      const result = await response.json();
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: 'var(--bg-dark)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Play size={20} color="#06b6d4" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>Run Custom Authorization Inference</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Auth ID</label>
              <input type="text" value={formData.auth_id} onChange={(e) => handleChange('auth_id', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Requested Units</label>
              <input type="number" step="any" value={formData.ml_req_units} onChange={(e) => handleChange('ml_req_units', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Approved Units</label>
              <input type="number" step="any" value={formData.ml_aprvd_units} onChange={(e) => handleChange('ml_aprvd_units', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Latency (Hours)</label>
              <input type="number" step="any" value={formData.ml_latency_hours} onChange={(e) => handleChange('ml_latency_hours', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Beneficiary Age</label>
              <input type="number" step="any" value={formData.ml_bene_age} onChange={(e) => handleChange('ml_bene_age', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }} />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Provider Part D Cost ($)</label>
              <input type="number" step="any" value={formData.ml_prov_partd_cost} onChange={(e) => handleChange('ml_prov_partd_cost', e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '0.85rem' }} />
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading ? <><Loader2 size={16} className="spin" /> Executing ML Pipeline...</> : 'Submit Authorization'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
