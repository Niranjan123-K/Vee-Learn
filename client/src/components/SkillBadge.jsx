import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import './SkillBadge.css';

const categoryColors = {
  programming: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' },
  languages: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  music: { bg: 'rgba(168, 85, 247, 0.15)', color: '#C084FC', border: 'rgba(168, 85, 247, 0.3)' },
  art: { bg: 'rgba(251, 146, 60, 0.15)', color: '#FB923C', border: 'rgba(251, 146, 60, 0.3)' },
  business: { bg: 'rgba(14, 165, 233, 0.15)', color: '#38BDF8', border: 'rgba(14, 165, 233, 0.3)' },
  cooking: { bg: 'rgba(244, 63, 94, 0.15)', color: '#FB7185', border: 'rgba(244, 63, 94, 0.3)' },
  fitness: { bg: 'rgba(234, 179, 8, 0.15)', color: '#FACC15', border: 'rgba(234, 179, 8, 0.3)' },
  design: { bg: 'rgba(236, 72, 153, 0.15)', color: '#F472B6', border: 'rgba(236, 72, 153, 0.3)' },
  default: { bg: 'rgba(108, 99, 255, 0.15)', color: '#8B83FF', border: 'rgba(108, 99, 255, 0.3)' },
};

export default function SkillBadge({ name, category, removable, onRemove, onClick, selected }) {
  const colors = categoryColors[category?.toLowerCase()] || categoryColors.default;

  return (
    <motion.span
      className={`skill-badge ${selected ? 'skill-badge-selected' : ''} ${onClick ? 'skill-badge-clickable' : ''}`}
      style={{
        '--skill-bg': colors.bg,
        '--skill-color': colors.color,
        '--skill-border': colors.border,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      layout
    >
      <span className="skill-badge-name">{name}</span>
      {removable && (
        <button
          className="skill-badge-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove ${name}`}
        >
          <X size={12} />
        </button>
      )}
    </motion.span>
  );
}
