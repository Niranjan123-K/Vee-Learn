import { useState, useEffect } from 'react';
import { X, BookOpen, Target, AlignLeft } from 'lucide-react';
import api from '../utils/api';
import './AddSkillModal.css';

export default function AddSkillModal({ isOpen, onClose, type, onSuccess }) {
  const [formData, setFormData] = useState({ skill_name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isTeaching = type === 'teach';

  useEffect(() => {
    if (isOpen) {
      setFormData({ skill_name: '', description: '' });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/skills/user-skills', {
        skill_name: formData.skill_name,
        type: type,
        description: formData.description,
        proficiency: 'beginner'
      });
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add skill:', err);
      setError(err.response?.data?.error || 'Failed to add skill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel fade-in" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{isTeaching ? 'Add Teaching Skill' : 'Add Learning Goal'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && <div className="alert alert-error text-danger text-sm">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="skill_name" className="form-label">Skill Name</label>
              <input
                id="skill_name"
                type="text"
                className="form-input"
                value={formData.skill_name}
                onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                placeholder={isTeaching ? "e.g. React.js" : "e.g. Machine Learning"}
                required
              />
            </div>

            {isTeaching && (
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description (Optional)</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Describe your experience with this skill..."
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !formData.skill_name.trim()}>
              {loading ? 'Adding...' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
