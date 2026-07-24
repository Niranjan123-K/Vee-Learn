import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const profiles = {
  'youyou@example.com': {
    bio: 'Senior Java Developer with 5 years of experience building enterprise systems.',
    experience_level: 'expert',
    location: 'Coimbatore, India',
    availability: 'Weekends'
  },
  'niran@gmail.com': {
    bio: 'Passionate frontend developer specializing in React and Vue.',
    experience_level: 'intermediate',
    location: 'Chennai, India',
    availability: 'Evenings'
  },
  'demo123@gmail.com': {
    bio: 'Tech enthusiast and active learner exploring the Web3 space.',
    experience_level: 'beginner',
    location: 'Bangalore, India',
    availability: 'Anytime'
  },
  'mathan123@gmail.com': {
    bio: 'Backend engineer focusing on Python and Node.js microservices.',
    experience_level: 'intermediate',
    location: 'Madurai, India',
    availability: 'Weekdays'
  },
  'you2@example.com': {
    bio: 'UI/UX Designer creating seamless user experiences.',
    experience_level: 'expert',
    location: 'Chennai, India',
    availability: 'Evenings'
  },
  'you@example.com': {
    bio: 'Full stack developer who loves to build scalable web apps.',
    experience_level: 'intermediate',
    location: 'Coimbatore, India',
    availability: 'Anytime'
  },
  'alex@example.com': {
    bio: 'Product Designer and Figma expert helping startups build their brand.',
    experience_level: 'expert',
    location: 'San Francisco, USA',
    availability: 'Weekends'
  },
  'demo2@gmail.com': {
    bio: 'Demo account for testing the platform features.',
    experience_level: 'beginner',
    location: 'Remote',
    availability: 'Weekdays'
  },
  'niranjankali746@gmail.com': {
    bio: 'Software Engineer dedicated to building accessible software.',
    experience_level: 'expert',
    location: 'Chennai, India',
    availability: 'Anytime'
  },
  'jarvis@gamil.com': {
    bio: 'AI Assistant, ready to help you with anything.',
    experience_level: 'expert',
    location: 'Cloud',
    availability: 'Anytime'
  }
};

async function run() {
  try {
    const { rows } = await pool.query('SELECT id, email FROM users');
    
    for (const user of rows) {
      const profile = profiles[user.email] || {
        bio: 'Enthusiastic learner and developer.',
        experience_level: 'intermediate',
        location: 'Remote',
        availability: 'Anytime'
      };

      await pool.query(
        `UPDATE users 
         SET credit_balance = 50, 
             bio = $1, 
             experience_level = $2, 
             location = $3, 
             availability = $4,
             profile_completed = true
         WHERE id = $5`,
        [profile.bio, profile.experience_level, profile.location, profile.availability, user.id]
      );
    }
    console.log('All user profiles and credits have been updated successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
