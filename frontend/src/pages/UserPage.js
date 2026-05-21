import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { userService, departmentService, programmeService } from '../services/api';
import './MasterScreen.css';

const UserPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [, setDepartments] = useState([]);
  const [, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'User',
    department: '',
    programme: ''
  });
  const [editingId, setEditingId] = useState(null);

  const roles = ['SuperAdmin', 'User', 'Networking Staff', 'Plumber', 'Electrician', 'Software Developer', 'Application', 'PC Hardware'];

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userRes, deptRes, progRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
        programmeService.getAll()
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
      setProgrammes(progRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!editingId) {
        if (!submitData.password) {
          setError('Password is required for new users');
          return;
        }
      } else {
        if (!submitData.password) {
          delete submitData.password;
        }
      }

      // Remove department/programme from payload when not used
      if (submitData.department === '') delete submitData.department;
      if (submitData.programme === '') delete submitData.programme;

      if (editingId) {
        await userService.update(editingId, submitData);
      } else {
        await userService.create(submitData);
      }
      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'User',
        department: '',
        programme: ''
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (userData) => {
    setFormData({
      username: userData.username,
      email: userData.email,
      phone: userData.phone,
      password: '',
      role: userData.role,
      department: userData.department?._id || userData.department || '',
      programme: userData.programme?._id || userData.programme || ''
    });
    setEditingId(userData._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await userService.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  if (loading) return <div className="master-screen"><p>Loading...</p></div>;

  return (
    <div className="master-screen">
      <div className="screen-header">
        <h1>User Management</h1>
        {user?.role === 'SuperAdmin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add User'}
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && user?.role === 'SuperAdmin' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <button className="modal-close" onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setFormData({ username: '', email: '', phone: '', password: '', role: 'User', department: '', programme: '' });
            }}>✕</button>
            <form onSubmit={handleSubmit} className="master-form" style={{ marginBottom: 0 }}>
              <h2>{editingId ? 'Edit Identity' : 'Secure Integration'}</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Access Username</label>
                  <input
                    type="text"
                    placeholder="Enter unique ID"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Secure Email</label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Protocol</label>
                  <input
                    type="tel"
                    placeholder="+91 ...."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Access Key {editingId && '(encrypted)'}</label>
                  <input
                    type="password"
                    placeholder={editingId ? "Leave blank to preserve" : "Enter master password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingId}
                  />
                </div>
                <div className="form-group">
                  <label>Privilege Level</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '3rem' }}>
                <button type="submit" className="btn-primary">
                  {editingId ? 'VALIDATE CHANGES' : 'AUTHORIZE USER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="master-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Department</th>
              {user?.role === 'SuperAdmin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((userData) => (
              <tr key={userData._id}>
                <td>{userData.username}</td>
                <td>{userData.email}</td>
                <td>{userData.phone}</td>
                <td>{userData.role}</td>
                <td>{userData.department?.name || '-'}</td>
                {user?.role === 'SuperAdmin' && (
                  <td>
                    <button onClick={() => handleEdit(userData)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(userData._id)} className="btn-delete">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserPage;
