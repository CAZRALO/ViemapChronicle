export interface MapConfigFile {
  year: number;
  file: string;
  format: 'geojson' | 'topojson';
}

export interface MapConfigResponse {
  years: number[];
  files: {
    province: MapConfigFile[];
    district: MapConfigFile[];
    ward: MapConfigFile[];
  };
}

export interface HistoryEvent {
  id?: string;
  title: string;
  year?: number;
  description: string;
  content?: string;
  videos?: Array<{ title: string; url: string }>;
  source?: {
    label: string;
    url: string;
    confidence?: string;
    updated_at?: string;
  };
}

export interface GeoSite {
  name: string;
  category?: string;
  description: string;
  location?: string;
  videos?: Array<{ title: string; url: string }>;
  source?: {
    label: string;
    url: string;
  };
}

export interface AdminChange {
  year?: number;
  title: string;
  description?: string;
  changes?: string[];
  source?: {
    label: string;
    url: string;
  };
}

export interface ProvinceReport {
  province: string;
  generated_at: string;
  events: HistoryEvent[];
  sites: GeoSite[];
  admin_changes: AdminChange[];
  sources: Array<{ label: string; url: string }>;
}

export interface SearchResult {
  title: string;
  kind: string;
  kind_label: string;
  province?: string;
  district?: string;
  commune?: string;
  year?: number;
  url?: string;
  score: number;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  sources?: Array<{ label: string; url: string }>;
}

export interface MapSelectionContext {
  province?: string;
  district?: string;
  ward?: string;
  year?: number;
  level?: 'province' | 'district' | 'ward';
  interaction?: 'click' | 'hover';
}
