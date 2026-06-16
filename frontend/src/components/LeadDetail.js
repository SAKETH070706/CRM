import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const LeadDetail = ({ lead, fetchLeads, onClose, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: lead.name,
    email: lead.email,
    phone: lead.phone || '',
    source: lead.source,
    status: lead.status
  });
  const [note, setNote] = useState('');

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

 const handleSaveEdit = async () => {
  try {
    await axios.put(`${BACKEND_URL}/api/leads/${lead._id}`, editData);
    setIsEditing(false);
  } catch (err) { console.error(err); }
};

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${BACKEND_URL}/api/leads/${lead._id}`, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await axios.post(`${BACKEND_URL}/api/leads/${lead._id}/notes`, { text: note });
      setNote('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="lead-detail">
      <div className="detail-header">
        <h2>{lead.name}</h2>
        <div className="detail-actions">
          {(user?.role === 'admin' || lead.userId?._id?.toString() === user?.id?.toString()) && (
            <button onClick={() => setIsEditing(!isEditing)} className="btn-edit">
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          )}
          <button onClick={onClose} className="btn-close">Close</button>
        </div>
      </div>

      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={editData.email}
              onChange={handleEditChange}
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={editData.phone}
              onChange={handleEditChange}
            />
          </div>
          <div className="form-group">
            <label>Source:</label>
            <select name="source" value={editData.source} onChange={handleEditChange}>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Social Media">Social Media</option>
              <option value="Cold Call">Cold Call</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status:</label>
            <select name="status" value={editData.status} onChange={handleEditChange}>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
            </select>
          </div>
          <button onClick={handleSaveEdit} className="btn-save">Save Changes</button>
        </div>
      ) : (
        <div className="lead-info">
          <p><strong>Email:</strong> {lead.email}</p>
          <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
          <p><strong>Source:</strong> {lead.source}</p>
          <p><strong>Status:</strong>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={!(user?.role === 'admin' || lead.userId?._id?.toString() === user?.id?.toString())}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
            </select>
          </p>
          {user?.role === 'admin' && lead.userId && (
            <p><strong>Owner:</strong> {lead.userId.name} ({lead.userId.email})</p>
          )}
          <p><strong>Created:</strong> {new Date(lead.createdAt).toLocaleDateString()}</p>
          <p><strong>Updated:</strong> {new Date(lead.updatedAt).toLocaleDateString()}</p>
        </div>
      )}

      <div className="notes-section">
        <h3>Notes</h3>
        <ul className="notes-list">
          {lead.notes.map((n, index) => (
            <li key={index} className="note-item">
              <div className="note-text">{n.text}</div>
              <div className="note-date">{new Date(n.date).toLocaleString()}</div>
            </li>
          ))}
        </ul>
        {(user?.role === 'admin' || lead.userId?._id?.toString() === user?.id?.toString()) && (
          <div className="add-note">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              rows="3"
            />
            <button onClick={handleAddNote} disabled={!note.trim()}>
              Add Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDetail;