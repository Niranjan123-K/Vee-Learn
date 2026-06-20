export const currentUser = {
  id: 'u1',
  name: 'Alex Rivera',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  credits: 3,
  inventory: {
    offer: ['CS-101 (Intro to Python)', 'Video Editing'],
    learn: ['MATH-201 (Calculus)', 'Spanish']
  }
};

export const searchResults = [
  {
    id: 'u2',
    name: 'Sarah Chen',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704e',
    rating: 4.9,
    reviews: 24,
    skillsOffered: ['MATH-201 (Calculus)', 'Physics 101'],
    skillsWanted: ['UI/UX Design', 'Video Editing'] // For Direct Swap logic
  },
  {
    id: 'u3',
    name: 'Marcus Johnson',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704f',
    rating: 4.7,
    reviews: 12,
    skillsOffered: ['MATH-201 (Calculus)'],
    skillsWanted: ['Intro to Python']
  }
];

export const activeSessions = [
  {
    id: 's1',
    partner: searchResults[0],
    skill: 'MATH-201 (Calculus)',
    status: 'ACCEPTED',
    type: 'CREDIT', // CREDIT, CHAIN, DIRECT
    time: 'Today, 4:00 PM',
    messages: [
      { senderId: 'u1', text: 'Hey Sarah! Looking forward to the session.', timestamp: '2:00 PM' },
      { senderId: 'u2', text: 'Me too! Let\'s meet at the campus library?', timestamp: '2:05 PM' },
    ]
  }
];

export const systemProposals = [
  {
    id: 'p1',
    type: 'CHAIN',
    description: "We found a 3-way match! Accept to join this cashless chain.",
    chain: "You need Sarah's Calculus → Sarah needs David's Spanish → David needs your Python."
  }
];

export const campusBounties = [
  {
    id: 'b1',
    title: 'Proofread my history essay',
    courseTag: 'HIST-101',
    reward: 0.5
  },
  {
    id: 'b2',
    title: 'Find bug in React component',
    courseTag: 'CS-301',
    reward: 1.0
  },
  {
    id: 'b3',
    title: 'Quick mock interview practice',
    courseTag: 'CAREER',
    reward: 0.5
  }
];
