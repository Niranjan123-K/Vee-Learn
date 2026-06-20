import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Dashboard } from './views/Dashboard';
import { SearchResults } from './views/SearchResults';
import { SessionChat } from './views/SessionChat';
import { ResolutionModal } from './views/ResolutionModal';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-[#111111]">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/chat/:id" element={<SessionChat />} />
            <Route path="/resolve/:id" element={<>
              <SessionChat />
              <ResolutionModal />
            </>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
