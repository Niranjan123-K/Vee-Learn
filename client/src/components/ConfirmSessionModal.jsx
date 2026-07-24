import { useState, useEffect } from 'react';
import { Video, ExternalLink, Link as LinkIcon, Check, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import './ConfirmSessionModal.css';

export default function ConfirmSessionModal({ isOpen, onClose, sessionId, onSuccess, existingLink }) {
  const [meetingProvider] = useState('GOOGLE_MEET');
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMeetingLink(existingLink || '');
      setError('');
    }
  }, [isOpen, existingLink]);

  if (!isOpen) return null;

  const validateUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname === 'meet.google.com';
    } catch {
      return false;
    }
  };

  const handleConfirm = async () => {
    setError('');
    const url = meetingLink.trim();

    if (!url) {
      setError('Meeting link is required');
      return;
    }

    setIsValidating(true);
    if (!validateUrl(url)) {
      setError('Please provide a valid Google Meet link (https://meet.google.com/...)');
      setIsValidating(false);
      return;
    }
    setIsValidating(false);

    setLoading(true);
    try {
      await api.put(`/sessions/${sessionId}/confirm`, {
        meeting_provider: meetingProvider,
        meeting_link: url
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel animate-slide-in" style={{ animation: 'scale-in 0.2s ease forwards' }}>
        
        <div className="modal-header">
          <h3 className="modal-title">{existingLink ? 'Edit Meeting Link' : 'Confirm Session'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Generate a Google Meet link for this session and paste it below. 
            The learner will use this link to join the class.
          </p>

          <div className="modal-steps-box mb-lg">
            <ol className="modal-steps-list">
              <li>Open Google Meet in a new tab</li>
              <li>Click <strong>New Meeting</strong> → <strong>Create a meeting for later</strong></li>
              <li>Copy the generated link and paste it below</li>
            </ol>
            <a 
              href="https://meet.google.com/new" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-secondary btn-sm w-full mt-sm"
              style={{justifyContent: 'center'}}
            >
              Open Google Meet <ExternalLink size={14} />
            </a>
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-xs">
              <LinkIcon size={14} /> Google Meet Link
            </label>
            <input 
              type="url"
              className="form-input"
              value={meetingLink}
              onChange={(e) => {
                setMeetingLink(e.target.value);
                setError('');
              }}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
            />
            {error && <span className="form-error"><AlertCircle size={14}/> {error}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={loading || isValidating}>
            {loading ? 'Saving...' : existingLink ? 'Update Link' : 'Confirm & Save'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
