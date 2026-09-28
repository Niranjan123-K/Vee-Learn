import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Shield, Clock, BookOpen, User, BookMarked, Award, CheckCircle, GraduationCap, ChevronLeft, ChevronRight, Globe, Zap, Users, Edit3, X, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/PageHeader';
import EditProfileModal from '../components/EditProfileModal';
import AddSkillModal from '../components/AddSkillModal';
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [addSkillType, setAddSkillType] = useState('teach');

  const handleAvatarClick = () => {
    if (isOwnProfile && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('dp', file);

    try {
      const res = await api.post('/users/upload/dp', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newAvatarUrl = res.data.url;
      setProfileData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
      // Optional: update the user in the global store so the navbar updates immediately
      const currentUserData = useAuthStore.getState().user;
      if (currentUserData) {
        useAuthStore.setState({ user: { ...currentUserData, avatar_url: newAvatarUrl } });
      }
    } catch (err) {
      console.error('Failed to upload picture:', err);
      alert('Failed to upload profile picture.');
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  // Calendar mock state
  const [selectedDate, setSelectedDate] = useState(1);

  useEffect(() => {
    if (profileId) fetchProfile();
  }, [profileId]);

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    try {
      await api.delete(`/skills/user-skills/${id}`);
      fetchProfile();
    } catch (err) {
      console.error('Failed to delete skill:', err);
      alert('Failed to delete skill.');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: '320px', marginBottom: 'var(--space-xl)' }} />
        <div className="profile-grid">
           <div className="skeleton" style={{ height: '500px' }} />
           <div className="skeleton" style={{ height: '400px' }} />
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
    name, bio, avatar, avatar_url, averageRating, review_count, total_sessions,
    title, department, education, hourly_rate, languages, custom_availability,
    skills = [],
    sessionsCompleted = 0
  } = profileData;

  const displayAvatar = avatar_url || avatar;

  const teaching_skills = skills.filter(s => s.type === 'teach');

  const displayTitle = title || "Associate Professor of Pure Mathematics";
  const displayDepartment = department || "MATHEMATICS FACULTY";
  const displayEducation = education || "Cambridge Univ.";
  const displayHourlyRate = (!hourly_rate || hourly_rate.includes('$') || hourly_rate.includes('75')) ? "1 Credit / hr" : hourly_rate;
  const displayLanguages = languages || "English, Spanish";
  const displayAvailability = custom_availability && custom_availability.trim() ? custom_availability : "No specific availability added yet.";
  const reviewsCount = review_count ?? 450;
  const hoursTaught = total_sessions ? (total_sessions * 2) : "1,200"; // roughly assuming 2 hrs per session if unknown
  
  const mockBioText = bio || `With over 15 years of dedicated research and teaching in Number Theory and Abstract Algebra, Dr. Rodriguez has shaped the mathematical foundations of hundreds of undergraduate and graduate students. Her approach combines rigorous proof-based logic with intuitive geometric interpretations.\n\nPrior to her current role, she spent eight years at the Institute for Advanced Study, focusing on the intersections of cryptography and prime distribution. She is the lead author of "The Symmetry of Prime Patterns," a seminal text used in advanced mathematics curricula worldwide.`;

  const handleEditClick = () => {
    setEditForm({
      name: name || '',
      title: title || '',
      department: department || '',
      education: education || '',
      hourly_rate: hourly_rate || '',
      languages: languages || '',
      bio: bio || '',
      custom_availability: custom_availability || ''
    });
    setAvatarFile(null);
    setIsEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('dp', avatarFile);
        await api.post('/users/upload/dp', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      await api.put('/users/profile', editForm);
      // Reload profile
      const res = await api.get(`/users/${profileId}`);
      setProfileData(res.data.user || res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getBreadcrumb = () => {
    if (isOwnProfile) return [{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Profile' }];
    return [{ label: 'Explore', to: '/explore' }, { label: name }];
  };

  return (
    <div className="page-container fade-in">
      <PageHeader breadcrumb={getBreadcrumb()} />
      
      <div className="profile-hero-modern">
        <div className="profile-hero-image-wrapper">
          {displayAvatar ? (
            <img src={`http://localhost:5000${displayAvatar}`} alt={name} className="hero-avatar" />
          ) : (
            <div className="hero-avatar-fallback">{getInitials(name)}</div>
          )}
          <div className="verified-badge">
            <CheckCircle size={16} /> VERIFIED EXPERT
          </div>
        </div>

        <div className="profile-hero-details">
          <div className="hero-header-text">
            <span className="hero-department">{displayDepartment}</span>
            <h1 className="hero-name">{name}</h1>
            <h2 className="hero-title">{displayTitle}</h2>
          </div>

          <div className="hero-stats-row">
            <div className="stat-card">
              <div className="stat-value"><Star size={18} className="text-dark" fill="currentColor" /> {averageRating ? Number(averageRating).toFixed(1) : '5'}</div>
              <div className="stat-label">{reviewsCount} Reviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-value"><Clock size={18} className="text-dark" /> {hoursTaught}</div>
              <div className="stat-label">Hours Taught</div>
            </div>
            <div className="stat-card">
              <div className="stat-value"><GraduationCap size={18} className="text-dark" /> PhD</div>
              <div className="stat-label">{displayEducation}</div>
            </div>
          </div>

          {!isOwnProfile ? (
            <div className="hero-actions">
              <button 
                className="btn-dark"
                onClick={() => navigate(`/book/${profileId}/general`)}
              >
                Book a Session • {displayHourlyRate}
              </button>
              <button className="btn-outline">Message</button>
            </div>
          ) : (
            <div className="hero-actions">
              <button className="btn-outline" onClick={handleEditClick}>
                <Edit3 size={16} style={{marginRight: '6px', verticalAlign: 'text-bottom'}} />
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-grid-modern">
        {/* LEFT COLUMN: Content */}
        <div className="profile-main-col">
          
          <section className="profile-section">
            <h3 className="section-title"><span className="title-dash">—</span> Academic Profile</h3>
            <div className="bio-text">
              {mockBioText.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <div className="achievements-row">
              <div className="achievement-item">
                <div className="achievement-icon"><Award size={20} /></div>
                <div className="achievement-text">
                  <strong>Certifications</strong>
                  <span>HEA Senior Fellow, Advanced<br/>Cryptography Lead</span>
                </div>
              </div>
              <div className="achievement-item">
                <div className="achievement-icon"><BookOpen size={20} /></div>
                <div className="achievement-text">
                  <strong>Publications</strong>
                  <span>42 Peer-reviewed papers, 3<br/>Textbook volumes</span>
                </div>
              </div>
            </div>
          </section>

          <section className="profile-section">
            <h3 className="section-title">Specialties & Expertise</h3>
            <div className="skills-pill-container">
              <span className="skill-pill-dark">Calculus I-IV</span>
              <span className="skill-pill-light">Linear Algebra</span>
              <span className="skill-pill-light">Topology</span>
              <span className="skill-pill-light">Cryptography</span>
              <span className="skill-pill-light">Real Analysis</span>
              <span className="skill-pill-light">Discrete Mathematics</span>
              <span className="skill-pill-light">Differential Equations</span>
            </div>
          </section>

          <section className="profile-section">
            <div className="section-header-row">
              <h3 className="section-title">Student Feedback</h3>
              <span className="view-all-link">View all {reviewsCount} reviews</span>
            </div>
            
            <div className="reviews-list">
              {/* Mock Review 1 */}
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">MS</div>
                    <div>
                      <div className="reviewer-name">Marcus Sterling</div>
                      <div className="reviewer-subtitle">Calculus III Student</div>
                    </div>
                  </div>
                  <div className="review-stars">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                </div>
                <p className="review-body">
                  "Dr. Rodriguez has a unique gift for making Abstract Algebra feel tangible. Her sessions helped me secure an A when I was previously struggling to pass. Highly recommended for complex theory!"
                </p>
              </div>

              {/* Mock Review 2 */}
              <div className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">LL</div>
                    <div>
                      <div className="reviewer-name">Li Lin</div>
                      <div className="reviewer-subtitle">Cryptography Candidate</div>
                    </div>
                  </div>
                  <div className="review-stars">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                  </div>
                </div>
                <p className="review-body">
                  "Professional, patient, and incredibly brilliant. She helped me bridge the gap between pure math and practical encryption algorithms for my thesis."
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div className="profile-side-col">
          <div className="availability-card">
            <div className="availability-header">
              <h4>Availability</h4>
              <div className="availability-nav">
                <button className="nav-btn"><ChevronLeft size={16}/></button>
                <button className="nav-btn"><ChevronRight size={16}/></button>
              </div>
            </div>
            
            <div className="calendar-grid" style={{display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left'}}>
              {displayAvailability.split('\n').map((line, idx) => {
                const parts = line.split(/\s{2,}/); // Split by 2 or more spaces
                if (parts.length > 1) {
                  return (
                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-primary)'}}>
                      <span style={{color: 'var(--text-primary)', fontWeight: 500}}>{parts[0]}</span>
                      <span style={{color: 'var(--text-secondary)'}}>{parts.slice(1).join(' ')}</span>
                    </div>
                  );
                }
                return (
                  <div key={idx} style={{padding: '8px 0', borderBottom: '1px solid var(--border-primary)', color: 'var(--text-secondary)'}}>
                    {line}
                  </div>
                );
              })}
            </div>

            <button className="btn-dark w-full mt-lg" onClick={() => navigate(`/book/${profileId}/general`)}>Request Session</button>
            <div className="billed-info text-center mt-sm">Exchanged hourly at <strong>1 Time Credit</strong></div>
          </div>

          <div className="quick-info-card">
            <div className="info-row">
              <Globe size={16} /> Fluent in {displayLanguages}
            </div>
            <div className="info-row">
              <Zap size={16} /> Typical response time: 2 hours
            </div>
            <div className="info-row">
              <Users size={16} /> Peer & cohort study groups welcome
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal-content profile-edit-modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="btn-icon" onClick={() => setIsEditing(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto', padding: '20px'}}>
              <form onSubmit={handleSaveProfile} className="edit-profile-form">
                
                <div className="form-group avatar-upload-group" style={{display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px'}}>
                  <div className="avatar-upload-preview" style={{width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border-secondary)', flexShrink: 0}}>
                     {avatarFile ? (
                        <img src={URL.createObjectURL(avatarFile)} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                     ) : displayAvatar ? (
                        <img src={`http://localhost:5000${displayAvatar}`} alt="Current" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                     ) : (
                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'white', fontSize: '24px'}}>
                          {getInitials(name)}
                        </div>
                     )}
                  </div>
                  <div>
                    <button type="button" className="btn-outline btn-sm" onClick={() => fileInputRef.current.click()}>
                       <Upload size={14} style={{marginRight: '6px', verticalAlign: 'text-bottom'}}/> Upload New Picture
                    </button>
                    <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0}}>JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
                </div>

                <div className="form-row" style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Name</label>
                    <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Title</label>
                    <input type="text" className="form-input" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="e.g. Associate Professor" />
                  </div>
                </div>

                <div className="form-row" style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Department</label>
                    <input type="text" className="form-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="e.g. MATHEMATICS FACULTY" />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Education</label>
                    <input type="text" className="form-input" value={editForm.education} onChange={e => setEditForm({...editForm, education: e.target.value})} placeholder="e.g. Cambridge Univ." />
                  </div>
                </div>

                <div className="form-row" style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Session Credit Rate</label>
                    <input type="text" className="form-input" value={editForm.hourly_rate} onChange={e => setEditForm({...editForm, hourly_rate: e.target.value})} placeholder="e.g. 1 Credit / hr" />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Languages</label>
                    <input type="text" className="form-input" value={editForm.languages} onChange={e => setEditForm({...editForm, languages: e.target.value})} placeholder="e.g. English, Spanish" />
                  </div>
                </div>

                <div className="form-group" style={{marginBottom: '15px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Availability (Use double spaces to align times)</label>
                  <textarea rows="4" className="form-textarea" value={editForm.custom_availability} onChange={e => setEditForm({...editForm, custom_availability: e.target.value})} placeholder="Monday      10 AM - 1 PM&#10;Tuesday     2 PM - 6 PM" />
                </div>

                <div className="form-group" style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 600}}>Academic Profile (Bio)</label>
                  <textarea rows="5" className="form-textarea" value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Write about your research and teaching..." />
                </div>

                <div className="modal-footer" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid var(--border-primary)'}}>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
