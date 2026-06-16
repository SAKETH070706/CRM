import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [leads, setLeads] = useState([]);
  const [view, setView] = useState(token ? 'dashboard' : 'login');

  // Stable ref for socket — avoids re-creating it on every render
  const socketRef = useRef(null);

  // ─── Fetch leads (stable, memoised) ──────────────────────────────
  const fetchLeads = useCallback(async (params = {}, setTotalPages = null) => {
  const currentToken = localStorage.getItem('token');
  if (!currentToken) return;
  try {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
    ).toString();
    const res = await axios.get(`${BACKEND_URL}/api/leads?${query}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    setLeads(res.data.leads || []);
    if (setTotalPages && res.data.pagination) {
      setTotalPages(res.data.pagination.pages);
    }
  } catch (err) {
    console.error('Error fetching leads:', err.response?.data?.message || err.message);
  }
}, []);

  // ─── Socket lifecycle — only runs when token changes ─────────────
  useEffect(() => {
    // Tear down any existing socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!token) return;

    // Set axios default header for REST calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchLeads();

    // Pass the JWT in the handshake so the server can authenticate the socket
    const socket = io(BACKEND_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // ── Reconnect: re-fetch to get any missed events ────────────
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Refresh data on every (re-)connect so no updates are missed
      fetchLeads();
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // ── Lead events ─────────────────────────────────────────────
    socket.on('leadCreated', (lead) => {
      setLeads((prev) => {
        // Guard against duplicates (in case both socket and fetchLeads fire)
        if (prev.some((l) => l._id === lead._id)) return prev;
        return [lead, ...prev];
      });
    });

    socket.on('leadUpdated', (updatedLead) => {
      setLeads((prev) =>
        prev.map((lead) => (lead._id === updatedLead._id ? updatedLead : lead))
      );
    });

    socket.on('leadDeleted', (deletedId) => {
      setLeads((prev) => prev.filter((lead) => lead._id !== deletedId));
    });

    // ── Cleanup ─────────────────────────────────────────────────
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, fetchLeads]);

  // ─── Auth handlers ────────────────────────────────────────────────
  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setView('dashboard');
  };

  const handleRegister = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setView('dashboard');
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setLeads([]);
    setView('login');
  };

  return (
    <div className="App">
      {!token ? (
        view === 'login' ? (
          <Login onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />
        ) : (
          <Register onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />
        )
      ) : (
        <Dashboard
          leads={leads}
          user={user}
          onLogout={handleLogout}
          fetchLeads={fetchLeads}
        />
      )}
    </div>
  );
}

export default App;