import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input className={`input-field ${className}`} {...props} />
  );
}
