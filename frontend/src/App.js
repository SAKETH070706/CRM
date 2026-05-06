import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [leads, setLeads] = useState([]);
  const [socket, setSocket] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'register', 'dashboard'

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchLeads();

      // Initialize socket connection
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('join', user?.id);

      //listen for lead events
      newSocket.on('leadCreated', (lead) => {
        setLeads(prev => [lead, ...prev]);
      });

      newSocket.on('leadUpdated', (updatedLead) => {
        setLeads(prev => prev.map(lead =>
          lead._id === updatedLead._id ? updatedLead : lead
        ));
      });

      newSocket.on('leadDeleted', (deletedId) => {
        setLeads(prev => prev.filter(lead => lead._id !== deletedId));
      });

      return () => newSocket.close();
    }
  }, [token, user?.id]);

 const fetchLeads = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem("token"); // ✅ read token
    const res = await axios.get(`http://localhost:5000/api/leads?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setLeads(res.data.leads);
  } catch (err) {
    console.error("Error fetching leads:", err.response?.data?.message || err.message);
  }
};


  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setView('dashboard');
  };

 const handleRegister = (newToken, newUser) => {
  setToken(newToken);
  setUser(newUser);
  localStorage.setItem('token', newToken);
  localStorage.setItem('user', JSON.stringify(newUser));
  setView('dashboard'); // ✅ go straight to dashboard
};


  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    if (socket) socket.close();
    setView('login');
  };

  const switchToRegister = () => setView('register');
  const switchToLogin = () => setView('login');

  return (
    <div className="App">
      {!token ? (
        view === 'login' ? (
          <Login onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
        ) : (
          <Register onRegister={handleRegister} onSwitchToLogin={switchToLogin} />
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