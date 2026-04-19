-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  gender VARCHAR(10), -- 'male' or 'female' for benchmark matching
  climbing_type VARCHAR(20), -- 'bouldering' or 'sport_climbing'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_results table
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  score DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50), -- 'lbs', 'sec', 'reps', 'inches', 'bodyweight_ratio'
  test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_test_results_user_id ON test_results(user_id);
CREATE INDEX idx_test_results_test_date ON test_results(test_date);
CREATE INDEX idx_test_results_metric_name ON test_results(metric_name);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user information for the climbing tracker';
COMMENT ON TABLE test_results IS 'Stores individual test results for various climbing metrics';
COMMENT ON COLUMN users.gender IS 'Used to match against appropriate benchmark data (male/female)';
COMMENT ON COLUMN users.climbing_type IS 'Primary climbing discipline (bouldering or sport_climbing)';
COMMENT ON COLUMN test_results.metric_name IS 'Name of the metric being tested (e.g., Max_Hang_Str_Wt_20mm_10sec)';
COMMENT ON COLUMN test_results.score IS 'Numerical score for the test';
COMMENT ON COLUMN test_results.unit IS 'Unit of measurement for the score';
