import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, FileText, Coins, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import SkillBadge from '../components/SkillBadge';
import CreditBadge from '../components/CreditBadge';
import { getInitials } from '../utils/formatters';
import api from '../utils/api';
import './BookSessionPage.css';

export default function BookSessionPage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const [teacher, setTeacher] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await api.get(`/users/${teacherId}`);
        setTeacher(res.data.user || res.data);
      } catch {
        setTeacher(null);
      }
    };
    if (teacherId) fetchTeacher();
  }, [teacherId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const scheduled_at = new Date(`${date}T${time}:00`).toISOString();
      await api.post('/sessions', {
        teacher_id: teacherId,
        skill_id: selectedSkill,
        scheduled_at,
        duration_minutes: duration,
        notes,
      });
      navigate('/sessions');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to book session');
    }
    setLoading(false);
  };

  const creditCost = 1;
  const hasEnoughCredits = (user?.credit_balance || 0) >= creditCost;

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00',
  ];

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="section-title">
          Book a <span className="gradient-text">Session</span>
        </h1>
        <p className="section-subtitle">Schedule a learning session with your chosen teacher</p>
      </motion.div>

      <div className="book-layout">
        <motion.form
          className="book-form surface-card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Teacher Info */}
          {teacher && (
            <div className="book-teacher-info">
              {teacher.avatar ? (
                <img src={teacher.avatar} alt={teacher.name} className="avatar avatar-lg" />
              ) : (
                <div className="avatar-fallback avatar-lg">{getInitials(teacher.name)}</div>
              )}
              <div>
                <h3>{teacher.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                  {teacher.bio || 'Experienced teacher'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="auth-error">{error}</div>
          )}

          {/* Skill selector */}
          <div className="input-group">
            <label>Skill</label>
            <select
              className="input-field"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              required
            >
              <option value="">Select a skill...</option>
              {teacher?.skills?.filter(s => s.type === 'teach').map((skill) => (
                <option key={skill.skill_id || skill.id} value={skill.skill_id || skill.id}>
                  {skill.skill_name || skill.name}
                </option>
              ))}
              {teacher?.skills?.filter(s => s.type === 'teach').length === 0 && (
                <option value="" disabled>No skills available</option>
              )}
            </select>
          </div>

          {/* Date picker */}
          <div className="input-group">
            <label><Calendar size={14} style={{ marginRight: 6 }} />Date</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Time slot selector */}
          <div className="input-group">
            <label><Clock size={14} style={{ marginRight: 6 }} />Time Slot</label>
            <div className="time-slots">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`time-slot ${time === slot ? 'active' : ''}`}
                  onClick={() => setTime(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="input-group">
            <label>Duration (minutes)</label>
            <select
              className="input-field"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          {/* Notes */}
          <div className="input-group">
            <label><FileText size={14} style={{ marginRight: 6 }} />Notes (optional)</label>
            <textarea
              className="input-field"
              placeholder="What do you want to learn? Any specific topics?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Cost summary */}
          <div className="book-cost-summary surface-card">
            <div className="book-cost-row">
              <span>Session Cost</span>
              <span className="book-cost-value">
                <Coins size={16} style={{ color: 'var(--accent-secondary)' }} />
                {creditCost} credit
              </span>
            </div>
            <div className="book-cost-row">
              <span>Your Balance</span>
              <CreditBadge amount={user?.credit_balance || 0} size="sm" />
            </div>
          </div>

          {!hasEnoughCredits && (
            <div className="book-warning">
              <AlertCircle size={16} />
              Insufficient credits. You need at least {creditCost} credit to book a session. Teach to earn more!
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !hasEnoughCredits || !selectedSkill || !date || !time}
            style={{ width: '100%' }}
          >
            <span>{loading ? 'Booking...' : 'Book Session'}</span>
          </button>
        </motion.form>
      </div>
    </div>
  );
}
