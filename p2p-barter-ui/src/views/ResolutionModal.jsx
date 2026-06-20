import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, X } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { activeSessions } from '../mockData';

export function ResolutionModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = activeSessions.find(s => s.id === id) || activeSessions[0];
  const [rating, setRating] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md relative">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-2xl font-bold mb-2">Session Completed?</h2>
          <p className="text-gray-600">Rate your experience with {session?.partner.name} for {session?.skill}.</p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star} 
              onClick={() => setRating(star)}
              className="hover:scale-110 transition-transform"
            >
              <Star 
                size={40} 
                className={star <= rating ? "fill-[#111111] text-[#111111]" : "text-gray-300"} 
              />
            </button>
          ))}
        </div>

        <div className="mb-8">
          <textarea 
            placeholder="Write a quick review..."
            className="w-full border border-border rounded-[16px] p-4 focus:outline-none focus:border-black transition-colors resize-none h-24"
          ></textarea>
        </div>

        <Button className="w-full" onClick={() => navigate('/')}>
          Confirm Completion
        </Button>
      </Card>
    </div>
  );
}
