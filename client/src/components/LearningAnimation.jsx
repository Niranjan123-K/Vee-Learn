import React from 'react';
import { motion } from 'framer-motion';

export default function LearningAnimation() {
  return (
    <div className="loading-screen">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '64px' }}>
          {[1, 2, 3, 4].map((step, index) => (
            <motion.div
              key={step}
              initial={{ height: '8px', backgroundColor: 'var(--border-subtle)' }}
              animate={{ 
                height: `${step * 16}px`, 
                backgroundColor: ['var(--border-subtle)', 'var(--text-primary)', 'var(--border-subtle)']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              style={{
                width: '16px',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{
            fontSize: 'var(--font-xs)',
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}
        >
          Leveling Up Skills...
        </motion.div>
      </div>
    </div>
  );
}
