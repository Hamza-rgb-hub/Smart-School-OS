~# 🎓 Smart School OS

A production-ready, multi-tenant SaaS platform for school management built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js).

---

## ✨ Features

### 👑 Super Admin
- Platform-wide analytics dashboard (schools, students, teachers)
- Approve / reject / suspend / delete schools
- Global user management with activate/deactivate toggle
- Monthly registration trend charts & status distribution

### 🏫 School Admin
- Role-isolated dashboard with live stats
- **Students** — Full CRUD, profile image upload, class assignment
- **Teachers** — Full CRUD, subject management
- **Classes** — Create/manage classes with capacity tracking
- **Attendance** — Daily attendance with Present / Absent / Late / Excused tracking
- **Fees** — Fee structures + payment tracking with summary charts
- **Report Cards** — Subject-wise marks, auto grade calculation, publish flow

### 🔐 Auth & Security
- JWT authentication with expiry
- bcrypt password hashing (cost 12)
- Role-based access control (super_admin / school_admin)
- Strict multi-tenant data isolation — each school can only see its own data
- Rate limiting (100 req/15min general, 20/15min auth)
- Helmet security headers

### 🎨 Frontend
- React 18 with Tailwind CSS
- **Dark / Light mode** (persisted in localStorage)
- Fully responsive (mobile, tablet, desktop)
- Sidebar layout with active link highlighting
- Recharts for data visualisation
- Toast notifications, loading states, empty states
- Pagination, search, and filter on all list pages

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <repo-url>
cd smart-school-os

# Server
cd server
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET

# Client
cd ../client
npm install
```

### 3. Start

```bash
# Terminal 1 — Server (port 5000)
cd server && npm run dev

# Terminal 2 — Client (port 3000)
cd client && npm start
```
---

## 🐳 Docker (Recommended for Production)

```bash
# From project root
docker-compose up --build
```



---

## 📁 Project Structure

```
smart-school-os/
├── server/
│   ├── config/         # DB connection
│   ├── controllers/    # Business logic
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── classController.js
│   │   ├── dashboardController.js
│   │   ├── feeController.js
│   │   ├── attendanceController.js
│   │   ├── reportController.js
│   │   └── superAdminController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT + RBAC + school isolation
│   │   ├── upload.js        # Multer
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── models/
│   │   ├── User.js
│   │   ├── School.js
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Class.js
│   │   ├── Fee.js           # FeeStructure + FeePayment
│   │   ├── Attendance.js
│   │   └── ReportCard.js
│   ├── routes/             # All route files
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── paginate.js
│   │   └── seeder.js
│   ├── uploads/            # File storage (auto-created)
│   ├── .env.example
│   ├── Dockerfile
│   └── index.js
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/     # LoadingSpinner, Modal, Pagination, etc.
│   │   │   └── layout/     # DashboardLayout, AuthLayout
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── auth/       # LoginPage, RegisterPage
│   │   │   ├── schooladmin/ # Dashboard, Students, Teachers, Classes, Attendance, Fees, Reports, SchoolProfile
│   │   │   └── superadmin/  # Dashboard, Schools, Users
│   │   ├── services/       # api.js (axios instance)
│   │   ├── App.js
│   │   └── index.css
│   ├── public/
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
│
└── docker-compose.yml
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |
| PUT | `/api/auth/profile` | Private |
| PUT | `/api/auth/change-password` | Private |

### School Admin APIs
| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/students` |
| GET/PUT/DELETE | `/api/students/:id` |
| GET/POST | `/api/teachers` |
| GET/PUT/DELETE | `/api/teachers/:id` |
| GET/POST | `/api/classes` |
| GET/PUT/DELETE | `/api/classes/:id` |
| GET | `/api/dashboard/school` |
| POST | `/api/attendance/mark` |
| GET | `/api/attendance/class/:classId` |
| GET/POST | `/api/fees/payments` |
| GET/POST | `/api/fees/structures` |
| GET/POST | `/api/reports` |
| GET/PUT | `/api/schools/me` |

### Super Admin APIs
| Method | Endpoint |
|--------|----------|
| GET | `/api/super-admin/analytics` |
| GET | `/api/super-admin/schools` |
| PUT | `/api/super-admin/schools/:id/approve` |
| PUT | `/api/super-admin/schools/:id/reject` |
| PUT | `/api/super-admin/schools/:id/suspend` |
| DELETE | `/api/super-admin/schools/:id` |
| GET | `/api/super-admin/users` |
| PUT | `/api/super-admin/users/:id/toggle` |

---

## 🔒 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-school-os
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
MAX_FILE_SIZE=5242880
CLIENT_URL=http://localhost:3000
```

---

## 🗺️ School Registration Flow

```
Register → pending → [Super Admin reviews] → approved / rejected
                                  ↓
                             approved → School Admin can log in
                                  ↓
                             suspend → login blocked
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts, React Router v6 |
| State | Context API, React Hook Form |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| Security | Helmet, express-rate-limit |
| Deployment | Docker, Nginx |

---

