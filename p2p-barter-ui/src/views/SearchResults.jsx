import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { searchResults, currentUser } from '../mockData';

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 font-medium"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-8">Results for "{query}"</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {searchResults.map(user => {
          // Path C check: do they want something I offer?
          const canDirectSwap = user.skillsWanted.some(skill => currentUser.inventory.offer.includes(skill));

          return (
            <Card key={user.id} className="flex flex-col justify-between gap-6">
              <div className="flex gap-4 items-start">
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border border-border object-cover" />
                <div>
                  <h3 className="text-xl font-bold">{user.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3 mt-1">
                    <Star size={16} className="fill-current" />
                    <span className="font-medium text-black">{user.rating}</span>
                    <span>({user.reviews} reviews)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.skillsOffered.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                        Offers: {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-2">
                <Button onClick={() => navigate('/chat/new')} className="w-full">Request Session (1 Credit)</Button>
                {canDirectSwap && (
                  <Button variant="secondary" className="w-full text-sm">Direct Swap</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
