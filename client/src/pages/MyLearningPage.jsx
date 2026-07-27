import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayCircle, Clock, CheckCircle2, TrendingUp,
  Award, BookOpen, Star, Users, Flame, Trophy,
  CalendarDays, Activity, ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import { formatRelativeTime } from '../utils/formatters';
import './MyLearningPage.css';

export default function MyLearningPage() {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, teachRes] = await Promise.all([
          api.get('/sessions'),
          api.get('/users/teachers')
        ]);
        
        // Filter sessions where the user is the learner
        const myLearningSessions = (sessRes.data.sessions || sessRes.data || [])
          .filter(s => s.learner_id === user?.id);
          
        setSessions(myLearningSessions);
        setTeachers(teachRes.data.users || teachRes.data || []);
      } catch (err) {
        console.error('Failed to fetch learning data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  // ─── Data Derivation ──────────────────────────────────────────────

  const now = new Date();
  
  // Categorize sessions
  const completed = sessions.filter(s => s.status === 'completed');
  const upcoming = sessions.filter(s => s.status === 'confirmed' && new Date(s.scheduled_at) > now)
                           .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  
  // Next session (Continue Learning)
  const nextSession = upcoming[0];
  
  // Analytics
  const activeSkills = new Set(sessions.map(s => s.skill_name));
  const completedSkills = new Set(completed.map(s => s.skill_name));
  
  const totalMinutes = completed.reduce((acc, s) => acc + (s.duration_minutes || 60), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  
  const creditsSpent = completed.reduce((acc, s) => acc + Math.ceil((s.duration_minutes || 60) / 60), 0);
  
  const uniqueTeachers = new Set(sessions.map(s => s.teacher_id));
  
  // Most Learned Skill
  const skillCounts = {};
  completed.forEach(s => {
    skillCounts[s.skill_name] = (skillCounts[s.skill_name] || 0) + 1;
  });
  let mostLearnedSkill = "N/A";
  let maxCount = 0;
  for (const [skill, count] of Object.entries(skillCounts)) {
    if (count > maxCount) { maxCount = count; mostLearnedSkill = skill; }
  }

  // Streak Calculation
  const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const uniqueDays = [...new Set(
    completed.map(s => getStartOfDay(new Date(s.scheduled_at)))
  )].sort((a, b) => b - a);

  let streak = 0;
  if (uniqueDays.length > 0) {
    let currentCheck = getStartOfDay(now);
    if (uniqueDays[0] === currentCheck || uniqueDays[0] === currentCheck - oneDay) {
      streak = 1;
      currentCheck = uniqueDays[0];
      for (let i = 1; i < uniqueDays.length; i++) {
        if (uniqueDays[i] === currentCheck - oneDay) {
          streak++;
          currentCheck -= oneDay;
        } else {
          break;
        }
      }
    }
  }

  // Achievements
  const achievements = [];
  if (user) achievements.push("🎉 Joined Vee Learn");
  if (completed.length >= 1) achievements.push("🏆 First Session Completed");
  if (completed.length >= 5) achievements.push("🏆 5 Sessions Finished");
  if (totalHours >= 10) achievements.push("🧠 10 Hours of Learning");
  if (streak >= 3) achievements.push("🔥 3 Day Streak");

  // Favorite Teachers (Top 3 by completed sessions)
  const teacherCounts = {};
  completed.forEach(s => {
    teacherCounts[s.teacher_id] = (teacherCounts[s.teacher_id] || 0) + 1;
  });
  const favoriteTeacherIds = Object.entries(teacherCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0]);
  
  const favoriteTeachers = teachers.filter(t => favoriteTeacherIds.includes(t.id || t._id));

  // Recommendations
  const recommendedTeachers = teachers
    .filter(t => !uniqueTeachers.has(t.id || t._id)) // teachers user hasn't met
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 2);

  // ─── Render Helpers ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page-container fade-in">
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
        <div className="learning-stats-grid" style={{ marginTop: '32px' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in learning-dashboard">
      
      {/* HEADER & CONTINUE LEARNING */}
      <section className="learning-hero">
        <div className="learning-hero-content">
          <div className="learning-hero-label">
            <PlayCircle size={14} /> Continue Learning
          </div>
          {nextSession ? (
            <>
              <h1 className="learning-hero-title">{nextSession.skill_name}</h1>
              <p className="learning-hero-subtitle">
                Upcoming session with {nextSession.teacher_name} {formatRelativeTime(nextSession.scheduled_at)}
              </p>
            </>
          ) : (
            <>
              <h1 className="learning-hero-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="learning-hero-subtitle">
                Track your learning journey, continue sessions, and monitor your progress.
              </p>
            </>
          )}
        </div>
        <div className="learning-hero-action">
          {nextSession ? (
            <button 
              className="btn-primary btn-lg" 
              onClick={() => navigate(`/sessions/${nextSession.id}/chat`)}
              style={{ padding: '12px 24px', fontSize: '15px' }}
            >
              Open Workspace
            </button>
          ) : (
            <button 
              className="btn-primary btn-lg" 
              onClick={() => navigate('/explore')}
              style={{ padding: '12px 24px', fontSize: '15px' }}
            >
              Explore Skills
            </button>
          )}
        </div>
      </section>

      <div className="learning-main-grid">
        
        {/* LEFT COLUMN: Main content */}
        <div>
          {/* UPCOMING SESSIONS */}
          {upcoming.length > 0 && (
            <section className="learning-section">
              <h2 className="learning-section-title">
                <CalendarDays size={20} className="text-accent" />
                Upcoming Sessions
              </h2>
              <div className="learning-list">
                {upcoming.slice(0,3).map(session => (
                  <div key={session.id} className="learning-list-item">
                    <div className="learning-item-info">
                      <div className="learning-item-date">
                        <span className="learning-item-date-day">{new Date(session.scheduled_at).getDate()}</span>
                        <span className="learning-item-date-month">
                          {new Date(session.scheduled_at).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="learning-item-meta">
                        <h4>{session.skill_name}</h4>
                        <p>With {session.teacher_name} • {new Date(session.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className="learning-item-action">
                      <button 
                        className="btn-outline btn-sm"
                        onClick={() => navigate(`/sessions/${session.id}/chat`)}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ACTIVE LEARNING */}
          <section className="learning-section">
            <h2 className="learning-section-title">
              <Activity size={20} className="text-info" />
              Active Learning
            </h2>
            {activeSkills.size > 0 ? (
              <div className="learning-list">
                {Array.from(activeSkills).map(skillName => {
                  const skillSessions = sessions.filter(s => s.skill_name === skillName);
                  const teacher = skillSessions[0]?.teacher_name;
                  const count = skillSessions.length;
                  return (
                    <div key={skillName} className="learning-list-item" onClick={() => navigate('/explore')} style={{ cursor: 'pointer' }}>
                      <div className="learning-item-info">
                        <div className="learning-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)' }}>
                          <BookOpen size={16} />
                        </div>
                        <div className="learning-item-meta">
                          <h4>{skillName}</h4>
                          <p>Taught by {teacher} • {count} session{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-muted" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="learning-empty">
                <div className="learning-empty-icon"><BookOpen size={24} /></div>
                <p className="text-muted">You are not actively learning any skills yet.</p>
                <button className="btn-outline btn-sm" onClick={() => navigate('/explore')}>Find a Teacher</button>
              </div>
            )}
          </section>

          {/* LEARNING JOURNEY TIMELINE */}
          <section className="learning-section">
            <h2 className="learning-section-title">
              <TrendingUp size={20} className="text-success" />
              Learning Journey
            </h2>
            {sessions.length > 0 ? (
              <div className="learning-timeline">
                {[...sessions].sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)).slice(0, 5).map(session => (
                  <div key={session.id} className={`timeline-item ${session.status === 'completed' ? 'completed' : ''}`}>
                    <div className="timeline-item-date">{new Date(session.scheduled_at).toLocaleDateString()}</div>
                    <div className="timeline-item-content">
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{session.skill_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {session.status === 'completed' ? 'Completed session with' : 'Scheduled with'} {session.teacher_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">Book your first session to start your journey.</p>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Stats & Secondary Data */}
        <div>
          
          {/* LEARNING STREAK */}
          <div className="card mb-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Learning Streak</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flame size={20} className="text-warning fill-warning" />
                  {streak} {streak === 1 ? 'Day' : 'Days'}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '100px' }}>
                Keep learning to maintain your streak!
              </div>
            </div>
          </div>

          {/* ANALYTICS STATS */}
          <section className="learning-section">
            <h2 className="learning-section-title" style={{ fontSize: '16px' }}>Learning Stats</h2>
            <div className="learning-stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="learning-stat-card" style={{ padding: '16px' }}>
                <div className="learning-stat-title">Hours Learned</div>
                <div className="learning-stat-value" style={{ fontSize: '24px' }}>{totalHours}</div>
              </div>
              <div className="learning-stat-card" style={{ padding: '16px' }}>
                <div className="learning-stat-title">Skills</div>
                <div className="learning-stat-value" style={{ fontSize: '24px' }}>{activeSkills.size}</div>
              </div>
              <div className="learning-stat-card" style={{ padding: '16px' }}>
                <div className="learning-stat-title">Teachers</div>
                <div className="learning-stat-value" style={{ fontSize: '24px' }}>{uniqueTeachers.size}</div>
              </div>
              <div className="learning-stat-card" style={{ padding: '16px' }}>
                <div className="learning-stat-title">Top Skill</div>
                <div className="learning-stat-value" style={{ fontSize: '16px', marginTop: '8px', lineHeight: 1.2 }}>{mostLearnedSkill}</div>
              </div>
            </div>
          </section>

          {/* ACHIEVEMENTS */}
          <section className="learning-section">
            <h2 className="learning-section-title" style={{ fontSize: '16px' }}>
              <Trophy size={16} className="text-warning" /> Achievements
            </h2>
            <div className="learning-pill-grid">
              {achievements.map((ach, i) => (
                <div key={i} className="learning-pill">{ach}</div>
              ))}
            </div>
          </section>

          {/* LEARNING INTERESTS */}
          <section className="learning-section">
            <h2 className="learning-section-title" style={{ fontSize: '16px' }}>
              <Star size={16} className="text-accent" /> Learning Interests
            </h2>
            <div className="learning-pill-grid">
              {activeSkills.size > 0 ? (
                Array.from(activeSkills).map((skill, i) => (
                  <div key={i} className="learning-pill" style={{ cursor: 'pointer' }} onClick={() => navigate(`/explore?q=${skill}`)}>
                    {skill}
                  </div>
                ))
              ) : (
                <p className="text-muted text-sm">No interests derived yet.</p>
              )}
            </div>
          </section>

          {/* FAVORITE TEACHERS */}
          {favoriteTeachers.length > 0 && (
            <section className="learning-section">
              <h2 className="learning-section-title" style={{ fontSize: '16px' }}>
                <Users size={16} className="text-info" /> Favorite Teachers
              </h2>
              <div className="learning-list">
                {favoriteTeachers.map(teacher => (
                  <div key={teacher.id || teacher._id} className="learning-list-item" style={{ padding: '12px' }} onClick={() => navigate(`/profile/${teacher.id || teacher._id}`)}>
                    <div className="learning-item-info">
                      {teacher.avatar ? (
                        <img src={`http://localhost:5000${teacher.avatar}`} alt={teacher.name} className="avatar avatar-sm" />
                      ) : (
                        <div className="avatar-fallback avatar-sm" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                          {teacher.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="learning-item-meta">
                        <h4 style={{ fontSize: '13px' }}>{teacher.name}</h4>
                        <p style={{ fontSize: '11px' }}>{teacher.averageRating ? `${Number(teacher.averageRating).toFixed(1)} Rating` : 'New'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* RECOMMENDATIONS */}
          {recommendedTeachers.length > 0 && (
            <section className="learning-section">
              <h2 className="learning-section-title" style={{ fontSize: '16px' }}>
                💡 Recommended for you
              </h2>
              <div className="learning-list">
                {recommendedTeachers.map(teacher => (
                  <div key={teacher.id || teacher._id} className="learning-list-item" style={{ padding: '12px' }} onClick={() => navigate(`/profile/${teacher.id || teacher._id}`)}>
                    <div className="learning-item-info">
                      <div className="learning-item-meta">
                        <h4 style={{ fontSize: '13px', color: 'var(--accent)' }}>{teacher.name}</h4>
                        <p style={{ fontSize: '11px' }}>{teacher.department || 'Professional'}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
