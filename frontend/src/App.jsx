import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import OverviewView from './components/OverviewView';
import DataIntelligenceView from './components/DataIntelligenceView';
import CareManagementView from './components/CareManagementView';
import DecisionImpactView from './components/DecisionImpactView';

import BeneficiarySearch from './components/BeneficiarySearch';

import MetricCards from './components/MetricCards';
import ModelVerification from './components/ModelVerification';
import LiveFeed from './components/LiveFeed';
import AuthorizationTable from './components/AuthorizationTable';
import ExplainabilityModal from './components/ExplainabilityModal';
import CsvUploadModal from './components/CsvUploadModal';
import SinglePredictModal from './components/SinglePredictModal';

import { API_BASE_URL, WS_URL } from './config';
import { fetchWithTimeout } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [stats, setStats] = useState({ total_requests: 0, normal_count: 0, anomaly_count: 0, priority_distribution: {} });
  const [predictions, setPredictions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  
  const [wsConnected, setWsConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSinglePredictOpen, setIsSinglePredictOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);

  const wsRef = useRef(null);

  // 1. Fetch Aggregated Stats
  const fetchStats = async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/stats`, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // 2. Fetch History Predictions
  const fetchPredictions = async (p = page, filter = priorityFilter) => {
    try {
      let url = `${API_BASE_URL}/predictions?page=${p}&page_size=10`;
      if (filter !== 'ALL') {
        url += `&priority=${filter}`;
      }
      const res = await fetchWithTimeout(url, {}, 10000);
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.items || []);
        setTotalRecords(data.total || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    }
  };


  // 3. Setup WebSocket Connection with auto-reconnect
  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event_type === 'NEW_PREDICTION') {
            setLiveEvents(prev => [msg, ...prev.slice(0, 49)]); // Keep last 50 events
            fetchStats();
            fetchPredictions(1, priorityFilter);
          } else if (msg.event_type === 'BATCH_COMPLETED') {
            fetchStats();
            fetchPredictions(1, priorityFilter);
          }
        } catch (e) {
          // Ignores non-JSON text frames
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPredictions(1, 'ALL');
    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPredictions(newPage, priorityFilter);
  };

  const handlePriorityFilterChange = (newFilter) => {
    setPriorityFilter(newFilter);
    setPage(1);
    fetchPredictions(1, newFilter);
  };

  // Simulate Auth Event Handler
  const handleSimulateEvent = async () => {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/stream/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, 10000);
      if (res.ok) {

        const result = await res.json();
        setLiveEvents(prev => [
          { event_type: 'NEW_PREDICTION', timestamp: new Date().toISOString(), data: result },
          ...prev.slice(0, 49)
        ]);
        fetchStats();
        fetchPredictions(1, priorityFilter);
      } else {
        console.error('Simulate Auth API error:', res.status);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px 40px' }}>
      {/* Header */}
      <Header
        wsConnected={wsConnected}
        onOpenSinglePredict={() => setIsSinglePredictOpen(true)}
        onOpenCsvUpload={() => setIsCsvUploadOpen(true)}
        onSimulateEvent={handleSimulateEvent}
        onRefreshStats={fetchStats}
      />

      {/* 8-Tab Navigation Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Content Views */}
      {activeTab === 'OVERVIEW' && (
        <OverviewView stats={stats} onNavigate={(tab) => setActiveTab(tab)} />
      )}

      {activeTab === 'LIVE_MONITOR' && (
        <div>
          <MetricCards stats={stats} />
          <LiveFeed liveEvents={liveEvents} onSelectRecord={(rec) => setSelectedRecord(rec)} />
        </div>
      )}

      {activeTab === 'DATA_INTELLIGENCE' && (
        <DataIntelligenceView />
      )}


      {activeTab === 'AI_AUTHORIZATIONS' && (
        <div>
          <MetricCards stats={stats} />
          <ModelVerification
            onVerificationComplete={() => {
              fetchStats();
              fetchPredictions(1, priorityFilter);
            }}
          />
          <AuthorizationTable
            predictions={predictions}
            total={totalRecords}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={handlePriorityFilterChange}
            onSelectRecord={(rec) => setSelectedRecord(rec)}
          />
        </div>
      )}

      {activeTab === 'CARE_MANAGEMENT' && (
        <div>
          <BeneficiarySearch />
          <CareManagementView />
        </div>
      )}

      {activeTab === 'DECISION_IMPACT' && (
        <div>
          <BeneficiarySearch />
          <DecisionImpactView />
        </div>
      )}

      {/* Modals */}
      {selectedRecord && (
        <ExplainabilityModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {isSinglePredictOpen && (
        <SinglePredictModal
          onClose={() => setIsSinglePredictOpen(false)}
          onSuccess={(res) => {
            fetchStats();
            fetchPredictions(1, priorityFilter);
          }}
        />
      )}

      {isCsvUploadOpen && (
        <CsvUploadModal
          onClose={() => setIsCsvUploadOpen(false)}
          onBatchSuccess={(data) => {
            fetchStats();
            fetchPredictions(1, priorityFilter);
          }}
        />
      )}
    </div>
  );
}
