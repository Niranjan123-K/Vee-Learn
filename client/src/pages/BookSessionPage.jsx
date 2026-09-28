import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, BookOpen, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import PageHeader from '../components/PageHeader';
import { getInitials } from '../utils/formatters';
import './BookSessionPage.css';

export default function BookSessionPage() {
  const { teacherId, skillId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const fetchUser = useAuthStore(state => state.fetchUser);

  const [teacher, setTeacher] = useState(null);
  const [skill, setSkill] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (user?.id === teacherId) {
      setError('You cannot book a session with yourself.');
      setLoading(false);
      return;
    }

    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/users/${teacherId}`);
        const data = res.data.user || res.data;
        const teachingSkills = (data.skills || []).filter(s => s.type === 'teach');
        data.teaching_skills = teachingSkills;
        setTeacher(data);
        
        if (skillId && skillId !== 'general') {
          const matched = teachingSkills.find(s => s.skill_name === skillId);
          if (matched) {
            setSkill(matched.skill_id);
          } else if (teachingSkills.length > 0) {
            setSkill(teachingSkills[0].skill_id);
          }
        } else if (teachingSkills.length > 0) {
          setSkill(teachingSkills[0].skill_id);
        }
      } catch (err) {
        setError('Teacher not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [teacherId, user?.id, skillId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!skill || !date || !time) {
      setError('Please fill in all details.');
      return;
    }

    setBooking(true);
    setError('');
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await api.post('/sessions', {
        teacher_id: teacherId,
        skill_id: skill,
        scheduled_at: scheduledAt,
        duration_minutes: 60,
      });
      fetchUser();
        setStep(4); // Success step
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book session');
      setBooking(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="page-container">
         <div className="skeleton" style={{ height: '200px', maxWidth: '600px', margin: '0 auto' }} />
      </div>
    );
  }

  if (error && !teacher) {
    return (
      <div className="page-container text-center pt-xl">
        <h3 className="text-danger">{error}</h3>
        <button className="btn-secondary mt-md" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const steps = [
    { num: 1, label: 'Skill & Date' },
    { num: 2, label: 'Time' },
    { num: 3, label: 'Review' },
  ];

  return (
    <div className="page-container fade-in">
      <PageHeader 
        breadcrumb={[{ label: 'Explore', to: '/explore' }, { label: teacher.name, to: `/profile/${teacherId}` }, { label: 'Book Session' }]}
        title="Request a Session"
      />

      <div className="book-layout">
        
        {/* LEFT: Teacher Summary */}
        <aside className="book-sidebar hide-on-mobile">
          <div className="card">
            <div className="card-body flex-col items-center text-center gap-md">
               <div className="avatar-wrapper">
                 {teacher.avatar_url ? <img src={`http://localhost:5000${teacher.avatar_url}`} alt={teacher.name} className="avatar avatar-xl" /> : <div className="avatar-fallback avatar-xl">{getInitials(teacher.name)}</div>}
               </div>
               <div>
                 <h3 className="font-lg text-primary">{teacher.name}</h3>
                 <p className="text-sm text-secondary mt-xs">{teacher.bio ? (teacher.bio.length > 60 ? teacher.bio.substring(0, 60) + '...' : teacher.bio) : 'Teacher'}</p>
               </div>
            </div>
            <div className="card-footer" style={{justifyContent: 'center', backgroundColor: 'var(--bg-elevated)'}}>
               <span className="text-xs text-muted">Cost: 1 Credit / hour</span>
            </div>
          </div>
        </aside>

        {/* RIGHT: Booking Flow */}
        <main className="book-main">
          
          {step < 4 && (
            <div className="book-stepper">
              {steps.map(s => (
                <div key={s.num} className={`stepper-step ${step >= s.num ? 'active' : ''}`}>
                  <div className="step-circle">
                    {step > s.num ? <CheckCircle size={14} /> : s.num}
                  </div>
                  <span className="step-label">{s.label}</span>
                  {s.num < steps.length && <div className="step-line" />}
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="card-body">
              {error && (
                <div className="auth-error mb-lg">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                
                {/* STEP 1: Skill & Date */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-col gap-lg"
                  >
                    <div className="form-group">
                      <label className="form-label flex items-center gap-xs text-xs font-semibold text-muted uppercase tracking-wider mb-xs">
                        <BookOpen size={14}/> Select a Skill
                      </label>
                      <select 
                        className="form-select w-full"
                        value={skill}
                        onChange={(e) => setSkill(e.target.value)}
                        required
                      >
                        <option value="" disabled>Choose a skill</option>
                        {teacher.teaching_skills?.map(s => (
                          <option key={s.skill_id} value={s.skill_id}>{s.skill_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label flex items-center gap-xs text-xs font-semibold text-muted uppercase tracking-wider mb-xs">
                        <Calendar size={14}/> Choose Date
                      </label>
                      <input 
                        type="date"
                        className="form-input w-full"
                        style={{ colorScheme: 'dark' }}
                        value={date}
                        min={today}
                        onChange={(e) => setDate(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.target.showPicker();
                          } catch (err) {
                            // showPicker might not be supported in older browsers, fallback to native behavior
                          }
                        }}
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Time */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-col gap-lg"
                  >
                    <div className="form-group">
                      <label className="form-label flex items-center gap-xs text-xs font-semibold text-muted uppercase tracking-wider mb-xs">
                        <Clock size={14}/> Choose Time
                      </label>
                      <input 
                        type="time"
                        className="form-input w-full"
                        style={{ colorScheme: 'dark' }}
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onClick={(e) => {
                          try {
                            e.target.showPicker();
                          } catch (err) {
                            // showPicker might not be supported in older browsers, fallback to native behavior
                          }
                        }}
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Review */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-col gap-lg"
                  >
                    <div className="review-box">
                      <div className="review-row">
                        <span className="text-secondary text-sm">Teacher</span>
                        <span className="text-primary font-md">{teacher.name}</span>
                      </div>
                      <div className="divider-sm" style={{margin: '8px 0'}} />
                      <div className="review-row">
                        <span className="text-secondary text-sm">Skill</span>
                        <span className="text-primary font-md">
                          {teacher.teaching_skills?.find(s => s.skill_id === skill)?.skill_name || 'Selected Skill'}
                        </span>
                      </div>
                      <div className="divider-sm" style={{margin: '8px 0'}} />
                      <div className="review-row">
                        <span className="text-secondary text-sm">Schedule</span>
                        <span className="text-primary font-md">
                          {date ? new Date(date).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'}) : ''} at {time}
                        </span>
                      </div>
                      <div className="divider-sm" style={{margin: '8px 0'}} />
                      <div className="review-row">
                        <span className="text-secondary text-sm">Cost</span>
                        <span className="text-warning font-md font-semibold">1 Credit</span>
                      </div>
                    </div>
                    <div className="info-alert bg-info-muted text-info">
                      <AlertCircle size={16} />
                      <span className="text-xs">Your credit will be held in escrow until the session is completed.</span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Success */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-col items-center text-center gap-md py-xl"
                  >
                    <CheckCircle size={64} className="text-success" />
                    <h2 className="font-2xl mt-sm">Session Requested!</h2>
                    <p className="text-secondary mb-lg">
                      Your request has been sent to {teacher.name}. You will be notified once they confirm.
                    </p>
                    <div className="flex gap-md w-full">
                      <button className="btn-secondary w-full" onClick={() => navigate('/dashboard')}>
                        Return Home
                      </button>
                      <button className="btn-primary w-full" onClick={() => navigate('/sessions')}>
                        View My Sessions
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            {step < 4 && (
              <div className="card-footer">
                {step > 1 ? (
                  <button type="button" className="btn-ghost" onClick={() => setStep(step - 1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                ) : <div />}
                
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleSubmit}
                  disabled={
                    (step === 1 && (!skill || !date)) || 
                    (step === 2 && !time) ||
                    booking
                  }
                >
                  {booking ? 'Booking...' : (step === 3 ? 'Confirm Request' : 'Continue')} 
                  {step < 3 && !booking && <ArrowRight size={16} />}
                </button>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}

