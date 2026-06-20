import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, Zap, Shield, Globe } from 'lucide-react';
import './AboutPage.css';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <motion.section 
        className="about-hero"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="about-hero-orbs">
          <div className="orb orb-primary" />
          <div className="orb orb-secondary" />
        </div>
        
        <motion.div className="about-hero-content" variants={fadeIn}>
          <motion.div className="badge-pill" variants={fadeIn}>
            <Zap size={14} className="text-accent" />
            <span>The Time-Banking Revolution</span>
          </motion.div>
          <motion.h1 variants={fadeIn} className="about-title">
            Learn anything.<br />
            Pay with <span className="gradient-text">Time.</span>
          </motion.h1>
          <motion.p variants={fadeIn} className="about-subtitle">
            Vee Learn is a peer-to-peer educational platform where money doesn't matter. 
            We believe everyone has something valuable to teach, and something new to learn.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Why Vee Learn Section */}
      <motion.section 
        className="about-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <motion.div className="section-header" variants={fadeIn}>
          <h2>Why Vee Learn?</h2>
          <p>Traditional education is gated by money. We gate it by contribution.</p>
        </motion.div>

        <div className="features-grid">
          <motion.div className="feature-card surface-card" variants={fadeIn}>
            <div className="feature-icon-wrapper blue">
              <BookOpen size={24} />
            </div>
            <h3>Democratized Learning</h3>
            <p>Access high-quality tutoring and mentorship from peers and professionals without financial barriers.</p>
          </motion.div>

          <motion.div className="feature-card surface-card" variants={fadeIn}>
            <div className="feature-icon-wrapper green">
              <Clock size={24} />
            </div>
            <h3>Time is Currency</h3>
            <p>Earn credits by teaching what you know. Spend those credits to learn what you don't. 1 Hour = 1 Credit.</p>
          </motion.div>

          <motion.div className="feature-card surface-card" variants={fadeIn}>
            <div className="feature-icon-wrapper purple">
              <Users size={24} />
            </div>
            <h3>Global Connections</h3>
            <p>Meet students, hobbyists, and professionals across different fields, campuses, and borders.</p>
          </motion.div>
        </div>
      </motion.section>

      {/* How it Works Timeline */}
      <motion.section 
        className="about-section timeline-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <motion.div className="section-header" variants={fadeIn}>
          <h2>How to use Vee Learn</h2>
          <p>Your journey from student to teacher and back again.</p>
        </motion.div>

        <div className="timeline">
          <motion.div className="timeline-item" variants={fadeIn}>
            <div className="timeline-marker">1</div>
            <div className="timeline-content surface-card">
              <h4>Build Your Arsenal</h4>
              <p>Set up your profile by listing the skills you can teach and the skills you want to learn. The more complete your profile, the better your matches.</p>
            </div>
          </motion.div>

          <motion.div className="timeline-item" variants={fadeIn}>
            <div className="timeline-marker">2</div>
            <div className="timeline-content surface-card">
              <h4>Share Your Craft</h4>
              <p>Match with students who want to learn your skills. Conduct a session, share your knowledge, and earn credits directly to your balance.</p>
            </div>
          </motion.div>

          <motion.div className="timeline-item" variants={fadeIn}>
            <div className="timeline-marker">3</div>
            <div className="timeline-content surface-card">
              <h4>Expand Your Horizons</h4>
              <p>Browse the Explore page to find tutors for your desired skills. Use your earned credits to book sessions and expand your mind.</p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer / CTA */}
      <motion.section 
        className="about-cta"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
      >
        <div className="cta-content surface-card">
          <Shield size={32} className="text-accent" style={{ marginBottom: '16px' }} />
          <h2>Ready to start exchanging?</h2>
          <p>Your 3.00 starting credits are waiting to be spent.</p>
        </div>
      </motion.section>
    </div>
  );
}
