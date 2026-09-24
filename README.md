# 🚀 VeeLearn

### A Time-Banking Platform for Skill Sharing and Peer-to-Peer Learning

VeeLearn is a modern **skill-sharing and time-banking platform** that enables users to learn and teach skills through a **time-credit based exchange system**.

Instead of relying entirely on monetary payments, VeeLearn allows users to **earn time credits by teaching others and spend those credits to learn new skills**. The platform provides a structured ecosystem for discovering skills, connecting learners and mentors, managing learning sessions, exchanging time credits, and communicating in real time.

The goal of VeeLearn is to make skill development **accessible, collaborative, community-driven, and affordable**.

---

## 🎯 Problem Statement

Many people want to learn new skills but may not have the financial resources to access courses or personal mentoring. At the same time, individuals possess valuable knowledge and skills that they are willing to share.

Traditional learning platforms generally depend on monetary transactions, creating a barrier between people who want to teach and those who want to learn.

VeeLearn addresses this problem by introducing a **time-based skill exchange model**, where users can exchange their knowledge and time instead of directly paying money.

---

## 💡 Solution

VeeLearn creates a peer-to-peer learning ecosystem where:

* Users can offer skills they know.
* Users can discover skills they want to learn.
* Teaching a session allows users to earn **time credits**.
* Learning a session requires spending **time credits**.
* Users can exchange skills through structured sessions.
* Time credits can be reserved using an **escrow-based workflow**.
* Users can conduct online sessions using Google Meet links.
* Real-time communication is supported through Socket.io.
* Completed sessions can be rated and reviewed.

---

## ✨ Key Features

### 👤 User Authentication

* User registration and login
* JWT-based authentication
* Password hashing using bcrypt
* Cookie-based authentication handling
* Protected API routes

### 🧑‍🏫 Skill Sharing

* Add skills that you can teach
* Add skills that you want to learn
* Browse available skills
* Discover potential learning partners

### 🤝 Peer-to-Peer Skill Barter

VeeLearn enables users to exchange skills and knowledge using a **time-credit model** rather than direct monetary transactions.

For example:

```text
User A teaches Java for 2 hours
              ↓
       Earns 2 Time Credits
              ↓
User A spends 2 credits
              ↓
Learns React from User B
```

### ⏱️ Time Credit System

The platform uses time as the primary unit of exchange.

```text
1 Hour Teaching
       ↓
+1 Time Credit

1 Hour Learning
       ↓
-1 Time Credit
```

This creates a self-sustaining learning economy where users can earn credits by contributing their own knowledge.

### 💰 Escrow-Based Credit Flow

VeeLearn uses an escrow-style workflow to help protect both participants during a learning session.

```text
Session Request
      ↓
Session Confirmation
      ↓
Credits Reserved
      ↓
Learning Session
      ↓
Session Completed
      ↓
Credits Released
      ↓
Rating & Review
```

This prevents credits from being transferred prematurely before the session is completed.

### 📅 Session Management

Users can:

* Create learning sessions
* Accept or reject session requests
* Confirm sessions
* Manage session status
* Add meeting information
* Complete sessions
* Track session history

### 🎥 Google Meet Workflow

VeeLearn supports online learning sessions through Google Meet.

The current workflow allows participants to add a valid **Google Meet URL** to a confirmed session.

The platform validates the meeting link before storing it with the session.

### 💬 Real-Time Communication

**Socket.io** is used for real-time communication between users and the server.

This supports features such as:

* Real-time messaging
* Session updates
* Instant notifications
* Real-time interaction between users

### ⭐ Ratings & Reviews

After completing a learning session, users can provide ratings and reviews to help build trust within the community.

### 📊 Dashboard

Users can monitor:

* Available time credits
* Skills
* Learning activity
* Teaching activity
* Upcoming sessions
* Completed sessions
* Platform activity

---

# 🏗️ System Architecture

VeeLearn follows a **PERN Stack architecture** with Socket.io for real-time communication.

```text
                         VeeLearn
                            │
              ┌─────────────┴─────────────┐
              │                           │
       React 19 Client              Node.js Server
              │                           │
       ┌──────┼──────┐              ┌─────┼─────┐
       │      │      │              │     │     │
    Zustand Axios Socket.io     Express  Auth  APIs
       │      │      │              │     │
       │      │      └──────────────┤     │
       │      │                     │     │
       └──────┴─────────────────────┤     │
                                     │     │
                              PostgreSQL   │
                                     │     │
                              Google APIs
```

### Request Flow

```text
React Frontend
      │
      │ Axios
      ▼
Express.js
      │
      ▼
API Routes
      │
      ▼
Business Logic
      │
      ▼
PostgreSQL
```

### Real-Time Flow

```text
React Client
      │
      │ Socket.io
      ↕
Socket.io Server
      │
      ▼
Real-Time Events
```

---

# 🛠️ Tech Stack

## 🎨 Frontend — Client

| Technology           | Purpose                           |
| -------------------- | --------------------------------- |
| **React 19**         | Building the user interface       |
| **Vite**             | Development server and build tool |
| **React Router DOM** | Client-side routing               |
| **Zustand**          | Global state management           |
| **Axios**            | HTTP client for API requests      |
| **Socket.io Client** | Real-time communication           |
| **Framer Motion**    | Animations and transitions        |
| **Recharts**         | Data visualization                |
| **Lucide React**     | UI icons                          |
| **JavaScript / JSX** | Application development           |

