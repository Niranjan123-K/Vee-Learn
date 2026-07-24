import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, AlignLeft, Globe, MapPin, Calendar, Camera, ArrowRight, ArrowLeft, Check, Plus, Trash2, Search } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import './AuthPages.css';

const categories = ['Programming', 'Design', 'Marketing', 'Business', 'Languages', 'Music', 'Photography', 'Personal Development', 'Fitness', 'Cooking', 'Other'];
const proficiencies = ['beginner', 'intermediate', 'expert'];

export default function OnboardingWizard() {
  const user = useAuthStore(state => state.user);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const fetchUser = useAuthStore(state => state.fetchUser);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Step 1 State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || 'beginner');
  const [preferredLanguage, setPreferredLanguage] = useState(user?.preferred_language || 'English');
  const [location, setLocation] = useState(user?.location || '');
  const [availability, setAvailability] = useState(user?.availability || 'Weekends');
  const [dpFile, setDpFile] = useState(null);
  const [dpPreview, setDpPreview] = useState(user?.avatar_url || '');

  // Step 2 & 3 State
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  const [serverSkills, setServerSkills] = useState([]);

  useEffect(() => {
    if (user?.profile_completed) {
      navigate('/dashboard');
    }
    // Fetch all skills on mount
    api.get('/skills').then(res => {
      setServerSkills(res.data.all || []);
    }).catch(console.error);
    // Fetch user skills if they've already added some
    api.get(`/skills/user/${user?.id}`).then(res => {
      const skills = res.data.skills || [];
      setTeachSkills(skills.filter(s => s.type === 'teach'));
      setLearnSkills(skills.filter(s => s.type === 'learn'));
    }).catch(console.error);
  }, [user, navigate]);

  const handleDpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDpFile(file);
      setDpPreview(URL.createObjectURL(file));
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let avatar_url = user?.avatar_url;
      if (dpFile) {
        const formData = new FormData();
        formData.append('dp', dpFile);
        const res = await api.post('/users/upload/dp', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        avatar_url = res.data.url;
      }

      const result = await updateProfile({
        name, bio, experience_level: experienceLevel,
        preferred_language: preferredLanguage, location, availability, avatar_url
      });

      if (result.success) {
        setStep(2);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred while saving your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkillAdd = async (newSkill, type) => {
    try {
      const payload = {
        type,
        proficiency: newSkill.proficiency || 'beginner',
        description: newSkill.description || ''
      };
      if (newSkill.skill_id) {
        payload.skill_id = newSkill.skill_id;
      } else {
        payload.skill_name = newSkill.name;
        payload.category = newSkill.category || 'Other';
      }

      const { data } = await api.post('/skills/user-skills', payload);
      if (type === 'teach') {
        setTeachSkills([...teachSkills.filter(s => s.id !== data.userSkill.id), data.userSkill]);
      } else {
        setLearnSkills([...learnSkills.filter(s => s.id !== data.userSkill.id), data.userSkill]);
      }
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add skill');
      return false;
    }
  };

  const handleSkillRemove = async (id, type) => {
    try {
      await api.delete(`/skills/user-skills/${id}`);
      if (type === 'teach') {
        setTeachSkills(teachSkills.filter(s => s.id !== id));
      } else {
        setLearnSkills(learnSkills.filter(s => s.id !== id));
      }
    } catch (err) {
      setError('Failed to remove skill');
    }
  };

  const handleFinish = async () => {
    if (teachSkills.length === 0 && learnSkills.length === 0) {
      setError('You must add at least one teaching or learning skill to continue.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/complete-onboarding');
      await fetchUser(); // refresh user state
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError('Failed to complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <motion.div className="auth-card glass-card-static register-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="success-message">
            <motion.div className="success-icon" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={32} /></motion.div>
            <h2>All Set!</h2>
            <p>Welcome to your Dashboard...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page" style={{ padding: '2rem 1rem' }}>
      <div className="auth-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <motion.div className="auth-card surface-card register-card" style={{ maxWidth: '700px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-header">
          <h1 className="auth-title">
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Skills I Teach'}
            {step === 3 && 'Skills I Want to Learn'}
            {step === 4 && 'Almost Done'}
          </h1>
          <p className="auth-subtitle">
            {step === 1 && 'Help others know you better.'}
            {step === 2 && 'Add things you are good at and can help others with.'}
            {step === 3 && 'Add things you want to improve or learn from scratch.'}
            {step === 4 && 'Review your profile before jumping in.'}
          </p>
        </div>

        <div className="register-progress">
          {[1, 2, 3, 4].map((s, i) => (
            <div key={s} className="progress-step">
              {i > 0 && <div className={`progress-line ${step > i ? 'active' : ''}`} />}
              <div className={`progress-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" onSubmit={handleStep1Submit} className="auth-form premium-grid" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="input-group full-width" style={{ alignItems: 'center' }}>
                <div className="avatar-upload-container" style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 1rem' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#2a2a35', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #4b4b5c' }}>
                    {dpPreview ? <img src={dpPreview.startsWith('blob:') ? dpPreview : `http://localhost:5000${dpPreview}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="#6b6b7b" />}
                  </div>
                  <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366f1', padding: '8px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    <Camera size={16} color="white" />
                    <input type="file" accept="image/*" onChange={handleDpChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
              <div className="input-group">
                <label>Full Name *</label>
                <div className="input-icon-wrapper"><User size={18} className="input-icon" /><input type="text" className="input-field input-with-icon" value={name} onChange={e => setName(e.target.value)} required /></div>
              </div>
              <div className="input-group">
                <label>Preferred Language</label>
                <div className="input-icon-wrapper">
                  <Globe size={18} className="input-icon" />
                  <select className="input-field input-with-icon" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)}>
                    <option value="English">English</option><option value="Spanish">Spanish</option><option value="French">French</option><option value="Mandarin">Mandarin</option><option value="German">German</option>
                  </select>
                </div>
              </div>
              <div className="input-group full-width">
                <label>Short Bio *</label>
                <div className="input-icon-wrapper" style={{ alignItems: 'flex-start' }}>
                  <AlignLeft size={18} className="input-icon" style={{ top: '12px', transform: 'none' }} />
                  <textarea className="input-field input-with-icon" rows="3" placeholder="Tell us a little about yourself..." value={bio} onChange={e => setBio(e.target.value)} required style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Experience Level</label>
                <div className="input-icon-wrapper">
                  <select className="input-field" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} style={{ paddingLeft: '1rem' }}>
                    <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="expert">Advanced / Expert</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Availability</label>
                <div className="input-icon-wrapper">
                  <Calendar size={18} className="input-icon" />
                  <select className="input-field input-with-icon" value={availability} onChange={e => setAvailability(e.target.value)}>
                    <option value="Weekdays">Weekdays</option><option value="Weekends">Weekends</option><option value="Evenings">Evenings</option><option value="Anytime">Anytime</option>
                  </select>
                </div>
              </div>
              <div className="input-group full-width">
                <label>Location (Optional)</label>
                <div className="input-icon-wrapper"><MapPin size={18} className="input-icon" /><input type="text" className="input-field input-with-icon" placeholder="City, Country" value={location} onChange={e => setLocation(e.target.value)} /></div>
              </div>
              <div className="register-nav full-width">
                <button type="submit" className="btn-primary" disabled={loading || !name || !bio}>
                  <span>{loading ? 'Saving...' : 'Continue'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </div>
            </motion.form>
          )}

          {step === 2 && <SkillStep key="step2" title="Add a skill you can teach" type="teach" skills={teachSkills} onAdd={(s) => handleSkillAdd(s, 'teach')} onRemove={(id) => handleSkillRemove(id, 'teach')} serverSkills={serverSkills} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <SkillStep key="step3" title="Add a skill you want to learn" type="learn" skills={learnSkills} onAdd={(s) => handleSkillAdd(s, 'learn')} onRemove={(id) => handleSkillRemove(id, 'learn')} serverSkills={serverSkills} onNext={() => setStep(4)} onBack={() => setStep(2)} />}

          {step === 4 && (
            <motion.div key="step4" className="auth-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem', borderRadius: '50%', backgroundColor: '#2a2a35', overflow: 'hidden' }}>
                  {dpPreview ? <img src={dpPreview.startsWith('blob:') ? dpPreview : `http://localhost:5000${dpPreview}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={40} color="#6b6b7b" style={{ margin: '20px' }} />}
                </div>
                <h3>{name}</h3>
                <p style={{ color: '#9ca3af' }}>{teachSkills.length} Teaching · {learnSkills.length} Learning</p>
              </div>
              <div className="register-nav">
                <button className="btn-outline" onClick={() => setStep(3)}><ArrowLeft size={16} />Back</button>
                <button className="btn-primary" onClick={handleFinish} disabled={loading}><span>{loading ? 'Finishing...' : 'Go to Dashboard'}</span><ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SkillStep({ title, type, skills, onAdd, onRemove, serverSkills, onNext, onBack }) {
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [proficiency, setProficiency] = useState('beginner');
  const [description, setDescription] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (skillName.length > 1) {
      setSearchMatches(serverSkills.filter(s => s.name.toLowerCase().includes(skillName.toLowerCase())));
    } else {
      setSearchMatches([]);
    }
  }, [skillName, serverSkills]);

  const handleAdd = async () => {
    if (!skillName.trim()) return true;
    const match = serverSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    let result;
    if (match) {
      result = await onAdd({ skill_id: match.id, proficiency, description });
    } else {
      result = await onAdd({ name: skillName, category, proficiency, description });
    }
    if (result !== false) {
      setSkillName('');
      setDescription('');
      setProficiency('beginner');
    }
    return result;
  };

  const handleNext = async () => {
    if (skillName.trim()) {
      const added = await handleAdd();
      if (added === false) return; // Stop if failed to add
    }
    onNext();
  };

  const handleBack = async () => {
    if (skillName.trim()) {
      const added = await handleAdd();
      if (added === false) return;
    }
    onBack();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div className="premium-grid" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#1f1f2e', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ gridColumn: '1 / -1', margin: 0, fontSize: '1.1rem', color: '#f3f4f6' }}>{title}</h3>
        
        <div className="input-group full-width">
          <label>Skill Name</label>
          <div className="input-icon-wrapper" style={{position: 'relative'}}>
            <Search size={18} className="input-icon" />
            <input type="text" className="input-field input-with-icon" placeholder="e.g. React, Guitar, Spanish..." value={skillName} onChange={e => { setSkillName(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 200)} />
            {showDropdown && searchMatches.length > 0 && skillName.length > 1 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#2a2a35', border: '1px solid #4b4b5c', borderRadius: '8px', zIndex: 10, marginTop: '4px', overflow: 'hidden' }}>
                {searchMatches.slice(0,5).map(m => (
                  <div key={m.id} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }} onClick={() => { setSkillName(m.name); setCategory(m.category); setShowDropdown(false); }}>
                    {m.name} <span style={{ color: '#6b6b7b', fontSize: '0.8rem', marginLeft: '8px' }}>{m.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="input-group">
          <label>Category</label>
          <select className="input-field" value={category} onChange={e => setCategory(e.target.value)} style={{ paddingLeft: '1rem' }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label>{type === 'teach' ? 'Your Level' : 'Target Level'}</label>
          <select className="input-field" value={proficiency} onChange={e => setProficiency(e.target.value)} style={{ paddingLeft: '1rem' }}>
            {proficiencies.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        <div className="input-group full-width">
          <label>{type === 'teach' ? 'Short Description (Optional)' : 'Learning Goal (Optional)'}</label>
          <input type="text" className="input-field" placeholder={type === 'teach' ? 'e.g. I can help you build your first app...' : 'e.g. I want to converse fluently...'} value={description} onChange={e => setDescription(e.target.value)} style={{ paddingLeft: '1rem' }} />
        </div>

        <div className="full-width" style={{ marginTop: '0.5rem' }}>
          <button type="button" className="btn-outline" onClick={handleAdd} disabled={!skillName.trim()}>
            <Plus size={16} /> Add Skill
          </button>
        </div>
      </div>

      {skills.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>Added Skills</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {skills.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: '#f3f4f6' }}>{s.skill_name}</strong>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderRadius: '12px' }}>{s.proficiency}</span>
                  </div>
                  {(s.description || s.category) && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>{s.category} {s.description ? `· ${s.description}` : ''}</p>}
                </div>
                <button type="button" onClick={() => onRemove(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="register-nav">
        <button className="btn-outline" onClick={handleBack}><ArrowLeft size={16} />Back</button>
        <button className="btn-primary" onClick={handleNext}><span>Continue</span><ArrowRight size={16} /></button>
      </div>
    </motion.div>
  );
}
