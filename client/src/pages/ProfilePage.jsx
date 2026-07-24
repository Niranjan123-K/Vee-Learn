import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Shield, Clock, BookOpen, User, BookMarked, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/PageHeader';
import { getInitials } from '../utils/formatters';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  
  // If no ID in URL, we view our own profile
  const profileId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${profileId}`);
        setProfileData(res.data.user || res.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    if (profileId) fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: '240px', marginBottom: 'var(--space-xl)' }} />
        <div className="profile-grid">
           <div className="skeleton" style={{ height: '300px' }} />
           <div className="skeleton" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="page-container text-center pt-xl">
        <h3 className="text-danger">{error || 'User not found'}</h3>
      </div>
    );
  }

  const {
    name, bio, avatar, averageRating,
    skills = [],
    sessionsCompleted = 0
  } = profileData;

  const teaching_skills = skills.filter(s => s.type === 'teach');
  const learning_skills = skills.filter(s => s.type === 'learn');

  const getBreadcrumb = () => {
    if (isOwnProfile) return [{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Profile' }];
    return [{ label: 'Explore', to: '/explore' }, { label: name }];
  };

  return (
    <div className="page-container fade-in">
      
      {/* HEADER SECTION */}
      <PageHeader breadcrumb={getBreadcrumb()} />
      
      <div className="profile-hero card">
        <div className="profile-hero-content">
          <div className="profile-avatar-large">
             {avatar ? <img src={`http://localhost:5000${avatar}`} alt={name} /> : <div className="avatar-fallback" style={{width:'100%', height:'100%', fontSize:'var(--font-3xl)'}}>{getInitials(name)}</div>}
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-name">{name}</h1>
            <p className="profile-bio">{bio || 'No bio provided.'}</p>
            
            <div className="profile-stats-pills">
              <span className="profile-pill bg-success-muted text-success">
                <Star size={14} /> {averageRating ? Number(averageRating).toFixed(1) : 'New'}
              </span>
              <span className="profile-pill bg-info-muted text-info">
                <Shield size={14} /> {sessionsCompleted} sessions
              </span>
              <span className="profile-pill bg-warning-muted text-warning">
                <Clock size={14} /> Member since {new Date(profileData.created_at || profileData.createdAt || Date.now()).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        
        {/* LEFT COLUMN: Teaching */}
        <div className="profile-col flex-col gap-lg">
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title flex items-center gap-sm">
                <BookOpen size={16} className="text-accent" />
                Teaching Skills
              </h3>
            </div>
            <div className="card-body">
              {teaching_skills.length > 0 ? (
                <div className="flex-col gap-md">
                  {teaching_skills.map((skill, i) => (
                    <div key={i} className="skill-row">
                      <div className="skill-row-info">
                        <h4>{skill.name}</h4>
                        <p>{skill.description || 'No description'}</p>
                      </div>
                      {!isOwnProfile && (
                        <button 
                          className="btn-secondary btn-sm"
                          onClick={() => navigate(`/book/${profileId}/${skill.name}`)}
                        >
                          Book Session
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No teaching skills listed.</p>
              )}
            </div>
          </div>

          {!isOwnProfile && (
             <div className="card bg-accent-muted" style={{borderColor: 'transparent'}}>
               <div className="card-body text-center flex-col gap-md">
                  <h3 className="text-primary font-lg">Want to learn from {name.split(' ')[0]}?</h3>
                  <p className="text-secondary text-sm">Book a session using your time credits.</p>
                  <button 
                    className="btn-accent w-full mt-sm"
                    onClick={() => navigate(`/book/${profileId}/general`)}
                  >
                    Request Session
                  </button>
               </div>
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: Learning & Reviews */}
        <div className="profile-col flex-col gap-lg">
          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title flex items-center gap-sm">
                <BookMarked size={16} className="text-info" />
                Learning Skills
              </h3>
            </div>
            <div className="card-body">
              {learning_skills.length > 0 ? (
                <div className="flex flex-wrap gap-sm">
                  {learning_skills.map((skill, i) => (
                    <span key={i} className="badge badge-default">{skill.name}</span>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No learning interests listed.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-header-title flex items-center gap-sm">
                <Award size={16} className="text-warning" />
                Recent Reviews
              </h3>
            </div>
            <div className="card-body">
              <p className="text-muted text-sm">Reviews will appear here once the user completes sessions.</p>
              {/* Note: In a real app, you would fetch and map reviews here */}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
