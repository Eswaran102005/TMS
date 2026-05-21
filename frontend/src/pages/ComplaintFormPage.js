import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { complaintService, blockService, roomService, departmentService } from '../services/api';
import './MasterScreen.css';

const complaintTypes = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

const ComplaintFormPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const resp = await departmentService.getAll();
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setDepartments(list);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load departments');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch blocks when department is selected
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!departmentId) {
        setBlocks([]);
        setBlockId('');
        return;
      }
      setLoadingData(true);
      try {
        const resp = await blockService.getAll({ departmentId });
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setBlocks(list);
      } catch (err) {
        console.error('Failed to fetch blocks:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load blocks');
      } finally {
        setLoadingData(false);
      }
    };
    fetchBlocks();
    setBlockId('');
    setRoomId('');
    setFilteredRooms([]);
  }, [departmentId]);

  // Fetch rooms when block is selected
  useEffect(() => {
    const fetchRooms = async () => {
      if (!blockId) {
        setFilteredRooms([]);
        setRoomId('');
        return;
      }
      setLoadingData(true);
      try {
        const resp = await roomService.getAll({ blockId });
        const data = resp.data;
        const list = Array.isArray(data) ? data : (data?.data || []);
        setFilteredRooms(list);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load rooms');
      } finally {
        setLoadingData(false);
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);
  const [type, setType] = useState(complaintTypes[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only allow SuperAdmin and regular Users to create complaints
  if (user && !['SuperAdmin', 'User'].includes(user.role)) {
    return (
      <div className="master-screen">
        <div className="card">
          <h2>Raise Complaint</h2>
          <div className="error-message">You do not have permission to raise complaints.</div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedDepartment = departments.find((d) => d._id === departmentId);
      const selectedBlock = blocks.find((b) => b._id === blockId);
      const selectedRoom = filteredRooms.find((r) => r._id === roomId);

      // validate room or custom room number
      const finalRoomNumber = roomId === '__manual__' ? customRoomNumber : (selectedRoom?.roomNumber || '');
      if (!finalRoomNumber) {
        setError('Please select a room or enter a room number');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('departmentName', selectedDepartment?.name || '');
      formData.append('blockName', selectedBlock?.name || '');
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks);
      if (attachment) formData.append('attachment', attachment);
      // user details come from token (backend should use req.user)
      // but include user id here as convenience
      if (user?.id) formData.append('userId', user.id);

      await complaintService.create(formData);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>Secure Intake <span className="dot">.</span></h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="master-form animate-slide-up">
        <h2>Incident Documentation</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Academic Entity / Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required disabled={loadingData}>
              <option value="">-- Choose Origin --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Structural Block</label>
            <select value={blockId} onChange={(e) => setBlockId(e.target.value)} required disabled={!departmentId || loadingData}>
              <option value="">-- Choose Wing --</option>
              {blocks.map((block) => (
                <option key={block._id} value={block._id}>
                  {block.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Target Room Asset</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={!blockId || loadingData}>
              <option value="">-- Locate Station --</option>
              {filteredRooms.map((room) => {
                const blockName = room.block?.name || (blocks.find(b => String(b._id) === String(room.block))?.name) || '';
                const label = blockName ? `${blockName} - ${room.roomNumber}` : room.roomNumber;
                return (
                  <option key={room._id} value={room._id}>
                    {label}
                  </option>
                );
              })}
              <option value="__manual__">Manual Override (Other)</option>
            </select>
          </div>

          {(roomId === '__manual__' || filteredRooms.length === 0) && (
            <div className="form-group">
              <label>Manual Room Identifier</label>
              <input value={customRoomNumber} onChange={(e) => setCustomRoomNumber(e.target.value)} placeholder="e.g. R-101" required />
            </div>
          )}

          <div className="form-group">
            <label>Service Category</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {complaintTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Evidence Upload (Optional)</label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="file-input" />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '3rem' }}>
          <label>Technical Remarks & Description</label>
          <textarea
            style={{ minHeight: '150px' }}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Describe the technical anomaly in detail..."
          />
        </div>

        <div style={{ marginTop: '4rem' }}>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'PROCESSING...' : 'AUTHORIZE SUBMISSION'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintFormPage;
