import React, { useState, useEffect } from 'react';
import LeadList from './LeadList';
import LeadDetail from './LeadDetail';
import AddLead from './AddLead';

const Dashboard = ({ leads, user, onLogout, fetchLeads }) => {
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLeads(
      { search: searchTerm, status: statusFilter, source: sourceFilter, page: currentPage },
      setTotalPages  // pass setter so fetchLeads can update pagination
    );
  }, [searchTerm, statusFilter, sourceFilter, currentPage, fetchLeads]);

  // Sync selectedLead when the leads array updates via socket
  useEffect(() => {
    if (!selectedLead) return;
    const updatedLead = leads.find((lead) => lead._id === selectedLead._id);
    if (updatedLead && updatedLead !== selectedLead) {
      setSelectedLead(updatedLead);
    }
  }, [leads, selectedLead]);

  const handleSearch = (e)       => { setSearchTerm(e.target.value); setCurrentPage(1); };
  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); setCurrentPage(1); };
  const handleSourceFilter = (e) => { setSourceFilter(e.target.value); setCurrentPage(1); };

  return (
    <div className="dashboard">
      <header>
        <div className="header-left">
          <h1>CRM Dashboard</h1>
          <div className="user-info">Welcome, {user?.name} ({user?.role})</div>
        </div>
        <div className="header-right">
          <button onClick={() => setShowAddLead(true)} className="btn-add-lead">+ Add Lead</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-bar">
          <input type="text" placeholder="Search leads..." value={searchTerm} onChange={handleSearch} />
        </div>
        <div className="filter-selects">
          <select value={statusFilter} onChange={handleStatusFilter}>
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="converted">Converted</option>
          </select>
          <select value={sourceFilter} onChange={handleSourceFilter}>
            <option value="">All Sources</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Cold Call">Cold Call</option>
          </select>
        </div>
      </div>

      <div className="content">
        <LeadList leads={leads} onSelectLead={setSelectedLead} user={user} />
        {selectedLead && (
          <LeadDetail
            lead={selectedLead}
            fetchLeads={fetchLeads}
            onClose={() => setSelectedLead(null)}
            user={user}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>Previous</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next</button>
        </div>
      )}

      {showAddLead && (
        <AddLead fetchLeads={fetchLeads} onClose={() => setShowAddLead(false)} />
      )}
    </div>
  );
};

export default Dashboard;