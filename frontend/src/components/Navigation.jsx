import React from 'react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'OVERVIEW', label: 'Overview' },
    { id: 'LIVE_MONITOR', label: 'Live Monitor' },
    { id: 'DATA_INTELLIGENCE', label: 'Data Intelligence' },
    { id: 'AI_AUTHORIZATIONS', label: 'AI / Authorizations' },
    { id: 'CARE_MANAGEMENT', label: 'Care Management' },
    { id: 'DECISION_IMPACT', label: 'Decision Impact' },
  ];

  return (
    <nav style={{
      display: 'flex',
      gap: '8px',
      borderBottom: '1px solid #334155',
      marginBottom: '24px',
      overflowX: 'auto',
      paddingBottom: '4px'
    }}>
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? '#38bdf8' : '#94a3b8',
              backgroundColor: isActive ? '#1e293b' : 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
