import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { getInitials, formatRelativeTime } from '../utils/formatters';
import './ReviewList.css';

export default function ReviewList({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
        <Star size={40} />
        <h3>No reviews yet</h3>
        <p>Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="review-list">
      {reviews.map((review, i) => (
        <motion.div
          key={review._id || i}
          className="review-item glass-card-static"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
        >
          <div className="review-header">
            <div className="review-user">
              {review.reviewer?.avatar ? (
                <img src={review.reviewer.avatar} alt="" className="avatar avatar-md" />
              ) : (
                <div className="avatar-fallback avatar-md">
                  {getInitials(review.reviewer?.name || 'User')}
                </div>
              )}
              <div>
                <h4 className="review-user-name">{review.reviewer?.name || 'Anonymous'}</h4>
                <span className="review-date">{formatRelativeTime(review.createdAt)}</span>
              </div>
            </div>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= review.rating ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="review-comment">{review.comment}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
