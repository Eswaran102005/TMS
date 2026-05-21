import React, { useEffect, useState, useContext } from 'react';
import { complaintService, userService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const ComplaintsDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignTarget, setAssignTarget] = useState({ complaintId: null, assignee: '' });
  const [statusTarget, setStatusTarget] = useState({ complaintId: null, status: '' });

  useEffect(() => {
    const load = async () => {
      try {
        setListLoading(true);
        const res = await complaintService.getAll();
        setComplaints(res.data || []);
        try {
          const s = await complaintService.getStats();
          setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
        } catch (e) { }
      } catch (err) {
        setError('Failed to load complaints');
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      userService.getAll().then((res) => setUsers(res.data || [])).catch(() => { });
    }
  }, [user]);

  const refresh = async () => {
    try {
      const res = await complaintService.getAll();
      setComplaints(res.data || []);
      try {
        const s = await complaintService.getStats();
        setStats(s.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
      } catch (e) { }
    } catch (e) { }
  };

  const handleAssignClick = (id) => setAssignTarget({ complaintId: id, assignee: '' });
  const handleAssignSubmit = async () => {
    if (!assignTarget.assignee) return setError('Select an assignee');
    try {
      await complaintService.assign(assignTarget.complaintId, assignTarget.assignee);
      setAssignTarget({ complaintId: null, assignee: '' });
      refresh();
    } catch (err) { setError('Failed to assign'); }
  };

  const handleStatusClick = (id) => setStatusTarget({ complaintId: id, status: '' });
  const handleStatusSubmit = async () => {
    if (!statusTarget.status) return setError('Select a status');
    try {
      await complaintService.updateStatus(statusTarget.complaintId, statusTarget.status);
      setStatusTarget({ complaintId: null, status: '' });
      refresh();
    } catch (err) { setError('Failed to update status'); }
  };

  const handleClose = async (id) => {
    try {
      await complaintService.updateStatus(id, 'Closed');
      refresh();
    } catch (err) { setError('Failed to close'); }
  };

  return (
    <div className="master-screen">
      <div className="screen-header"><h1>Complaints Dashboard</h1></div>
      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-metrics">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Complaints</div>
            <div className="stat-indicator"></div>
          </div>
          <div className="stat-card pending">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
            <div className="stat-indicator"></div>
          </div>
          <div className="stat-card assigned">
            <div className="stat-value">{stats.assigned}</div>
            <div className="stat-label">Currently Assigned</div>
            <div className="stat-indicator"></div>
          </div>
          <div className="stat-card closed">
            <div className="stat-value">{stats.closed}</div>
            <div className="stat-label">Successfully Closed</div>
            <div className="stat-indicator"></div>
          </div>
        </div>

        {listLoading ? <p>Loading...</p> : (
          <div className="table-container">
            <table className="master-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Block</th>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Attachment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => {
                  const isAssignee = c.assignedTo && String(c.assignedTo._id || c.assignedTo) === String(user?.id || user?._id);
                  return (
                    <tr key={c._id}>
                      <td>{new Date(c.createdAt).toLocaleString()}</td>
                      <td>{c.blockName}</td>
                      <td>{c.roomNumber}</td>
                      <td>{c.complaintType}</td>
                      <td>{c.remarks || '-'}</td>
                      <td>{c.status}</td>
                      <td>{c.createdBy?.username || c.createdBy?.email || '-'}</td>
                      <td>{c.attachment ? (<a href={`http://localhost:5001${c.attachment}`} target="_blank" rel="noreferrer">View</a>) : '-'}</td>
                      <td>
                        <div className="actions-cell">
                          {(isAssignee || user?.role === 'SuperAdmin') && c.status !== 'Closed' && (
                            <button onClick={() => handleClose(c._id)} className="btn-edit" style={{ color: '#22c55e', borderColor: '#22c55e' }}>Complete</button>
                          )}
                          {user?.role === 'SuperAdmin' && (
                            <button onClick={() => handleAssignClick(c._id)} className="btn-edit">Assign</button>
                          )}
                          {(isAssignee || user?.role === 'SuperAdmin') && (
                            <button onClick={() => handleStatusClick(c._id)} className="btn-edit" style={{ color: 'var(--color-silver)', borderColor: 'var(--color-silver)' }}>Status</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignTarget.complaintId && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="modal-close" onClick={() => setAssignTarget({ complaintId: null, assignee: '' })}>✕</button>
            <div className="master-form" style={{ marginBottom: 0 }}>
              <h2>Dispatch Personnel</h2>
              <div className="form-group">
                <label>Available Field Staff</label>
                <select
                  value={assignTarget.assignee}
                  onChange={(e) => setAssignTarget({ ...assignTarget, assignee: e.target.value })}
                >
                  <option value="">-- Choose Staff Member --</option>
                  {users.filter(u => u.role !== 'SuperAdmin' && u.role !== 'User').map(u => (
                    <option key={u._id} value={u._id}>{u.username} — [{u.role}]</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: '3rem' }}>
                <button onClick={handleAssignSubmit} className="btn-primary">AUTHORIZE ASSIGNMENT</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusTarget.complaintId && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="modal-close" onClick={() => setStatusTarget({ complaintId: null, status: '' })}>✕</button>
            <div className="master-form" style={{ marginBottom: 0 }}>
              <h2>State Transition</h2>
              <div className="form-group">
                <label>Operational Status</label>
                <select
                  className="status-select"
                  value={statusTarget.status}
                  onChange={(e) => setStatusTarget({ ...statusTarget, status: e.target.value })}
                >
                  <option value="">-- Change State --</option>
                  <option value="Pending">Pending Review</option>
                  <option value="In-Progress">Active Maintenance</option>
                  <option value="Onhold">Sustained / Onhold</option>
                  <option value="Closed">Finalize / Closed</option>
                </select>
              </div>
              <div style={{ marginTop: '3rem' }}>
                <button onClick={handleStatusSubmit} className="btn-primary">UPDATE PROTOCOL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsDashboardPage;
