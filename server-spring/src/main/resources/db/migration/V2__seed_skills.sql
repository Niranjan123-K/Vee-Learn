-- =============================================================
-- Vee Learn — Seed Data (Skill Catalogue)
-- =============================================================
-- Uses ON CONFLICT to make the seed idempotent.

-- Programming
INSERT INTO skills (name, category) VALUES
  ('JavaScript',  'Programming'),
  ('Python',      'Programming'),
  ('Java',        'Programming'),
  ('React',       'Programming'),
  ('Node.js',     'Programming'),
  ('SQL',         'Programming'),
  ('TypeScript',  'Programming'),
  ('C++',         'Programming'),
  ('Go',          'Programming'),
  ('Rust',        'Programming')
ON CONFLICT (name) DO NOTHING;

-- Languages
INSERT INTO skills (name, category) VALUES
  ('Spanish',    'Languages'),
  ('French',     'Languages'),
  ('German',     'Languages'),
  ('Mandarin',   'Languages'),
  ('Japanese',   'Languages'),
  ('Korean',     'Languages'),
  ('Arabic',     'Languages'),
  ('Hindi',      'Languages'),
  ('Portuguese', 'Languages'),
  ('Italian',    'Languages')
ON CONFLICT (name) DO NOTHING;

-- Music
INSERT INTO skills (name, category) VALUES
  ('Guitar',       'Music'),
  ('Piano',        'Music'),
  ('Violin',       'Music'),
  ('Drums',        'Music'),
  ('Singing',      'Music'),
  ('Music Theory', 'Music'),
  ('DJ',           'Music')
ON CONFLICT (name) DO NOTHING;

-- Design
INSERT INTO skills (name, category) VALUES
  ('UI/UX Design',     'Design'),
  ('Graphic Design',   'Design'),
  ('Figma',            'Design'),
  ('Adobe Photoshop',  'Design'),
  ('3D Modeling',      'Design')
ON CONFLICT (name) DO NOTHING;

-- Business
INSERT INTO skills (name, category) VALUES
  ('Marketing',          'Business'),
  ('Finance',            'Business'),
  ('Accounting',         'Business'),
  ('Public Speaking',    'Business'),
  ('Project Management', 'Business')
ON CONFLICT (name) DO NOTHING;

-- Academics
INSERT INTO skills (name, category) VALUES
  ('Mathematics', 'Academics'),
  ('Physics',     'Academics'),
  ('Chemistry',   'Academics'),
  ('Biology',     'Academics'),
  ('Statistics',  'Academics'),
  ('History',     'Academics')
ON CONFLICT (name) DO NOTHING;

-- Lifestyle
INSERT INTO skills (name, category) VALUES
  ('Cooking',           'Lifestyle'),
  ('Photography',       'Lifestyle'),
  ('Yoga',              'Lifestyle'),
  ('Fitness Training',  'Lifestyle'),
  ('Meditation',        'Lifestyle')
ON CONFLICT (name) DO NOTHING;
