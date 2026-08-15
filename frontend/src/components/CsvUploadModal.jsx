import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function CsvUploadModal({ onClose, onBatchSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [batchResult, setBatchResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8000/api/batch-predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to process CSV file.');
      }

      const data = await response.json();
      setBatchResult(data);
      if (onBatchSuccess) onBatchSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '28px', background: 'var(--bg-dark)', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={20} color="#c084fc" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff' }}>Batch CSV Authorization Ingestion</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!batchResult ? (
          <div>
            <div style={{ padding: '32px', border: '2px dashed var(--border-card)', borderRadius: '12px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', marginBottom: '20px' }}>
              <FileText size={40} color="#9ca3af" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '4px' }}>Select an Authorization CSV File</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>CSV will be processed through the exact same frozen ML &amp; Hybrid Risk pipeline</div>
              
              <input
                type="file"
                accept=".csv"
                id="csv-upload-input"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="csv-upload-input"
                style={{ padding: '8px 20px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'inline-block' }}
              >
                Choose CSV File
              </label>

              {file && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#38bdf8', fontWeight: '500' }}>
                  Selected: {file.name}
                </div>
              )}
            </div>

            {error && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'transparent', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: loading || !file ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: loading || !file ? 0.6 : 1 }}
              >
                {loading ? <><Loader2 size={16} className="spin" /> Processing Batch...</> : 'Process CSV Batch'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.9rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} /> Batch Processing Completed Successfully!
            </div>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Records</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff' }}>{batchResult.summary.total_records}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Anomalies Flagged</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f472b6' }}>{batchResult.summary.anomaly_count}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Latency</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#38bdf8' }}>{batchResult.summary.avg_inference_latency_ms} ms</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--accent-cyan)', color: '#fff', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                Close Summary
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
