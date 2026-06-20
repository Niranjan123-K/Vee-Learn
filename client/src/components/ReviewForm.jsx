import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import './ReviewForm.css';

export default function ReviewForm({ onSubmit, isSubmitting }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit?.({ rating, comment });
    setRating(0);
    setComment('');
  };

  return (
    <motion.form
      className="review-form glass-card-static"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h4 className="review-form-title">Leave a Review</h4>

      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            className="review-star-btn"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Star
              size={28}
              className={
                star <= (hoveredRating || rating)
                  ? hoveredRating ? 'star-hovered' : 'star-filled'
                  : 'star-empty'
              }
            />
          </motion.button>
        ))}
        <span className="review-rating-text">
          {hoveredRating || rating || 0} / 5
        </span>
      </div>

      <textarea
        className="input-field"
        placeholder="Share your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />

      <button
        type="submit"
        className="gradient-btn"
        disabled={rating === 0 || isSubmitting}
      >
        <Send size={16} />
        <span>{isSubmitting ? 'Submitting...' : 'Submit Review'}</span>
      </button>
    </motion.form>
  );
}
