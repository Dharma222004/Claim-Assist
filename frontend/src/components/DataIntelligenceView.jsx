import React, { useState } from 'react';
import DataQualityView from './DataQualityView';
import DataFreshnessView from './DataFreshnessView';
import CrossDomainView from './CrossDomainView';
import { Database, Clock, Network, ShieldAlert, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

export default function DataIntelligenceView() {
  const [subTab, setSubTab] = useState('DATA_QUALITY');

  const subTabs = [
    { 
      id: 'DATA_QUALITY', 
      label: 'Data Quality', 
      icon: Database,
      desc: 'Checks whether incoming healthcare records are complete, valid, unique and internally consistent.'
    },
    { 
      id: 'DATA_FRESHNESS', 
      label: 'Freshness & Timeliness', 
      icon: Clock,
      desc: 'Checks whether data is current and arriving within expected reporting and processing timeframes.'
    },
    { 
      id: 'CROSS_DOMAIN', 
      label: 'Cross-Domain Consistency', 
      icon: Network,
      desc: 'Checks whether related claims, pharmacy, beneficiary and provider data agree across domains where relationships are expected.'
    },
  ];

  const activeTabObj = subTabs.find(t => t.id === subTab) || subTabs[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Problem Statement & Core Business Context Banner */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #3b82f6',
        borderRadius: '10px',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <ShieldAlert size={20} color="#38bdf8" />
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: '700' }}>
            Data Intelligence Hub
          </h2>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.5' }}>
          Unified monitoring of incoming healthcare data quality, freshness, timeliness and cross-domain consistency before downstream payer decisions are affected.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <span style={{ fontWeight: '600', color: '#f1f5f9' }}>Validating Incoming Pipelines For:</span>
          {['Claims Analytics', 'Pharmacy Analytics', 'Quality Analytics', 'Authorization Workflow', 'Care Management'].map((target) => (
            <span key={target} style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '2px 8px',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              {target}
            </span>
          ))}
        </div>
      </div>

      {/* Visual Incoming Data Validation Pipeline */}
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '10px',
        padding: '16px 20px'
      }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', tracking: '0.05em', color: '#94a3b8', marginBottom: '12px', fontWeight: '700' }}>
          Unified Data Validation Architecture
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          alignItems: 'center'
        }}>
          {[
            { step: '1. INCOMING DATA', label: 'CMS Claims & Pharmacy', color: '#94a3b8' },
            { step: '2. QUALITY CHECK', label: 'Validity & Schema', color: '#0284c7' },
            { step: '3. FRESHNESS CHECK', label: 'Reporting Timeliness', color: '#0284c7' },
            { step: '4. CROSS-DOMAIN', label: 'Relational Integrity', color: '#0284c7' },
            { step: '5. DATA READINESS', label: 'Trust Verification', color: '#10b981' },
            { step: '6. PAYER OPS', label: 'Safe Downstream Use', color: '#8b5cf6' }
          ].map((item, idx, arr) => (
            <React.Fragment key={item.step}>
              <div style={{
                backgroundColor: '#1e293b',
                border: `1px solid ${item.color}`,
                borderRadius: '8px',
                padding: '10px 12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: item.color, fontWeight: '700', textTransform: 'uppercase' }}>
                  {item.step}
                </div>
                <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600', marginTop: '2px' }}>
                  {item.label}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Segmented Sub-tab Switcher & Description Header */}
      <div style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#0f172a',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid #334155',
          alignSelf: 'flex-start',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#0284c7' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Sub-Description */}
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#0f172a',
          borderRadius: '6px',
          borderLeft: '4px solid #0284c7',
          fontSize: '13px',
          color: '#cbd5e1'
        }}>
          <strong>{activeTabObj.label}:</strong> {activeTabObj.desc}
        </div>
      </div>

      {/* Active Sub-tab View */}
      <div>
        {subTab === 'DATA_QUALITY' && <DataQualityView />}
        {subTab === 'DATA_FRESHNESS' && <DataFreshnessView />}
        {subTab === 'CROSS_DOMAIN' && <CrossDomainView />}
      </div>
    </div>
  );
}
