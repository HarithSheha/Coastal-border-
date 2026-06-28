
/*
  # Restricted Area Admin Dashboard Schema

  1. New Tables
    - `zones` - Restricted zone definitions with geometry/metadata
    - `sensors` - IoT sensors placed in restricted zones
    - `reports` - Incident reports from mobile app or sensors
    - `sensor_readings` - Time-series data from sensors

  2. Security
    - RLS enabled on all tables
    - Authenticated users can read/write all data (admin dashboard context)
*/

-- ZONES table
CREATE TABLE IF NOT EXISTS zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'restricted',  -- restricted | danger | caution | checkpoint
  status text NOT NULL DEFAULT 'active',    -- active | inactive | breach
  color text NOT NULL DEFAULT '#ef4444',
  x_percent numeric NOT NULL DEFAULT 0,
  y_percent numeric NOT NULL DEFAULT 0,
  width_percent numeric NOT NULL DEFAULT 10,
  height_percent numeric NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read zones"
  ON zones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert zones"
  ON zones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update zones"
  ON zones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete zones"
  ON zones FOR DELETE TO authenticated USING (true);

-- SENSORS table
CREATE TABLE IF NOT EXISTS sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'motion',  -- motion | thermal | camera | vibration | gas | smoke
  status text NOT NULL DEFAULT 'online',  -- online | offline | alert | maintenance
  battery_level integer NOT NULL DEFAULT 100,
  last_ping timestamptz DEFAULT now(),
  x_percent numeric NOT NULL DEFAULT 50,
  y_percent numeric NOT NULL DEFAULT 50,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sensors"
  ON sensors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sensors"
  ON sensors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update sensors"
  ON sensors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sensors"
  ON sensors FOR DELETE TO authenticated USING (true);

-- REPORTS table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'intrusion',   -- intrusion | vandalism | suspicious | environmental | sensor_alert | other
  severity text NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
  status text NOT NULL DEFAULT 'open',      -- open | investigating | resolved | dismissed
  source text NOT NULL DEFAULT 'mobile',    -- mobile | sensor | manual
  zone_id uuid REFERENCES zones(id) ON DELETE SET NULL,
  sensor_id uuid REFERENCES sensors(id) ON DELETE SET NULL,
  reporter_name text DEFAULT 'Anonymous',
  reporter_contact text DEFAULT '',
  latitude numeric,
  longitude numeric,
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reports"
  ON reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert reports"
  ON reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update reports"
  ON reports FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reports"
  ON reports FOR DELETE TO authenticated USING (true);

-- SENSOR_READINGS table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id uuid NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  value numeric NOT NULL DEFAULT 0,
  unit text DEFAULT '',
  triggered boolean DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sensor readings"
  ON sensor_readings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sensor readings"
  ON sensor_readings FOR INSERT TO authenticated WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded_at ON sensor_readings(recorded_at DESC);

-- Seed data for zones
INSERT INTO zones (id, name, description, type, status, color, x_percent, y_percent, width_percent, height_percent) VALUES
  ('11111111-0000-0000-0000-000000000001', 'North Perimeter', 'Northern boundary fence line', 'restricted', 'active', '#ef4444', 5, 5, 90, 15),
  ('11111111-0000-0000-0000-000000000002', 'Server Room Alpha', 'Primary data center - no unauthorized access', 'danger', 'active', '#dc2626', 10, 30, 25, 20),
  ('11111111-0000-0000-0000-000000000003', 'Chemical Storage', 'Hazardous materials storage facility', 'danger', 'breach', '#b91c1c', 65, 30, 20, 20),
  ('11111111-0000-0000-0000-000000000004', 'Checkpoint Alpha', 'Main entry checkpoint', 'checkpoint', 'active', '#f59e0b', 40, 55, 15, 12),
  ('11111111-0000-0000-0000-000000000005', 'East Warehouse', 'Restricted storage warehouse', 'restricted', 'active', '#ef4444', 70, 55, 20, 25)
ON CONFLICT (id) DO NOTHING;

