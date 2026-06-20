import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import SkillBadge from '../components/SkillBadge';
import './AuthPages.css';

const allSkills = [
  { name: 'JavaScript', category: 'programming' },
  { name: 'Python', category: 'programming' },
  { name: 'React', category: 'programming' },
  { name: 'Node.js', category: 'programming' },
  { name: 'SQL', category: 'programming' },
  { name: 'TypeScript', category: 'programming' },
  { name: 'Spanish', category: 'languages' },
  { name: 'French', category: 'languages' },
  { name: 'Mandarin', category: 'languages' },
  { name: 'Japanese', category: 'languages' },
  { name: 'German', category: 'languages' },
  { name: 'Guitar', category: 'music' },
  { name: 'Piano', category: 'music' },
  { name: 'Singing', category: 'music' },
  { name: 'Music Production', category: 'music' },
  { name: 'Drawing', category: 'art' },
  { name: 'Painting', category: 'art' },
  { name: 'Photography', category: 'art' },
  { name: 'UI/UX Design', category: 'design' },
  { name: 'Graphic Design', category: 'design' },
  { name: 'Figma', category: 'design' },
  { name: 'Marketing', category: 'business' },
  { name: 'Public Speaking', category: 'business' },
  { name: 'Excel', category: 'business' },
  { name: 'Cooking', category: 'cooking' },
  { name: 'Baking', category: 'cooking' },
  { name: 'Yoga', category: 'fitness' },
  { name: 'Weight Training', category: 'fitness' },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillsTeaching, setSkillsTeaching] = useState([]);
  const [skillsLearning, setSkillsLearning] = useState([]);
  const [searchTeach, setSearchTeach] = useState('');
  const [searchLearn, setSearchLearn] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const register = useAuthStore(state => state.register);
  const navigate = useNavigate();

  const toggleSkill = (skill, list, setList) => {
    const exists = list.find((s) => s.name === skill.name);
    if (exists) {
      setList(list.filter((s) => s.name !== skill.name));
    } else {
      setList([...list, skill]);
    }
  };

  const filteredTeachSkills = allSkills.filter((s) =>
    s.name.toLowerCase().includes(searchTeach.toLowerCase())
  );

  const filteredLearnSkills = allSkills.filter((s) =>
    s.name.toLowerCase().includes(searchLearn.toLowerCase())
  );

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    const result = await register({
      name,
      email,
      password,
      skillsTeaching: skillsTeaching.map((s) => s.name),
      skillsLearning: skillsLearning.map((s) => s.name),
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
        </div>
        <motion.div
          className="auth-card glass-card-static register-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="success-message">
            <motion.div
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
            >
              <Check size={32} />
            </motion.div>
            <h2>Welcome to Vee Learn! 🎉</h2>
            <p>You've received <strong>3 free credits</strong> to get started. Redirecting to your dashboard...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <motion.div
        className="auth-card surface-card register-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <div className="auth-logo">
            <div className="sidebar-logo-icon" style={{ width: 40, height: 40 }}>
              <Sparkles size={20} />
            </div>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">
            {step === 1 && 'Start your skill exchange journey'}
            {step === 2 && 'What can you teach?'}
            {step === 3 && 'What do you want to learn?'}
          </p>
        </div>

        {/* Progress */}
        <div className="register-progress">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="progress-step">
              {i > 0 && <div className={`progress-line ${step > i ? 'active' : ''}`} />}
              <div className={`progress-dot ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <motion.div className="auth-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-form">
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-icon-wrapper">
                    <User size={18} className="input-icon" />
                    <input
                      type="text"
                      className="input-field input-with-icon"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <div className="input-icon-wrapper">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      className="input-field input-with-icon"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <div className="input-icon-wrapper">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      className="input-field input-with-icon"
                      placeholder="Choose a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="register-nav">
                <button
                  className="btn-primary"
                  disabled={!name || !email || !password}
                  onClick={() => setStep(2)}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="skill-search">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search skills to teach..."
                  value={searchTeach}
                  onChange={(e) => setSearchTeach(e.target.value)}
                />
              </div>
              <div className="skill-selection">
                {filteredTeachSkills.map((skill) => (
                  <SkillBadge
                    key={skill.name}
                    name={skill.name}
                    category={skill.category}
                    selected={skillsTeaching.find((s) => s.name === skill.name)}
                    onClick={() => toggleSkill(skill, skillsTeaching, setSkillsTeaching)}
                  />
                ))}
              </div>

              <div className="register-nav">
                <button className="btn-outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={() => setStep(3)}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="skill-search">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search skills to learn..."
                  value={searchLearn}
                  onChange={(e) => setSearchLearn(e.target.value)}
                />
              </div>
              <div className="skill-selection">
                {filteredLearnSkills.map((skill) => (
                  <SkillBadge
                    key={skill.name}
                    name={skill.name}
                    category={skill.category}
                    selected={skillsLearning.find((s) => s.name === skill.name)}
                    onClick={() => toggleSkill(skill, skillsLearning, setSkillsLearning)}
                  />
                ))}
              </div>

              <div className="register-nav">
                <button className="btn-outline" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <span>{loading ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
