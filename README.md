# Teacher Tracking System

A web application for managing teacher-student relationships, tracking student points, and facilitating a rewards system.

## Features

- **User Authentication and Authorization**
  - JWT authentication
  - Role-based access (Admin, Tutor, Student)
  - Secure password hashing
  - Registration request workflow

- **User Management**
  - Admin can manage all users
  - Tutors can be assigned to multiple students
  - User profiles with role-specific information
  - Registration approval system for new accounts

- **Event Management**
  - Tutors and Admin can create and share events
  - Events have specific dates and details

- **Points System**
  - Tutors can award points to students
  - Students can view their points balance

- **Leaderboard**
  - Display students ranked by points
  - Filter by tutor

- **Store for Points Redemption**
  - Students can request items using points
  - Tutors approve or reject requests

## Tech Stack

- **Frontend & Backend**: Next.js (App Router)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB instance

### Installation

1. Clone the repository:
   ```
   git clone https://your-repository-url.git
   cd ogrtakipnext
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_key
   ```

4. Seed the database with an admin user:
   ```
   npm run seed
   ```
   This creates an admin user with:
   - Username: admin
   - Password: admin123

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Roles and Permissions

### Admin
- Manage all users (create, update, delete)
- Create and view events
- View leaderboard
- Manage store items
- Approve or reject registration requests

### Tutor
- View assigned students
- Award points to students
- Create events
- Approve/reject student item requests

### Student
- View personal points balance
- View leaderboard
- Request items from the store using points
- View events

## Registration Workflow

The system includes a registration request workflow:

1. New users submit registration requests through the `/register` page
2. Requests include basic information and desired role (student/tutor)
3. All requests are initially marked as "pending"
4. Admin users can view pending requests at `/admin/registration-requests`
5. Admins can approve or reject registration requests
6. When approved, a new user account is created
7. When rejected, admin provides a reason which is stored with the request

This workflow ensures that only authorized users gain access to the system.

## API Endpoints

The application provides the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Registration
- `POST /api/register` - Submit registration request
- `GET /api/admin/registration-requests` - Get all registration requests (admin only)
- `POST /api/admin/registration-requests` - Process a registration request (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `POST /api/auth/register` - Create a user (admin only)
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user (admin only)
- `DELETE /api/users/:id` - Delete a user (admin only)

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create an event (admin or tutor)

### Points
- `GET /api/points` - Get points transactions
- `POST /api/points` - Award points (admin or tutor)

### Leaderboard
- `GET /api/leaderboard` - Get student rankings

### Store
- `GET /api/store` - Get store items
- `POST /api/store` - Create a store item (admin only)

### Requests
- `GET /api/requests` - Get item requests
- `POST /api/requests` - Create an item request (student only)
- `GET /api/requests/:id` - Get a specific request
- `PUT /api/requests/:id` - Update a request status (admin or tutor)

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [MongoDB](https://www.mongodb.com)
- [Mongoose](https://mongoosejs.com)
