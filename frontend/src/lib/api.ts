import { MapConfigResponse, ProvinceReport, SearchResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';

export async function fetchMapConfig(lang: string = 'vi'): Promise<MapConfigResponse> {
  const res = await fetch(`${API_BASE_URL}/api/config?lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch map configuration');
  return res.json();
}

export async function fetchMapGeoJson(filename: string) {
  const res = await fetch(`${API_BASE_URL}/api/map/${filename}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch map file ${filename}`);
  return res.json();
}

export async function fetchHistoryData(filename: string, lang: string = 'vi') {
  const res = await fetch(`${API_BASE_URL}/api/history/${filename}?lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch history file ${filename}`);
  return res.json();
}

export async function fetchGeoData(filename: string, lang: string = 'vi') {
  const res = await fetch(`${API_BASE_URL}/api/geodata/${filename}?lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch geodata file ${filename}`);
  return res.json();
}

export async function fetchProvinceReport(name: string, lang: string = 'vi'): Promise<ProvinceReport> {
  const res = await fetch(`${API_BASE_URL}/api/report/province?name=${encodeURIComponent(name)}&lang=${lang}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch province report for ${name}`);
  return res.json();
}

export async function searchInternalData(query: string, lang: string = 'vi', limit: number = 12): Promise<{ query: string; results: SearchResult[] }> {
  const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&lang=${lang}&limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function sendChatMessage(payload: {
  message: string;
  session_id: string;
  map_context?: any;
  lang?: string;
  reset?: boolean;
}) {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Chat API call failed');
  return res.json();
}
