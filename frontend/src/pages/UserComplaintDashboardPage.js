import React, { useEffect, useState, useContext, useCallback } from 'react';
import { complaintService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './MasterScreen.css';

const UserComplaintDashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [myStats, setMyStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAll();
      const allComplaints = res.data || [];

      const userId = user?.id || user?._id;
      const userComplaints = allComplaints.filter((c) => {
        const createdById = c.createdBy?._id || c.createdBy;
        const assignedToId = c.assignedTo?._id || c.assignedTo;
        return (
          String(createdById) === String(userId) ||
          String(assignedToId) === String(userId)
        );
      });
      setComplaints(userComplaints);

      const stats = {
        total: userComplaints.length,
        pending: userComplaints.filter(c => c.status === 'Pending').length,
        assigned: userComplaints.filter(c => c.status === 'Assigned').length,
        closed: userComplaints.filter(c => c.status === 'Closed').length,
      };
      setMyStats(stats);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredComplaints = filterStatus === 'All'
    ? complaints
    : complaints.filter(c => c.status === filterStatus);

  const viewComplaintDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedStatus(complaint.status || '');
    setIsModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    try {
      if (!selectedStatus) return setError('Select a status');
      await complaintService.updateStatus(selectedComplaint._id, selectedStatus);
      await loadData();
      setIsModalOpen(false);
      setSelectedComplaint(null);
      setError('');
    } catch (err) {
      setError('Failed to update status');
    }
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Maintenance Hub <span className="dot">.</span></h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card total" onClick={() => setFilterStatus('All')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{myStats.total}</div>
          <div className="stat-label">All Assignments</div>
          <div className="stat-indicator"></div>
        </div>
        <div className="stat-card pending" onClick={() => setFilterStatus('Pending')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{myStats.pending}</div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-indicator"></div>
        </div>
        <div className="stat-card closed" onClick={() => setFilterStatus('Closed')} style={{ cursor: 'pointer' }}>
          <div className="stat-value">{myStats.closed}</div>
          <div className="stat-label">Finalized</div>
          <div className="stat-indicator"></div>
        </div>
      </div>

      <div className="table-section" style={{ marginTop: '4rem' }}>
        <div className="section-header">
          <h3>ARCHIVE: {filterStatus.toUpperCase()}</h3>
          {filterStatus !== 'All' && <button onClick={() => setFilterStatus('All')} className="btn-edit">Show All</button>}
        </div>

        <div className="table-container">
          <table className="master-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Timeline</th>
                <th>Ref Control</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => {
                const isStaff = c.assignedTo && String(c.assignedTo._id || c.assignedTo) === String(user?._id || user?.id);
                const isOwner = c.createdBy && String(c.createdBy._id || c.createdBy) === String(user?._id || user?.id);
                const canManage = user?.role === 'SuperAdmin' || isStaff || isOwner;

                return (
                  <tr key={c._id}>
                    <td>#{c._id.substring(18)}</td>
                    <td>{c.complaintType}</td>
                    <td>{c.blockName} — {c.roomNumber}</td>
                    <td>
                      <span className={`status-pill ${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="actions-cell">
                        <button onClick={() => viewComplaintDetails(c)} className="btn-edit">View Details</button>
                        {canManage && c.status !== 'Closed' && (
                          <button
                            onClick={() => viewComplaintDetails(c)}
                            className="btn-edit"
                            style={{ color: 'var(--color-coral)', borderColor: 'var(--color-coral)' }}
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-row">No records found for current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Detail & Status Modal */}
      {isModalOpen && selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            <div className="master-form" style={{ marginBottom: 0 }}>
              <div className="detail-header">
                <h2>Operational Protocol #{selectedComplaint._id.substring(18)}</h2>
              </div>

              <div className="form-grid">
                <div className="detail-item">
                  <label>Location context</label>
                  <div className="detail-value">{selectedComplaint.blockName} - Room {selectedComplaint.roomNumber}</div>
                </div>
                <div className="detail-item">
                  <label>Service Category</label>
                  <div className="detail-value">{selectedComplaint.complaintType}</div>
                </div>
              </div>

              <div className="detail-remarks">
                <label>Incident Documentation</label>
                <p>{selectedComplaint.remarks || "No additional remarks provided."}</p>
              </div>

              <div className="status-portal" style={{ marginTop: '3rem' }}>
                <label style={{ color: 'var(--color-coral)', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '1rem' }}>
                  State Transition
                </label>
                <div className="status-update-box">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="">-- Select New State --</option>
                    <option value="Pending">Pending</option>
                    <option value="In-Progress"> Process</option>
                    <option value="Onhold">Hold</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <button onClick={handleStatusUpdate} className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                    VALIDATE STATUS CHANGE
                  </button>
                </div>
              </div>

              {selectedComplaint.attachment && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <a href={`http://localhost:5001${selectedComplaint.attachment}`} target="_blank" rel="noreferrer" className="attachment-link">
                    DOWNLOAD ATTACHED EVIDENCE
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .detail-header { margin-bottom: 2rem; }
        .detail-item label, .detail-remarks label {
          display: block;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--color-silver);
          margin-bottom: 0.5rem;
        }
        .detail-value { font-size: 1.1rem; color: #fff; font-weight: 600; }
        .detail-remarks {
          margin-top: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 2px;
          border: 1px solid var(--border-light);
        }
        .detail-remarks p { color: var(--color-silver); line-height: 1.6; }
        .status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 1px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .status-pill.pending { background: rgba(242, 196, 206, 0.1); color: var(--color-pink); border: 1px solid var(--color-pink); }
        .status-pill.closed { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid #22c55e; }
        .status-pill.assigned, .status-pill.onhold { background: rgba(245, 143, 124, 0.1); color: var(--color-coral); border: 1px solid var(--color-coral); }
        .status-pill.in-progress { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid #fff; }

        .attachment-link {
          color: var(--color-coral);
          text-decoration: none;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--color-coral);
          padding-bottom: 2px;
        }
        .table-section { margin-top: 4rem; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .section-header h3 { font-size: 0.9rem; letter-spacing: 0.3em; color: var(--color-silver); }
        .empty-row { text-align: center; padding: 4rem !important; color: var(--color-slate); }
      `}</style>
    </div>
  );
};

export default UserComplaintDashboardPage;
