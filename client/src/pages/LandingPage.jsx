import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Sparkles, ArrowRight, Share2, Clock, BookOpen,
  Code, Globe, Music, Palette, Briefcase, Dumbbell,
  ChefHat, Star, Users, Zap, Award
} from 'lucide-react';
import './LandingPage.css';

const steps = [
  { icon: Share2, title: 'Share Your Skills', desc: 'Offer what you know — from coding to cooking, music to marketing.' },
  { icon: Clock, title: 'Earn Time Credits', desc: 'Every hour you teach earns you one time credit to spend on learning.' },
  { icon: BookOpen, title: 'Learn Anything', desc: 'Spend your credits to learn from talented people in the community.' },
];

const stats = [
  { value: '12K+', label: 'Active Users' },
  { value: '340+', label: 'Skills Available' },
  { value: '28K+', label: 'Sessions Completed' },
  { value: '95K+', label: 'Credits Traded' },
];

const categories = [
  { icon: Code, name: 'Programming', count: 85 },
  { icon: Globe, name: 'Languages', count: 64 },
  { icon: Music, name: 'Music', count: 42 },
  { icon: Palette, name: 'Art & Design', count: 57 },
  { icon: Briefcase, name: 'Business', count: 38 },
  { icon: Dumbbell, name: 'Fitness', count: 31 },
  { icon: ChefHat, name: 'Cooking', count: 29 },
  { icon: Zap, name: 'Technology', count: 46 },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'UX Designer',
    text: 'I taught Figma basics and learned conversational Japanese. Vee Learn made the exchange feel natural and fair.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Guitar Teacher',
    text: 'Trading guitar lessons for Python tutorials? Best deal ever! The community here is incredibly supportive.',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Marketing Analyst',
    text: 'The time-banking model is genius. I finally learned watercolor painting without spending a dime.',
    rating: 5,
  },
];

function AnimatedSection({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Floating orbs */}
      <div className="landing-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <div className="sidebar-logo-icon" style={{ width: 32, height: 32 }}>
              <Sparkles size={18} />
            </div>
            <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Vee Learn</span>
          </div>
          <nav className="landing-nav">
            <button onClick={() => navigate('/login')} className="gradient-btn-outline btn-sm">
              Log In
            </button>
            <button onClick={() => navigate('/register')} className="gradient-btn btn-sm">
              <span>Get Started</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="hero-badge badge badge-primary">
            <Sparkles size={14} /> Time-Banking Skill Exchange
          </div>
          <h1 className="hero-title">
            Trade <span className="gradient-text">Skills</span>,{' '}
            Not Money
          </h1>
          <p className="hero-subtitle">
            Join a community where your knowledge is currency. Teach what you know,
            learn what you love, and earn time credits along the way.
          </p>
          <div className="hero-actions">
            <button className="gradient-btn btn-lg" onClick={() => navigate('/register')}>
              <span>Start Learning Free</span>
              <ArrowRight size={18} />
            </button>
            <button className="gradient-btn-outline btn-lg" onClick={() => {
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              How It Works
            </button>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="hero-card-stack">
            <div className="hero-floating-card card-1 glass-card-static">
              <Code size={24} style={{ color: '#60A5FA' }} />
              <span>React.js</span>
            </div>
            <div className="hero-floating-card card-2 glass-card-static">
              <Music size={24} style={{ color: '#C084FC' }} />
              <span>Piano</span>
            </div>
            <div className="hero-floating-card card-3 glass-card-static">
              <Globe size={24} style={{ color: '#4ADE80' }} />
              <span>Spanish</span>
            </div>
            <div className="hero-floating-card card-4 glass-card-static">
              <Palette size={24} style={{ color: '#FB923C' }} />
              <span>Painting</span>
            </div>
            <div className="hero-center-glow" />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        {stats.map((stat, i) => (
          <AnimatedSection key={stat.label} className="stat-item">
            <motion.span
              className="stat-value gradient-text"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {stat.value}
            </motion.span>
            <span className="stat-label">{stat.label}</span>
          </AnimatedSection>
        ))}
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="landing-section">
        <AnimatedSection>
          <h2 className="landing-section-title">
            How <span className="gradient-text">Vee Learn</span> Works
          </h2>
          <p className="landing-section-desc">Three simple steps to start your skill exchange journey</p>
        </AnimatedSection>

        <div className="steps-grid">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <AnimatedSection key={step.title} className="step-card glass-card-static">
                <div className="step-number">{i + 1}</div>
                <div className="step-icon">
                  <Icon size={28} />
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* Featured Skills */}
      <section className="landing-section">
        <AnimatedSection>
          <h2 className="landing-section-title">
            Explore <span className="gradient-text">Popular Skills</span>
          </h2>
          <p className="landing-section-desc">Browse our most popular skill categories</p>
        </AnimatedSection>

        <div className="categories-grid">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                className="category-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate('/register')}
                style={{ cursor: 'pointer' }}
              >
                <div className="category-icon">
                  <Icon size={24} />
                </div>
                <h4 className="category-name">{cat.name}</h4>
                <span className="category-count">{cat.count} teachers</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-section">
        <AnimatedSection>
          <h2 className="landing-section-title">
            Loved by <span className="gradient-text">Learners</span>
          </h2>
          <p className="landing-section-desc">See what our community has to say</p>
        </AnimatedSection>

        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} className="testimonial-card glass-card-static">
              <div className="star-rating" style={{ marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className={s <= t.rating ? 'star-filled' : 'star-empty'} />
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="avatar-fallback avatar-md" style={{ fontSize: '0.75rem' }}>
                  {t.name.split(' ').map((w) => w[0]).join('')}
                </div>
                <div>
                  <h4 className="testimonial-name">{t.name}</h4>
                  <span className="testimonial-role">{t.role}</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection className="landing-cta">
        <div className="cta-card">
          <Award size={48} style={{ color: 'var(--accent-secondary)' }} />
          <h2 className="cta-title">Ready to Start Trading Skills?</h2>
          <p className="cta-desc">Join thousands of learners and teachers. Your first 3 credits are on us!</p>
          <button className="gradient-btn btn-lg" onClick={() => navigate('/register')}>
            <span>Create Free Account</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="sidebar-logo-icon" style={{ width: 28, height: 28 }}>
                <Sparkles size={14} />
              </div>
              <span className="gradient-text" style={{ fontSize: '1rem', fontWeight: 700 }}>Vee Learn</span>
            </div>
            <p className="footer-tagline">Trade skills, not money.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h5>Platform</h5>
              <a href="#how-it-works">How It Works</a>
              <a href="#!">Browse Skills</a>
              <a href="#!">Pricing</a>
            </div>
            <div className="footer-col">
              <h5>Company</h5>
              <a href="#!">About Us</a>
              <a href="#!">Careers</a>
              <a href="#!">Blog</a>
            </div>
            <div className="footer-col">
              <h5>Support</h5>
              <a href="#!">Help Center</a>
              <a href="#!">Contact</a>
              <a href="#!">Privacy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Vee Learn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
