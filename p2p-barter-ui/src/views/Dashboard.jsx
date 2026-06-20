import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { currentUser, systemProposals, activeSessions, campusBounties } from '../mockData';

const socket = io('http://localhost:5000');

export function Dashboard() {
  const [query, setQuery] = useState('');
  const [chainStatus, setChainStatus] = useState('Pending');
  const [isBountyModalOpen, setBountyModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('chain_locked', () => {
      setChainStatus('Locked');
    });
    return () => socket.off('chain_locked');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleAcceptChain = (chainId) => {
    socket.emit('accept_chain', { chainId });
    // In a real app, it might stay pending until the server confirms everyone accepted.
    // We wait for 'chain_locked' socket event.
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      {/* Hero Search */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
          What do you want to learn today?
        </h1>
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search size={24} />
          </div>
          <input
            type="text"
            className="w-full bg-white border border-[#E5E5E5] rounded-[24px] pl-14 pr-6 py-5 text-xl focus:outline-none focus:border-[#111111] transition-colors shadow-sm"
            placeholder="e.g. Calculus, Python, Spanish..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      {/* System Proposals (Path B) */}
      {systemProposals.map(proposal => (
        <Card key={proposal.id} className="mb-12 border-[#111111] bg-[#fafafa]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              ✨ {proposal.description}
            </h3>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${chainStatus === 'Locked' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>
              {chainStatus}
            </span>
          </div>
          <p className="text-gray-600 mb-6">{proposal.chain}</p>
          {chainStatus !== 'Locked' && (
            <div className="flex gap-4">
              <Button onClick={() => handleAcceptChain(proposal.id)}>Accept Chain</Button>
              <Button variant="secondary">Decline</Button>
            </div>
          )}
        </Card>
      ))}

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Upcoming Sessions</h2>
          <div className="grid gap-4">
            {activeSessions.map(session => (
              <Card key={session.id} className="flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors" onClick={() => navigate(`/chat/${session.id}`)}>
                <div className="flex items-center gap-4">
                  <img src={session.partner.avatar} className="w-12 h-12 rounded-full border border-border" alt="" />
                  <div>
                    <h3 className="font-semibold text-lg">{session.skill} with {session.partner.name}</h3>
                    <p className="text-gray-500 text-sm">{session.time} • Status: {session.status}</p>
                  </div>
                </div>
                <Button variant="secondary" className="text-sm px-4 py-2">Open Chat</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Campus Bounties */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold">Campus Bounties</h2>
          <button 
            onClick={() => setBountyModalOpen(true)}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors border border-border"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campusBounties.map(bounty => (
            <Card key={bounty.id} className="flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 mb-2 block">{bounty.courseTag}</span>
                <h3 className="font-bold mb-3">{bounty.title}</h3>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="font-semibold">🪙 {bounty.reward}</span>
                <Button variant="secondary" className="px-4 py-1.5 text-sm">Claim</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">I can teach</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Plus size={20}/></button>
          </div>
          <div className="space-y-3">
            {currentUser.inventory.offer.map((skill, idx) => (
              <div key={idx} className="px-5 py-4 border border-border rounded-[16px] font-medium">
                {skill}
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">I want to learn</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors"><Plus size={20}/></button>
          </div>
          <div className="space-y-3">
            {currentUser.inventory.learn.map((skill, idx) => (
              <div key={idx} className="px-5 py-4 border border-border rounded-[16px] font-medium">
                {skill}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post a Bounty Modal */}
      {isBountyModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md relative">
            <button 
              onClick={() => setBountyModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6">Post a Bounty</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">What do you need help with?</label>
                <input 
                  type="text" 
                  placeholder="e.g. Proofread my essay" 
                  className="w-full border border-border rounded-[16px] px-4 py-3 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Course Tag</label>
                <input 
                  type="text" 
                  placeholder="e.g. ENG-101" 
                  className="w-full border border-border rounded-[16px] px-4 py-3 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Reward (Credits)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.5" 
                  className="w-full border border-border rounded-[16px] px-4 py-3 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <Button className="w-full mt-4" onClick={() => setBountyModalOpen(false)}>
                Post Bounty
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
