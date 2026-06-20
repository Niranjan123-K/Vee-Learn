import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import './CreditBadge.css';

export default function CreditBadge({ amount = 0, size = 'md' }) {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const prevAmount = useRef(amount);

  useEffect(() => {
    if (prevAmount.current === amount) return;

    const start = prevAmount.current;
    const end = amount;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (end - start) * eased);
      setDisplayAmount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevAmount.current = amount;
  }, [amount]);

  const sizeConfig = {
    sm: { iconSize: 14, className: 'credit-sm' },
    md: { iconSize: 16, className: 'credit-md' },
    lg: { iconSize: 22, className: 'credit-lg' },
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <motion.div
      className={`credit-badge ${config.className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Coins size={config.iconSize} />
      <span className="credit-amount">{displayAmount}</span>
    </motion.div>
  );
}
