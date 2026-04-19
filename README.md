# Rock Climbing Tracker

A full-stack web application to track climbing performance metrics, visualize progress with radar charts, identify weaknesses, and get AI-powered training recommendations.

## Tech Stack

### Frontend
- **React** with **Vite** for fast development
- **Tailwind CSS** for styling
- **Recharts** for data visualization (radar charts)
- **Axios** for API calls

### Backend
- **Node.js** with **Express**
- **PostgreSQL** database
- **CORS** enabled for cross-origin requests
- **dotenv** for environment variables

## Project Structure

```
rock_climbing_test/
├── frontend/               # React frontend
│   ├── public/
│   │   └── *.webp         # Benchmark data images
│   ├── src/
│   │   ├── components/    # React components (you'll create these)
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env               # Frontend environment variables
│   └── package.json
│
├── backend/               # Express backend
│   ├── config/
│   │   └── db.js         # PostgreSQL connection pool
│   ├── data/
│   │   └── climbing-benchmarks.json  # Climbing benchmark data
│   ├── database/
│   │   ├── schema.sql    # Database schema
│   │   ├── seed.sql      # Seed data (demo user)
│   │   └── init.js       # Database initialization script
│   ├── routes/           # API routes (you'll create these)
│   ├── server.js         # Main server file
│   ├── .env              # Backend environment variables
│   └── package.json
│
└── README.md
```

## Prerequisites

Before you begin, make sure you have installed:
- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## Setup Instructions

### 1. Database Setup

First, create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE climbing_tracker;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done, but if needed)
npm install

# Configure environment variables
# Edit the .env file with your database credentials
# DB_USER=postgres
# DB_HOST=localhost
# DB_NAME=climbing_tracker
# DB_PASSWORD=your_password
# DB_PORT=5432

# Initialize database (create tables and seed data)
npm run db:init

# Start the development server
npm run dev
```

The backend server will start on `http://localhost:5000`

**Database Initialization:**
- `npm run db:init` creates the `users` and `test_results` tables
- Inserts a demo user (id=1, username='demo_user')
- Adds sample test results for the demo user (V5 level metrics)
- Use `npm run db:reset` to drop and recreate tables

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done, but if needed)
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite's default port)

## Development Workflow

### Phase 2: Database Schema ✅ COMPLETE
- ✅ Users table (with gender and climbing_type for benchmark matching)
- ✅ Test_results table (stores metric scores with units)
- ✅ Climbing benchmarks JSON (Male/Female, Bouldering/Sport Climbing)
- ✅ Demo user seeded (user_id = 1)
- ✅ Sample test results (V5 level metrics)

### Phase 3: Build API Routes (YOUR TURN!)
Create routes in `backend/routes/`:
- `POST /api/test-results` - Save new test results
- `GET /api/test-results/:userId` - Get user's test history
- `GET /api/latest-scores/:userId` - Get latest score per metric

### Phase 4: Build React Components
Create components in `frontend/src/components/`:
- `TestForm.jsx` - Input form for logging metrics
- `Dashboard.jsx` - Display radar chart and latest scores
- `HistoryView.jsx` - Timeline of past tests

### Phase 5: Implement Charts
Use Recharts to create:
- Radar charts for performance visualization
- Line charts for progress over time

### Phase 6: Add Weakness Detection
Implement algorithm to:
- Calculate average scores
- Identify metrics below average
- Rank weaknesses by severity

### Phase 7: AI Integration (Optional)
Add OpenAI API for:
- Personalized training recommendations
- Weakness analysis insights

## Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run db:init` - Initialize database (create tables and seed data)
- `npm run db:reset` - Reset database (drop and recreate tables)

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints (To Be Implemented)

```
GET    /api/health              # Health check
POST   /api/test-results        # Create new test result
GET    /api/test-results/:id    # Get test results by user
GET    /api/latest-scores/:id   # Get latest scores
DELETE /api/test-results/:id    # Delete test result
```

## Environment Variables

### Backend (.env)
```
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=climbing_tracker
DB_PASSWORD=your_password
DB_PORT=5432
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## Climbing Benchmark Data

The project includes comprehensive climbing benchmark data extracted from performance metrics research:

**Location:** `backend/data/climbing-benchmarks.json`

**Categories:**
- **Bouldering_Male** - V3 through V10
- **Bouldering_Female** - V3 through V10
- **Sport_Climbing_Male** - 5.11a/b through 5.13c/d
- **Sport_Climbing_Female** - 5.11a/b through 5.13c/d

**Metrics Tracked:**
1. **Finger Strength**
   - Max Hang Strength (20mm, 10sec) - bodyweight ratio
   - 7:3 Repeaters (20mm) - seconds
   - Continuous Hang Time (20mm) - seconds

2. **Upper Body Power**
   - Weighted Pull-Up (1RM) - bodyweight ratio
   - Campus Max Reach - inches
   - Max Pull-Ups - reps

3. **Campus Power** (Sport Climbing only)
   - Long Reach Foot-On Campus Time - seconds
   - Short Reach Foot-On Campus Time - seconds

4. **General Fitness**
   - Max Push-Ups - reps

Each metric includes `lower_bound` and `upper_bound` values for each grade level, allowing you to:
- Compare your scores against grade-specific benchmarks
- Identify which metrics are holding you back
- Set realistic training goals

**Example usage:**
```javascript
import benchmarks from './data/climbing-benchmarks.json';

// Get V5 male bouldering finger strength benchmarks
const v5Benchmarks = benchmarks.Bouldering_Male.Finger_Strength.Max_Hang_Str_Wt_20mm_10sec.V5;
// { lower_bound: 1.19, upper_bound: 1.44 }
```

## Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR UNIQUE)
- email (VARCHAR UNIQUE)
- gender ('male' or 'female') -- for benchmark matching
- climbing_type ('bouldering' or 'sport_climbing')
- created_at, updated_at (TIMESTAMP)
```

### Test Results Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (FK to users)
- metric_name (VARCHAR) -- matches benchmark JSON keys
- score (DECIMAL)
- unit (VARCHAR) -- 'bodyweight_ratio', 'sec', 'reps', 'inches'
- test_date (TIMESTAMP)
- notes (TEXT)
- created_at (TIMESTAMP)
```

**Design Notes:**
- Single demo user (id=1) for now - easy to add auth later
- Flexible metric_name allows any benchmark metric
- Indexes on user_id, test_date, and metric_name for fast queries

## Testing the Setup

1. Start the backend server: `cd backend && npm run dev`
2. Test the health endpoint: Visit `http://localhost:5000/api/health`
3. Start the frontend: `cd frontend && npm run dev`
4. Visit `http://localhost:5173` in your browser

## Next Steps

1. **Design your database schema** (Phase 2)
2. **Create database tables** with SQL migrations
3. **Build API routes** for CRUD operations (Phase 3)
4. **Create React components** for the UI (Phase 4)
5. **Integrate charts** with Recharts (Phase 5)
6. **Implement weakness detection** algorithm (Phase 6)
7. **Add AI features** (Phase 7)
8. **Deploy** to Railway/Vercel (Phase 8)

## Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Recharts Documentation](https://recharts.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## Notes

- Remember to create a `.gitignore` file to exclude `node_modules`, `.env`, and other sensitive files
- Always test your API endpoints before integrating with the frontend
- Use meaningful commit messages when using Git
- Ask AI for help with specific problems, not entire implementations
- Understand the code before moving forward

Good luck with your project!
