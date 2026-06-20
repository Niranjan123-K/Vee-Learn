import React from 'react';
import { Link } from 'react-router-dom';
import { currentUser } from '../mockData';

export function Header() {
  return (
    <header className="border-b border-border bg-white sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          Barter
        </Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-border">
            <span className="text-sm font-semibold">🪙 {currentUser.credits} Credits</span>
          </div>
          <img 
            src={currentUser.avatar} 
            alt="Profile" 
            className="w-9 h-9 rounded-full border border-border object-cover"
          />
        </div>
      </div>
    </header>
  );
}