-- Seed sensors
INSERT INTO sensors (id, name, zone_id, type, status, battery_level, last_ping, x_percent, y_percent) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Motion Sensor N1', '11111111-0000-0000-0000-000000000001', 'motion', 'online', 87, now() - interval '2 minutes', 20, 10),
  ('22222222-0000-0000-0000-000000000002', 'Motion Sensor N2', '11111111-0000-0000-0000-000000000001', 'motion', 'alert', 65, now() - interval '1 minute', 75, 8),
  ('22222222-0000-0000-0000-000000000003', 'Thermal Cam SR1', '11111111-0000-0000-0000-000000000002', 'thermal', 'online', 100, now() - interval '30 seconds', 22, 38),
  ('22222222-0000-0000-0000-000000000004', 'Gas Detector CS1', '11111111-0000-0000-0000-000000000003', 'gas', 'alert', 43, now() - interval '5 minutes', 74, 38),
  ('22222222-0000-0000-0000-000000000005', 'Smoke Detector CS2', '11111111-0000-0000-0000-000000000003', 'smoke', 'online', 91, now() - interval '1 minute', 80, 45),
  ('22222222-0000-0000-0000-000000000006', 'Camera CP1', '11111111-0000-0000-0000-000000000004', 'camera', 'online', 100, now() - interval '10 seconds', 47, 60),
  ('22222222-0000-0000-0000-000000000007', 'Vibration EW1', '11111111-0000-0000-0000-000000000005', 'vibration', 'offline', 12, now() - interval '2 hours', 80, 65),
  ('22222222-0000-0000-0000-000000000008', 'Motion Sensor EW2', '11111111-0000-0000-0000-000000000005', 'motion', 'maintenance', 78, now() - interval '30 minutes', 85, 72)
ON CONFLICT (id) DO NOTHING;

-- Seed reports
INSERT INTO reports (id, title, description, type, severity, status, source, zone_id, sensor_id, reporter_name, created_at) VALUES
  ('33333333-0000-0000-0000-000000000001', 'Unauthorized Entry Detected', 'Motion sensor triggered at north perimeter fence. Unknown individual spotted near gate B.', 'intrusion', 'high', 'investigating', 'sensor', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'Sensor N2', now() - interval '15 minutes'),
  ('33333333-0000-0000-0000-000000000002', 'Gas Leak Alert - Chemical Storage', 'Elevated gas levels detected in chemical storage zone. Exceeds safe threshold by 40%.', 'environmental', 'critical', 'open', 'sensor', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000004', 'Gas Detector CS1', now() - interval '32 minutes'),
  ('33333333-0000-0000-0000-000000000003', 'Suspicious Activity Near Warehouse', 'Group of individuals observed loitering near east warehouse after hours.', 'suspicious', 'medium', 'open', 'mobile', '11111111-0000-0000-0000-000000000005', null, 'Security Guard B. Chen', now() - interval '1 hour'),
  ('33333333-0000-0000-0000-000000000004', 'Fence Damage Reported', 'Section of north perimeter fence found cut. Approximate 1m breach detected.', 'intrusion', 'high', 'open', 'mobile', '11111111-0000-0000-0000-000000000001', null, 'Patrol Officer T. Williams', now() - interval '2 hours'),
  ('33333333-0000-0000-0000-000000000005', 'Server Room Access Attempt', 'Failed badge scan on server room door - 3 attempts from unregistered card.', 'intrusion', 'critical', 'resolved', 'sensor', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003', 'Thermal Cam SR1', now() - interval '4 hours'),
  ('33333333-0000-0000-0000-000000000006', 'Vandalism at Checkpoint', 'Camera housing damaged at Checkpoint Alpha. Lens cracked, partial vision loss.', 'vandalism', 'medium', 'resolved', 'mobile', '11111111-0000-0000-0000-000000000004', null, 'Officer M. Rodriguez', now() - interval '6 hours'),
  ('33333333-0000-0000-0000-000000000007', 'Perimeter Sensor Offline', 'Vibration sensor EW1 stopped transmitting. Possible tampering or battery failure.', 'other', 'low', 'investigating', 'sensor', '11111111-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000007', 'System Monitor', now() - interval '2 hours'),
  ('33333333-0000-0000-0000-000000000008', 'Vehicle in Restricted Zone', 'Unregistered vehicle parked inside restricted compound since 22:00.', 'intrusion', 'medium', 'dismissed', 'mobile', null, null, 'Night Watchman D. Park', now() - interval '8 hours')
ON CONFLICT (id) DO NOTHING;

-- Seed some sensor readings
INSERT INTO sensor_readings (sensor_id, value, unit, triggered, recorded_at)
SELECT '22222222-0000-0000-0000-000000000004', 85 + (random() * 30)::integer, 'ppm', true, now() - (i || ' minutes')::interval
FROM generate_series(0, 30) AS i
ON CONFLICT DO NOTHING;

INSERT INTO sensor_readings (sensor_id, value, unit, triggered, recorded_at)
SELECT '22222222-0000-0000-0000-000000000001', (random() * 5)::integer, 'events/min', random() > 0.8, now() - (i || ' minutes')::interval
FROM generate_series(0, 60) AS i
ON CONFLICT DO NOTHING;
