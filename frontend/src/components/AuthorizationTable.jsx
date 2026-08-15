import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, AlertCircle } from 'lucide-react';

export default function AuthorizationTable({ predictions, total, page, totalPages, onPageChange, priorityFilter, onPriorityFilterChange, onSelectRecord }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = (predictions || []).filter(item => 
    item.auth_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff' }}>Authorization History &amp; Decision Audit</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Historical record evaluations persisted in SQLite database</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search Auth ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'rgba(0, 0, 0, 0.2)', color: '#fff', fontSize: '0.85rem', width: '200px' }}
            />
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              value={priorityFilter}
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'rgba(18, 24, 38, 0.95)', color: '#fff', fontSize: '0.85rem' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px' }}>Auth ID</th>
              <th style={{ padding: '12px 16px' }}>Timestamp</th>
              <th style={{ padding: '12px 16px' }}>ML Prediction</th>
              <th style={{ padding: '12px 16px' }}>ML Prob</th>
              <th style={{ padding: '12px 16px' }}>SLA Risk</th>
              <th style={{ padding: '12px 16px' }}>Rule Flags</th>
              <th style={{ padding: '12px 16px' }}>Final Priority</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No authorization records found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const prioClass = `badge-${(item.final_priority || 'LOW').toLowerCase()}`;
                const predClass = `badge-${(item.prediction || 'NORMAL').toLowerCase()}`;
                const slaClass = `badge-${(item.sla_risk || 'LOW').toLowerCase()}`;
                const prob = item.probability ? (item.probability * 100).toFixed(1) : '0.0';

                return (
                  <tr key={item.id || item.auth_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#fff' }} className="mono">
                      {item.auth_id}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${predClass}`}>{item.prediction}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                      {prob}%
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${slaClass}`}>{item.sla_risk}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: item.rule_violations_count > 0 ? '#f87171' : 'var(--text-muted)', fontWeight: item.rule_violations_count > 0 ? '600' : '400' }}>
                      {item.rule_violations_count || 0} violations
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${prioClass}`}>{item.final_priority}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectRecord(item)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'rgba(139, 92, 246, 0.1)', color: '#c084fc', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} /> Explain
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing Page {page} of {totalPages || 1} ({total} total records)
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(255, 255, 255, 0.05)', color: page <= 1 ? 'var(--text-dim)' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'rgba(255, 255, 255, 0.05)', color: page >= totalPages ? 'var(--text-dim)' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
