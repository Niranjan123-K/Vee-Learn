import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import './ProfilePage.css';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.user);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const idToFetch = userId || currentUser?.id;
        if (!idToFetch) {
          setLoading(false);
          return;
        }

        // If it's the current user, we can just use currentUser to avoid a fetch, or fetch fresh
        if (!userId && currentUser) {
          setProfile({
            ...currentUser,
            title: currentUser.course_tag || 'Student',
            verified: true,
            rating: 5.0,
            sessionsCompleted: 0,
            skills: [],
            reviews: []
          });
          setLoading(false);
          return;
        }

        const res = await api.get(`/users/${idToFetch}`);
        const data = res.data.user || res.data;
        setProfile({
          ...data,
          title: data.course_tag || 'Student',
          verified: true,
          rating: 5.0,
          sessionsCompleted: 0,
          skills: [],
          reviews: []
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser]);

  if (loading) {
    return <div className="page-container fade-in"><div className="loading-screen">Loading profile...</div></div>;
  }

  if (error || !profile) {
    return (
      <div className="page-container fade-in">
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          &lt; Back to browse
        </button>
        <div className="auth-error" style={{marginTop: '20px'}}>{error || 'Profile not found'}</div>
      </div>
    );
  }

  return (
    <div className="page-container profile-page">
      <button className="profile-back-btn" onClick={() => navigate(-1)}>
        &lt; Back to browse
      </button>

      <div className="profile-header-container">
        <div className="profile-header-left">
          <div className="profile-avatar-large">
            {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="profile-header-info">
            <div className="profile-name-row">
              <h1 className="profile-name">{profile.name || 'Anonymous User'}</h1>
              {profile.verified && <span className="profile-verified-pill">✓ Verified student</span>}
            </div>
            <p className="profile-title">{profile.title}</p>
            <p className="profile-stats-line">
              <span className="profile-star">□</span> {profile.rating} average · {profile.sessionsCompleted} sessions completed
            </p>
          </div>
        </div>
        <button className="profile-connect-btn" onClick={() => navigate(`/messages/${profile.id || profile._id}`)}>
          Connect ↗
        </button>
      </div>

      <div className="profile-bio-section">
        <p>{profile.bio || "This user hasn't written a bio yet. They prefer to let their teaching speak for itself."}</p>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Offers</h2>
        <div className="profile-skills-grid">
          {profile.skills && profile.skills.length > 0 ? profile.skills.map((skill, i) => (
            <div key={i} className="profile-skill-card">
              <h3 className="profile-skill-name">{skill.name}</h3>
              <p className="profile-skill-meta">{skill.category} · {skill.mode} · {skill.level}</p>
            </div>
          )) : (
            <p className="text-muted">No skills offered yet.</p>
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Verified certificate</h2>
        {profile.skills && profile.skills.length > 0 ? (
          <div className="profile-certificate-card">
            <div className="profile-cert-info">
              <span className="profile-cert-icon">□</span>
              <div>
                <h3 className="profile-cert-name">{profile.skills[0].name}</h3>
                <p className="profile-cert-meta">Verified by peer-reviewed sessions · {profile.rating} average</p>
              </div>
            </div>
            <button className="btn-outline profile-cert-btn">
              View certificate ↗
            </button>
          </div>
        ) : (
          <p className="text-muted">No verified certificates yet. Teach a session to earn one!</p>
        )}
      </div>

      <div className="profile-section">
        <h2 className="profile-section-title">Recent reviews</h2>
        <div className="profile-reviews-list">
          {profile.reviews && profile.reviews.length > 0 ? profile.reviews.map((review, i) => (
            <div key={i} className="profile-review-item">
              <div className="profile-review-header">
                <span className="profile-review-author">{review.author} <span className="profile-review-rating">□ {review.rating.toFixed(1)}</span></span>
                <span className="profile-review-time">{review.time}</span>
              </div>
              <p className="profile-review-text">{review.text}</p>
            </div>
          )) : (
            <p className="text-muted">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