## ⚙️ Backend — Server

| Technology        | Purpose                        |
| ----------------- | ------------------------------ |
| **Node.js**       | JavaScript runtime environment |
| **Express.js**    | Backend web framework          |
| **PostgreSQL**    | Relational database            |
| **pg**            | PostgreSQL database driver     |
| **Socket.io**     | Real-time communication        |
| **jsonwebtoken**  | JWT authentication             |
| **bcryptjs**      | Password hashing               |
| **cookie-parser** | Cookie handling                |
| **cors**          | Cross-Origin Resource Sharing  |
| **Multer**        | File uploads                   |
| **googleapis**    | Google API integration         |
| **Morgan**        | HTTP request logging           |
| **uuid**          | Unique ID generation           |
| **dotenv**        | Environment configuration      |

## 🗄️ Database

**PostgreSQL** is used as the primary relational database for storing:

* Users
* Skills
* Sessions
* Time credits
* Transactions
* Reviews
* Meeting information
* Other application data

---

# 📂 Project Structure

```text
VeeLearn/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
```

> Folder names may vary depending on the final project structure.

---

# 🔐 Authentication & Security

VeeLearn implements several security mechanisms:

* JWT-based authentication
* Password hashing with bcrypt
* Protected API endpoints
* Authentication middleware
* Cookie handling
* CORS configuration
* Environment variable management
* Request validation
* Secure password storage

Sensitive information such as database credentials and authentication secrets should be stored in environment variables rather than committed to GitHub.

---

# 🔄 VeeLearn Workflow

```text
                    User
                     │
                     ▼
              Create Account
                     │
                     ▼
             Add / Discover Skills
                     │
                     ▼
             Find Learning Partner
                     │
                     ▼
              Request Session
                     │
                     ▼
             Session Confirmation
                     │
                     ▼
             Reserve Time Credits
                     │
                     ▼
              Add Meeting Link
                     │
                     ▼
             Conduct Session
                     │
                     ▼
             Complete Session
                     │
                     ▼
             Release Credits
                     │
                     ▼
              Rating & Review
```

---

# ⚡ Real-Time Communication

VeeLearn uses **Socket.io** alongside the REST API architecture.

REST APIs handle standard operations such as:

```text
Authentication
Users
Skills
Sessions
Transactions
Reviews
```

Socket.io handles real-time events such as:

```text
Messages
Notifications
Session Updates
Real-Time Interactions
```

This combination allows VeeLearn to maintain a conventional REST architecture while providing real-time functionality where required.

---

# 🎥 Meeting System

VeeLearn provides an online session workflow using Google Meet.

```text
Session Created
      ↓
Session Confirmed
      ↓
Google Meet Link Added
      ↓
Meeting URL Validated
      ↓
Participants Join Session
      ↓
Session Completed
```

The current implementation uses a **manual Google Meet link workflow**.

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL
* Git

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd VeeLearn
```

---

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

---

## 3. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

DATABASE_URL=your_postgresql_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173
```

Add any additional environment variables required by your implementation.

**Do not commit your `.env` file to GitHub.**

---

# 🗄️ Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE veelearn;
```

Configure the database connection using the environment variables.

Then run the backend:

```bash
cd server
npm run dev
```

The backend will connect to PostgreSQL and start the API server.

---

# ▶️ Running the Application

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend will be available through the Vite development server.

---

# 🔌 API Overview

The backend provides REST APIs for major VeeLearn functionalities.

| Module         | Example Endpoint            | Method |
| -------------- | --------------------------- | ------ |
| Authentication | `/api/auth/register`        | POST   |
| Authentication | `/api/auth/login`           | POST   |
| Users          | `/api/users`                | GET    |
| Skills         | `/api/skills`               | GET    |
| Skills         | `/api/skills`               | POST   |
| Sessions       | `/api/sessions`             | GET    |
| Sessions       | `/api/sessions`             | POST   |
| Sessions       | `/api/sessions/:id`         | GET    |
| Sessions       | `/api/sessions/:id/confirm` | PUT    |
| Sessions       | `/api/sessions/:id/meeting` | PUT    |
| Reviews        | `/api/reviews`              | POST   |

> Update these endpoints according to the final routes implemented in the project.

---

# 🚀 Future Enhancements

Potential future improvements include:

* 🤖 AI-powered skill matching
* 🧠 Personalized learning recommendations
* 🎯 Intelligent mentor recommendations
* 📅 Automated Google Calendar integration
* 🏆 Gamification and achievement badges
* 📜 Skill verification and certification
* 📱 Dedicated mobile application
* 🛡️ Advanced fraud and abuse detection
* 👥 Community groups
* 💬 Advanced discussion forums
* 📈 Advanced learning analytics
* 🗺️ Personalized learning paths

---

# 📌 Project Highlights

VeeLearn demonstrates practical implementation of:

* Full-stack web development
* RESTful API architecture
* PERN stack development
* JWT authentication
* Password security
* PostgreSQL database design
* Real-time communication
* Socket.io
* Session management
* Time-credit economy
* Escrow-based transaction workflow
* Peer-to-peer skill exchange
* Google API integration
* File upload handling
* Responsive UI development

---

# 👨‍💻 Author

**Niranjan K**

Computer Science Engineering Student

Focus: Full-Stack Development · React · Node.js · Java · Spring Boot · AI

---

# 📄 License

This project is developed for **educational and academic purposes**.
