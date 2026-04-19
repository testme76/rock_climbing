-- Insert demo user
INSERT INTO users (username, email, gender, climbing_type)
VALUES ('demo_user', 'demo@climbing-tracker.com', 'male', 'bouldering');

-- Insert sample test results for demo user (user_id = 1)
-- These are example V5 level bouldering metrics for a male climber

INSERT INTO test_results (user_id, metric_name, score, unit, notes) VALUES
  (1, 'Max_Hang_Str_Wt_20mm_10sec', 1.30, 'bodyweight_ratio', 'Felt strong today'),
  (1, 'Weighted_Pull_Up_Str_Wt_1RM', 1.50, 'bodyweight_ratio', NULL),
  (1, 'Campus_Max_Reach_inches', 29, 'inches', NULL),
  (1, 'Repeaters_7_3_Bodyweight_20mm_sec', 95, 'sec', 'Struggled on last set'),
  (1, 'Continuous_Hang_Time_20mm_sec', 38, 'sec', NULL),
  (1, 'Max_Pull_Ups_reps', 15, 'reps', NULL),
  (1, 'Max_Push_Ups_reps', 32, 'reps', NULL);

-- The data above represents a climber at approximately V5 level
-- Compare with benchmarks:
-- Max Hang: 1.30 (V5 range: 1.19-1.44) ✓
-- Weighted Pull-up: 1.50 (V5 range: 1.37-1.64) ✓
-- Campus Reach: 29 inches (V5 range: 27-32) ✓
-- Repeaters: 95 sec (V5 range: 52-141) ✓
-- Continuous Hang: 38 sec (V5 range: 23-51) ✓
-- Max Pull-ups: 15 reps (V5 range: 11-20) ✓
-- Max Push-ups: 32 reps (V5 range: 21-45) ✓
