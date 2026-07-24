import { useState, useEffect } from 'react';
import { Star, MessageSquare, AlertCircle, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import './ReviewModal.css';

export default function ReviewModal({ isOpen, session, onClose, onSuccess }) {
  const user = useAuthStore(state => state.user);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoverRating(0);
      setComment('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen || !session) return null;

  const isTeacher = session.teacher_id === user?.id;
  
  // Teachers don't rate learners yet, but we show them a success modal for completing the session
  if (isTeacher) {
    return (
      <div className="modal-backdrop">
        <div className="modal-panel animate-slide-in" style={{ animation: 'scale-in 0.2s ease forwards' }}>
          <div className="modal-body flex-col items-center text-center gap-md py-xl" style={{paddingTop: 'var(--space-2xl)'}}>
            <div className="icon-circle bg-success-muted text-success" style={{width: 64, height: 64, margin: '0 auto'}}>
               <CheckCircle size={32} />
            </div>
            <h2 className="font-2xl mt-sm text-primary">Session Completed!</h2>
            <p className="text-secondary mb-lg">
              Great job! Your teaching session has been marked as completed. The credit has been added to your ledger.
            </p>
            <button className="btn-primary w-full" onClick={onSuccess}>
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/reviews`, {
        sessionId: session.id,
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel animate-slide-in" style={{ animation: 'scale-in 0.2s ease forwards' }}>
        
        {success ? (
          <div className="modal-body flex-col items-center text-center gap-md py-xl" style={{paddingTop: 'var(--space-2xl)'}}>
            <div className="icon-circle bg-success-muted text-success" style={{width: 64, height: 64, margin: '0 auto'}}>
               <CheckCircle size={32} />
            </div>
            <h2 className="font-2xl mt-sm text-primary">Review Submitted!</h2>
            <p className="text-secondary">
              Thank you for your feedback.
            </p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3 className="modal-title">Rate your session</h3>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <p className="modal-description text-center">
                How was your session with <strong>{session.teacher_name}</strong>?
              </p>

              <div className="star-rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="star-btn"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star 
                      size={36} 
                      fill={(hoverRating || rating) >= star ? 'var(--warning)' : 'transparent'}
                      color={(hoverRating || rating) >= star ? 'var(--warning)' : 'var(--border-strong)'}
                      className="transition-fast"
                    />
                  </button>
                ))}
              </div>
              <div className="text-center mt-sm mb-xl">
                 <span className="text-sm font-medium text-warning">
                   {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : rating === 5 ? 'Excellent' : 'Select rating'}
                 </span>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-xs">
                  <MessageSquare size={14} /> Written Feedback (Optional)
                </label>
                <textarea 
                  className="form-textarea"
                  placeholder="What did you like? How could they improve?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>

              {error && (
                <div className="auth-error mt-md">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-ghost" onClick={onClose} disabled={loading}>
                Skip
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading || rating === 0}>
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}
