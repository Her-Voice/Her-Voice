
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  LIVE_COMPANION = 'LIVE_COMPANION',
  INCIDENT_VAULT = 'INCIDENT_VAULT',
  WELLBEING_CHAT = 'WELLBEING_CHAT',
  GROUNDING = 'GROUNDING',
  SETTINGS = 'SETTINGS',
  MAP_HISTORY = 'MAP_HISTORY',
  FAKE_CALL = 'FAKE_CALL'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isGoogleLinked: boolean;
  isContactsSynced: boolean;
}

export interface LocationEntry {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface IncidentReport {
  id: string;
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  description: string;
  context: string;
  perpetratorInfo: string;
  status: 'Draft' | 'Finalized';
  audioData?: string; // Base64 encoded audio
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface CheckInSettings {
  enabled: boolean;
  intervalMinutes: number;
  lastCheckInTime: string;
}

export interface AppState {
  view: AppView;
  isDistressed: boolean;
  reports: IncidentReport[];
  contacts: EmergencyContact[];
  location: GeolocationPosition | null;
  locationHistory: LocationEntry[];
  checkIn: CheckInSettings;
  isAuthenticated: boolean;
  user: User | null;
}
