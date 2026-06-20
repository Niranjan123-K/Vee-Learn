import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import './DashboardPage.css';

const categories = ['All', 'Design', 'Tech', 'Languages', 'Music', 'Fitness', 'Business'];

// Placeholder data matching the visual style
const placeholderTeachers = [
  { _id: '1', name: 'Chris', skill: 'Photoshop tutoring', category: 'Design', mode: 'Online', level: 'Intermediate' },
  { _id: '2', name: 'Priya', skill: 'Spanish conversation', category: 'Languages', mode: 'Online', level: 'Beginner' },
  { _id: '3', name: 'Meera', skill: 'Excel & data analysis', category: 'Tech', mode: 'In-person', level: 'Advanced' },
  { _id: '4', name: 'Bob', skill: 'Guitar lessons', category: 'Music', mode: 'Online', level: 'Intermediate' },
  { _id: '5', name: 'Jordan', skill: 'Yoga & stretching', category: 'Fitness', mode: 'In-person', level: 'Beginner' },
  { _id: '6', name: 'Sam', skill: 'Python debugging help', category: 'Tech', mode: 'Online', level: 'Advanced' },
];

export default function DashboardPage() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [teachers, setTeachers] = useState(placeholderTeachers);

  useEffect(() => {
    // In a real app, fetch these from /api/users/explore or similar
  }, []);

  const filtered = teachers.filter((t) => {
    const matchesSearch = t.skill.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container dashboard-page">
      <div className="dash-header">
        <h1 className="dash-title">Browse skills</h1>
        <p className="dash-subtitle">Find someone who can teach what you want to learn</p>
      </div>

      <div className="dash-search-container">
        <div className="dash-search-input-wrapper">
          <Search size={20} className="dash-search-icon" />
          <input
            type="text"
            className="dash-search-input"
            placeholder="Search by skill or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`dash-filter-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="dash-grid">
        {filtered.map((t) => (
          <div key={t._id} className="dash-card">
            <div className="dash-card-header">
              <div className="dash-avatar-circle">{t.name.charAt(0)}</div>
              <span className="dash-card-name">{t.name}</span>
            </div>
            <div className="dash-card-body">
              <h3 className="dash-card-skill">{t.skill}</h3>
              <p className="dash-card-meta">
                {t.category} · {t.mode} · {t.level}
              </p>
            </div>
            <button 
              className="btn-outline dash-card-btn"
              onClick={() => navigate(`/profile/${t._id}`)}
            >
              View profile ↗
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
