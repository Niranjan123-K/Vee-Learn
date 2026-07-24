import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatsCard.css';

export default function StatsCard({ icon: Icon, label, value, trend, trendValue, index = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    const duration = 1200;
    const startTime = Date.now();

    let animationFrameId;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(numValue * eased * 10) / 10);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(numValue);
      }
    };

    const timer = setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, index * 100);

    return () => {
      clearTimeout(timer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, index]);

  return (
    <motion.div
      className="stats-card glass-card-static"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="stats-card-top">
        <div className="stats-card-icon">
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`stats-card-trend ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trendValue}%</span>
          </div>
        )}
      </div>
      <div className="stats-card-value">
        {Number.isInteger(displayValue) ? displayValue : displayValue.toFixed(1)}
      </div>
      <div className="stats-card-label">{label}</div>
    </motion.div>
  );
}
