import React from 'react';
import axios from 'axios';

const LeadList = ({ leads, onSelectLead, user }) => {
  const handleDelete = async (leadId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await axios.delete(`http://localhost:5000/api/leads/${leadId}`);
        // Lead will be removed via socket.io real-time update
      } catch (err) {
        console.error('Error deleting lead:', err);
      }
    }
  };

  return (
    <div className="lead-list">
      <h2>Leads ({leads.length})</h2>
      <ul>
        {leads.map(lead => (
          <li key={lead._id} onClick={() => onSelectLead(lead)}>
            <div className="lead-item">
              <div className="lead-info">
                <h3>{lead.name}</h3>
                <p>{lead.email}</p>
                {lead.phone && <p>{lead.phone}</p>}
                <div className="lead-meta">
                  <span className={`status ${lead.status}`}>{lead.status}</span>
                  <span className="source">{lead.source}</span>
                  {user?.role === 'admin' && lead.userId && (
                    <span className="owner">Owner: {lead.userId.name}</span>
                  )}
                </div>
              </div>
              <div className="lead-actions">
                <button
                  onClick={(e) => handleDelete(lead._id, e)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeadList;