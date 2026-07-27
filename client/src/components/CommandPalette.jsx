import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, Users, Compass, 
  LayoutDashboard, Calendar, MessageCircle, Wallet, 
  User, Star, Activity, Clock, Trash2
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import api from '../utils/api';
import { formatRelativeTime } from '../utils/formatters';
import './CommandPalette.css';

// ─── Highlighter Component ───
const HighlightMatch = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const t = String(text);
  const matchIdx = t.toLowerCase().indexOf(query.toLowerCase());
  if (matchIdx === -1) return <>{t}</>;
  return (
    <>
      {t.slice(0, matchIdx)}
      <span className="cmd-highlight">{t.slice(matchIdx, matchIdx + query.length)}</span>
      {t.slice(matchIdx + query.length)}
    </>
  );
};

// ─── Scoring Logic ───
const getScore = (text, query) => {
  if (!text) return 0;
  const t = String(text).toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 4;
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  const words = q.split(' ').filter(w => w);
  if (words.length > 0 && words.every(w => t.includes(w))) return 1;
  return 0;
};

// ─── Main Component ───
export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const notifications = useNotificationStore(state => state.notifications);
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const [data, setData] = useState({
    teachers: [],
    skills: [],
    sessions: [],
    messages: []
  });
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Load Recent Searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vee_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveRecentSearch = (q) => {
    if (!q || q.trim() === '') return;
    const newRecents = [q, ...recentSearches.filter(s => s !== q)].slice(0, 8);
    setRecentSearches(newRecents);
    localStorage.setItem('vee_recent_searches', JSON.stringify(newRecents));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('vee_recent_searches');
  };

  // Fetch Data on Open
  useEffect(() => {
    if (isOpen && !hasFetched && user) {
      setLoading(true);
      Promise.all([
        api.get('/users/teachers').catch(() => ({ data: { users: [] } })),
        api.get('/sessions').catch(() => ({ data: { sessions: [] } })),
        api.get('/messages/conversations').catch(() => ({ data: { conversations: [] } }))
      ]).then(([teachRes, sessRes, msgRes]) => {
        const teachers = teachRes.data.users || teachRes.data || [];
        const sessions = sessRes.data.sessions || sessRes.data || [];
        const messages = msgRes.data.conversations || msgRes.data || [];
        
        // Derive skills from teachers (assuming skills_offered is an array of strings or objects)
        const skillMap = {};
        teachers.forEach(t => {
          if (t.skills_offered && Array.isArray(t.skills_offered)) {
            t.skills_offered.forEach(s => {
              const sName = typeof s === 'string' ? s : s.name;
              if (sName) {
                if (!skillMap[sName]) skillMap[sName] = { name: sName, teacherCount: 0, category: s.category || 'Skill' };
                skillMap[sName].teacherCount++;
              }
            });
          }
        });
        const skills = Object.values(skillMap);
        
        setData({ teachers, sessions, messages, skills });
        setHasFetched(true);
      }).finally(() => {
        setLoading(false);
      });
    }
    
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen, hasFetched, user]);

  // Derived Results based on Query
  const results = useMemo(() => {
    if (!query.trim()) return null;
    
    const q = query.trim();
    
    // 1. Pages
    const pages = [
      { id: 'p1', type: 'page', title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
      { id: 'p2', type: 'page', title: 'Explore', icon: Compass, path: '/explore' },
      { id: 'p3', type: 'page', title: 'My Learning', icon: BookOpen, path: '/learning' },
      { id: 'p4', type: 'page', title: 'Sessions', icon: Calendar, path: '/sessions' },
      { id: 'p5', type: 'page', title: 'Messages', icon: MessageCircle, path: '/messages' },
      { id: 'p6', type: 'page', title: 'Ledger', icon: Wallet, path: '/ledger' },
      { id: 'p7', type: 'page', title: 'Profile', icon: User, path: '/profile' }
    ].map(p => ({ ...p, score: getScore(p.title, q) })).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // 2. Teachers
    const teachers = data.teachers.map(t => {
      const score = Math.max(getScore(t.name, q), getScore(t.department, q));
      return { id: `t_${t.id||t._id}`, type: 'teacher', teacher: t, score };
    }).filter(t => t.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // 3. Skills
    const skills = data.skills.map(s => {
      return { id: `sk_${s.name}`, type: 'skill', skill: s, score: getScore(s.name, q) };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // 4. Sessions
    const sessions = data.sessions.map(s => {
      const score = Math.max(getScore(s.skill_name, q), getScore(s.teacher_name, q), getScore(s.status, q));
      return { id: `s_${s.id}`, type: 'session', session: s, score };
    }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // 5. Messages
    const messages = data.messages.map(m => {
      const partnerName = m.user1_id === user?.id ? m.user2_name : m.user1_name;
      const score = Math.max(getScore(partnerName, q), getScore(m.last_message, q));
      return { id: `m_${m.id}`, type: 'message', message: m, partnerName, score };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // 6. My Learning (Mocked stats/sections based on matches)
    const myLearningItems = [
      { id: 'ml1', type: 'learning', title: 'Learning Streak', desc: 'Active days streak', path: '/learning', icon: Activity },
      { id: 'ml2', type: 'learning', title: 'Achievements', desc: 'Your badges and milestones', path: '/learning', icon: Star },
      { id: 'ml3', type: 'learning', title: 'Current Skills', desc: 'Skills you are actively learning', path: '/learning', icon: BookOpen }
    ].map(p => ({ ...p, score: getScore(p.title, q) })).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    // 7. Notifications
    const notifs = notifications.map(n => ({
      id: `n_${n.id}`, type: 'notification', notification: n, score: getScore(n.title || n.message, q)
    })).filter(n => n.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

    const sections = [];
    if (pages.length) sections.push({ title: 'Pages', items: pages });
    if (teachers.length) sections.push({ title: 'Teachers', items: teachers });
    if (skills.length) sections.push({ title: 'Skills', items: skills });
    if (sessions.length) sections.push({ title: 'Sessions', items: sessions });
    if (messages.length) sections.push({ title: 'Messages', items: messages });
    if (myLearningItems.length) sections.push({ title: 'My Learning', items: myLearningItems });
    if (notifs.length) sections.push({ title: 'Notifications', items: notifs });

    return sections;
  }, [query, data, user, notifications]);

  // Flatten items for keyboard navigation
  const flatItems = useMemo(() => {
    if (!results) return [];
    return results.flatMap(section => section.items);
  }, [results]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard Event Listener
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (flatItems.length || recentSearches.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (flatItems.length || recentSearches.length || 1)) % (flatItems.length || recentSearches.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!query.trim() && recentSearches.length > 0) {
        setQuery(recentSearches[selectedIndex]);
      } else if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (item) => {
    saveRecentSearch(query.trim());
    if (item.type === 'page' || item.type === 'learning') navigate(item.path);
    else if (item.type === 'teacher') navigate(`/profile/${item.teacher.id || item.teacher._id}`);
    else if (item.type === 'skill') navigate(`/explore?q=${item.skill.name}`);
    else if (item.type === 'session') navigate(`/sessions/${item.session.id}/chat`);
    else if (item.type === 'message') {
      const partnerId = item.message.user1_id === user?.id ? item.message.user2_id : item.message.user1_id;
      navigate(`/messages/${partnerId}`);
    }
    else if (item.type === 'notification') navigate('/dashboard');
    
    onClose();
  };

  const handleRecentSelect = (q) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="cmd-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="cmd-modal"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0, scale: 0.97 },
            visible: { opacity: 1, scale: 1, transition: { duration: 0.15, ease: 'easeOut' } },
            exit: { opacity: 0, scale: 0.97, transition: { duration: 0.1, ease: 'easeIn' } }
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="cmd-header">
            <Search size={20} className="cmd-search-icon" />
            <input 
              ref={inputRef}
              className="cmd-input"
              placeholder="Search everywhere..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Body */}
          <div className="cmd-body" ref={listRef}>
            
            {/* Loading Skeleton */}
            {loading && !query && (
              <div className="cmd-section">
                <div className="cmd-section-title">Loading...</div>
                {[1,2,3].map(i => (
                  <div key={i} className="cmd-item" style={{ height: '60px', pointerEvents: 'none' }}>
                    <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
                    <div style={{ marginLeft: '14px', flex: 1 }}>
                      <div className="skeleton" style={{ width: '120px', height: '14px', marginBottom: '6px' }} />
                      <div className="skeleton" style={{ width: '80px', height: '10px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Searches (Empty Query) */}
            {!query.trim() && !loading && (
              <div className="cmd-section">
                <div className="cmd-section-title">
                  Recent Searches
                  {recentSearches.length > 0 && (
                    <button className="cmd-clear-btn" onClick={clearRecentSearches}>Clear</button>
                  )}
                </div>
                {recentSearches.length > 0 ? (
                  recentSearches.map((r, i) => (
                    <div 
                      key={i} 
                      className={`cmd-item ${selectedIndex === i ? 'selected' : ''}`}
                      onClick={() => handleRecentSelect(r)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <div className="cmd-item-icon"><Clock size={16} /></div>
                      <div className="cmd-item-content">
                        <div className="cmd-item-title">{r}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '0 12px' }}>No recent searches.</p>
                )}
              </div>
            )}

            {/* No Results */}
            {query.trim() && results && results.length === 0 && (
              <div className="cmd-empty">
                <div className="cmd-empty-icon">🔍</div>
                <h3>Couldn't find anything</h3>
                <p>Try another keyword or check for typos.</p>
                <button className="btn-outline btn-sm" onClick={() => { onClose(); navigate('/explore'); }}>
                  Browse Explore →
                </button>
              </div>
            )}

            {/* Results */}
            {query.trim() && results && results.map((section, sIdx) => {
              // Calculate global index offset for this section
              let sectionOffset = 0;
              for (let i = 0; i < sIdx; i++) {
                sectionOffset += results[i].items.length;
              }

              return (
                <div key={section.title} className="cmd-section">
                  <div className="cmd-section-title">{section.title}</div>
                  {section.items.map((item, iIdx) => {
                    const globalIdx = sectionOffset + iIdx;
                    const isSelected = selectedIndex === globalIdx;

                    return (
                      <div 
                        key={item.id} 
                        className={`cmd-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      >
                        {/* Page / Learning */}
                        {(item.type === 'page' || item.type === 'learning') && (
                          <>
                            <div className="cmd-item-icon"><item.icon size={16} /></div>
                            <div className="cmd-item-content">
                              <div className="cmd-item-title"><HighlightMatch text={item.title} query={query} /></div>
                              {item.desc && <div className="cmd-item-subtitle">{item.desc}</div>}
                            </div>
                          </>
                        )}

                        {/* Teacher */}
                        {item.type === 'teacher' && (
                          <>
                            {item.teacher.avatar_url || item.teacher.avatar ? (
                              <img src={`http://localhost:5000${item.teacher.avatar_url || item.teacher.avatar}`} alt="" className="cmd-item-avatar" />
                            ) : (
                              <div className="cmd-item-icon"><User size={16} /></div>
                            )}
                            <div className="cmd-item-content">
                              <div className="cmd-item-title"><HighlightMatch text={item.teacher.name} query={query} /></div>
                              <div className="cmd-item-subtitle"><HighlightMatch text={item.teacher.department || 'Expert'} query={query} /></div>
                            </div>
                            <div className="cmd-item-meta">
                              {item.teacher.averageRating && <div>★ {Number(item.teacher.averageRating).toFixed(1)}</div>}
                            </div>
                          </>
                        )}

                        {/* Skill */}
                        {item.type === 'skill' && (
                          <>
                            <div className="cmd-item-icon"><BookOpen size={16} /></div>
                            <div className="cmd-item-content">
                              <div className="cmd-item-title"><HighlightMatch text={item.skill.name} query={query} /></div>
                              <div className="cmd-item-subtitle">{item.skill.category || 'General'}</div>
                            </div>
                            <div className="cmd-item-meta">{item.skill.teacherCount} Teachers</div>
                          </>
                        )}

                        {/* Session */}
                        {item.type === 'session' && (
                          <>
                            <div className="cmd-item-icon"><Calendar size={16} /></div>
                            <div className="cmd-item-content">
                              <div className="cmd-item-title"><HighlightMatch text={item.session.skill_name} query={query} /></div>
                              <div className="cmd-item-subtitle">With <HighlightMatch text={item.session.teacher_name} query={query} /></div>
                            </div>
                            <div className="cmd-item-meta">
                              <div>{new Date(item.session.scheduled_at).toLocaleDateString()}</div>
                              <span className="cmd-badge" style={{ background: item.session.status === 'completed' ? 'var(--success)' : '#3B82F6' }}>
                                {item.session.status}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Message */}
                        {item.type === 'message' && (
                          <>
                            <div className="cmd-item-icon"><MessageCircle size={16} /></div>
                            <div className="cmd-item-content">
                              <div className="cmd-item-title"><HighlightMatch text={item.partnerName} query={query} /></div>
                              <div className="cmd-item-subtitle"><HighlightMatch text={item.message.last_message || 'New Conversation'} query={query} /></div>
                            </div>
                            <div className="cmd-item-meta">
                              {item.message.unread_count > 0 && <span className="cmd-badge" style={{ background: 'var(--danger)' }}>{item.message.unread_count} Unread</span>}
                            </div>
                          </>
                        )}

                        {/* Notification */}
                        {item.type === 'notification' && (
                          <>
                            <div className="cmd-item-icon"><Activity size={16} /></div>
                            <div className="cmd-item-content">
                              <div className="cmd-item-title"><HighlightMatch text={item.notification.title || item.notification.message} query={query} /></div>
                            </div>
                          </>
                        )}

                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="cmd-footer">
            <div className="cmd-kbd-group">
              <span className="cmd-kbd-item"><span className="cmd-kbd">↑</span><span className="cmd-kbd">↓</span> Navigate</span>
              <span className="cmd-kbd-item"><span className="cmd-kbd">Enter</span> Open</span>
              <span className="cmd-kbd-item"><span className="cmd-kbd">Esc</span> Close</span>
            </div>
            <div>
              Search Everywhere
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
