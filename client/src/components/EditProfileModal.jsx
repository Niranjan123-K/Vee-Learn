import { useState, useEffect } from 'react';
import { X, User, FileText } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import './EditProfileModal.css';

export default function EditProfileModal({ isOpen, onClose, profileData, onSuccess }) {
  const [formData, setFormData] = useState({ name: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && profileData) {
      setFormData({
        name: profileData.name || '',
        bio: profileData.bio || ''
      });
      setError('');
    }
  }, [isOpen, profileData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.put('/users/profile', formData);
      
      // Update auth store with new name
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({ user: { ...currentUser, name: formData.name } });
      }

      onSuccess(res.data.user);
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel fade-in" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && <div className="alert alert-error text-danger text-sm">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="name" className="form-label">Display Name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="bio" className="form-label">Bio</label>
              <textarea
                id="bio"
                className="form-textarea"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows="4"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !formData.name.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
