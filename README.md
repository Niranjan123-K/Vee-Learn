# VeeLearn

### Peer-to-Peer Skill Sharing & Time-Banking Platform

VeeLearn is a full-stack platform where users can **learn and teach skills using a time-credit system instead of monetary payments**.

Users can discover teachers, book sessions, communicate in real time, exchange credits, and review their learning experience.

---

## 🚀 Features

* 🔐 JWT-based authentication
* 👤 User profiles and skill management
* 🔎 Skill and teacher discovery
* 📅 Session booking and scheduling
* 💳 Credit-based escrow and ledger system
* 💬 Real-time chat using WebSockets / Socket.IO
* 🔔 Real-time session notifications
* ⭐ Session reviews and ratings
* 📊 Learning and credit analytics
* 📅 Calendar integration support

---

## 🏗️ Architecture

```text
React + Vite
     │
     │ REST API / WebSocket
     ▼
Spring Boot
     │
     ├── Spring Security + JWT
     ├── JPA / Hibernate
     ├── Business Services
     └── WebSocket
     │
     ▼
PostgreSQL
```

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Router
* Zustand
* Axios
* Socket.IO Client
* Recharts
* Framer Motion

### Backend

* Java 21
* Spring Boot
* Spring Security
* JWT
* Spring Data JPA
* Hibernate
* Socket.IO
* Maven

### Database

* PostgreSQL
* Flyway

---

## 📁 Project Structure

```text
Vee-Learn/
│
├── client/              # React + Vite frontend
│
└── server-spring/       # Spring Boot backend
    └── src/
        └── main/
            ├── java/
            │   └── com/veelearn/api/
            │       ├── controller/
            │       ├── service/
            │       ├── repository/
            │       ├── entity/
            │       ├── dto/
            │       ├── security/
            │       └── websocket/
            │
            └── resources/
                └── db/migration/
```

---

## 🔄 Core Workflow

```text
Register
   ↓
Complete Profile
   ↓
Add Skills
   ↓
Explore Teachers
   ↓
Book Session
   ↓
Teacher Accepts
   ↓
Attend Session
   ↓
Credits Transferred
   ↓
Review
```

---

## 💳 Credit System

VeeLearn uses a time-based credit system.

```text
Book Session
     ↓
Credit Held
     ↓
Session Completed
     ↓
Credit Transferred
     ↓
Ledger Updated
```

This allows users to exchange their time and skills without direct monetary transactions.

---

## 🔐 Authentication

```text
Login
  ↓
JWT Generated
  ↓
JWT Sent with API Requests
  ↓
Spring Security
  ↓
Protected API
```

---

## ⚙️ Run Locally

### Backend

```bash
cd server-spring
mvn spring-boot:run
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Configure your PostgreSQL connection in:

```text
server-spring/src/main/resources/application.yml
```

---

## 👨‍💻 Author

**Niranjan K**

Computer Science & Engineering

GitHub: https://github.com/Niranjan123-K

