import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No items found', 
  description = 'There is nothing to display here.',
  action = null
}) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'var(--space-2xl) var(--space-xl)',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-primary)',
      width: '100%'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-md)',
        color: 'var(--text-muted)'
      }}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
      
      <h3 style={{
        fontSize: 'var(--font-lg)',
        fontWeight: '600',
        color: 'var(--text-primary)',
        margin: '0 0 8px 0'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: 'var(--font-base)',
        color: 'var(--text-secondary)',
        margin: '0 0 var(--space-lg) 0',
        maxWidth: '400px'
      }}>
        {description}
      </p>

      {action && (
        <button 
          className="btn-primary"
          onClick={() => {
            if (action.onClick) action.onClick();
            else if (action.to) navigate(action.to);
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
