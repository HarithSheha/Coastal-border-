export type ZoneType = 'restricted' | 'danger' | 'caution' | 'checkpoint';
export type ZoneStatus = 'active' | 'inactive' | 'breach';
export type SensorType = 'motion' | 'thermal' | 'camera' | 'vibration' | 'gas' | 'smoke';
export type SensorStatus = 'online' | 'offline' | 'alert' | 'maintenance';
export type ReportType = 'intrusion' | 'vandalism' | 'suspicious' | 'environmental' | 'sensor_alert' | 'other';
export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';
export type ReportSource = 'mobile' | 'sensor' | 'manual';

export interface Zone {
  id: string;
  name: string;
  description: string;
  type: ZoneType;
  status: ZoneStatus;
  color: string;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  created_at: string;
}

export interface Sensor {
  id: string;
  name: string;
  zone_id: string | null;
  type: SensorType;
  status: SensorStatus;
  battery_level: number;
  last_ping: string;
  x_percent: number;
  y_percent: number;
  metadata: Record<string, unknown>;
  created_at: string;
  zone?: Zone;
  zones?: Zone;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  severity: ReportSeverity;
  status: ReportStatus;
  source: ReportSource;
  zone_id: string | null;
  sensor_id: string | null;
  reporter_name: string;
  reporter_contact: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  created_at: string;
  updated_at: string;
  zones?: Zone;
  sensors?: Sensor;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value: number;
  unit: string;
  triggered: boolean;
  status: string;
  recorded_at: string;
  sensor?: Sensor;
}

export interface Urgency {
  urgency_id: number;
  urgency_level: string;
  created_at: string;
  updated_at: string;
}

export interface FieldReport {
  report_id: number;
  date: string;
  latitude: string;
  longitude: string;
  address: string;
  zone_id: string;
  color: string;
  number_of_people: number;
  description: string | null;
  photo: string | null;
  has_photo?: boolean;
  name: string;
  phone: string;
  urgency_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  zone?: Zone;
  urgency?: Urgency;
}

export interface Database {
  public: {
    Tables: {
      zones: { Row: Zone; Insert: Omit<Zone, 'id' | 'created_at'>; Update: Partial<Omit<Zone, 'id'>> };
      sensors: { Row: Sensor; Insert: Omit<Sensor, 'id' | 'created_at'>; Update: Partial<Omit<Sensor, 'id'>> };
      reports: { Row: Report; Insert: Omit<Report, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Report, 'id'>> };
      sensor_readings: { Row: SensorReading; Insert: Omit<SensorReading, 'id'>; Update: Partial<Omit<SensorReading, 'id'>> };
    };
  };
}
