# Multi-User CRM System

A comprehensive Client Lead Management System built with React, Node.js, Express, and MongoDB. Features multi-user authentication, role-based access control, lead tracking, search/filter functionality, and real-time updates.

## Features

- **Multi-User Authentication**: User registration and login with JWT tokens
- **Role-Based Access Control**: Admin and User roles with different permissions
- **Lead Management**: Create, read, update, delete leads with full CRUD operations
- **Search & Filter**: Search leads by name, email, phone; filter by status and source
- **Real-Time Updates**: Live updates using Socket.io for collaborative work
- **Lead Tracking**: Track lead status (new, contacted, converted) and add notes
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Pagination**: Efficient handling of large lead lists
- **Data Security**: Proper authentication and authorization

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Socket.io for real-time updates
- CORS enabled

### Frontend
- React 18
- Axios for API calls
- Socket.io-client for real-time features
- Modern CSS with responsive design

## Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory:
   ```
   MONGO_URI=mongodb://localhost:27017/crm
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React app:
   ```bash
   npm start
   ```

### Database

Make sure MongoDB is running locally on port 27017, or update MONGO_URI to point to your MongoDB Atlas cluster.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile

### Leads (Protected Routes)
- `GET /api/leads` - Get leads (with search/filter/pagination)
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get single lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/notes` - Add note to lead

## User Roles

### Admin
- View all leads across the system
- Manage any lead (create, edit, delete)
- Full access to all features

### User
- View only their own leads
- Manage only their own leads
- Cannot access other users' data

## Testing

Run backend tests:
```bash
cd backend
npm test
```

## Features Overview

### Authentication
- Secure user registration and login
- JWT-based session management
- Password hashing with bcrypt

### Lead Management
- Create leads with contact information
- Track lead status through the sales funnel
- Add detailed notes and follow-ups
- Edit lead information
- Delete leads (with confirmation)

### Search & Filter
- Real-time search by name, email, or phone
- Filter by lead status (new, contacted, converted)
- Filter by lead source (website, referral, etc.)

### Real-Time Updates
- Live synchronization across multiple users
- Instant updates when leads are modified
- Collaborative work environment

### Responsive Design
- Works seamlessly on desktop, tablet, and mobile
- Modern, clean interface
- Intuitive user experience

## Development

### Project Structure
```
crm/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Lead.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── leads.js
│   ├── middleware/
│   │   └── auth.js
│   ├── config/
│   │   └── db.js
│   ├── tests/
│   │   └── auth.test.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── LeadList.js
│   │   │   ├── LeadDetail.js
│   │   │   └── AddLead.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.