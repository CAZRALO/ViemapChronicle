'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  MapPin,
  Database,
  Users,
  Eye,
  Calendar,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
  Search,
  Globe,
  Activity,
  Server,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface VisitItem {
  timestamp: string;
  ip: string;
}

interface IpDetail {
  ip: string;
  count: number;
  last_visit: string;
}

interface AdminStats {
  total_visits: number;
  today_visits: number;
  unique_visitors: number;
  unique_ips?: string[];
  ip_details?: IpDetail[];
  recent_visits: VisitItem[];
  daily_breakdown: Record<string, number>;
  db_connected: boolean;
}

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'all_ips' | 'recent_visits'>('all_ips');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to determine API Base URL safely
  const getApiUrl = (path: string) => {
    let baseUrl = '';
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.NEXT_PUBLIC_API_BASE_URL) {
        baseUrl = win.NEXT_PUBLIC_API_BASE_URL;
      } else if (win.location.port === '3000' || win.location.port === '3001') {
        baseUrl = `${win.location.protocol}//${win.location.hostname}:5050`;
      }
    }
    if (!path) return baseUrl;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return `${baseUrl}${path}`;
    return `${baseUrl}/${path}`;
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      const res = await fetch(getApiUrl(`/api/admin/stats?t=${Date.now()}`), {
        cache: 'no-store',
      });
      if (!res.ok) {
        if (res.status === 401) {
          setStatsError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
          localStorage.removeItem('admin_token');
          setToken(null);
        } else {
          setStatsError(`Lỗi tải dữ liệu (Mã ${res.status})`);
        }
        return;
      }
      const data: AdminStats = await res.json();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    } catch (err) {
      setStatsError('Không thể kết nối đến máy chủ API.');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      fetchStats();
    }
  }, [fetchStats]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    setLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch(getApiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token);
        setToken(data.token);
        setUsername('');
        setPassword('');
        fetchStats();
      } else {
        setLoginError(
          data.message ||
            (res.status === 404
              ? 'Không tìm thấy API đăng nhập (404).'
              : `Đăng nhập thất bại (Mã ${res.status}).`)
        );
      }
    } catch (err) {
      setLoginError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại backend API.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setStats(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      {/* Background Decorators */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                VIEMAP CHRONICLE
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold tracking-wider uppercase">
                Admin Portal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trang Quản Trị Hệ Thống & Thống Kê Truy Cập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>Quay lại Bản đồ</span>
          </Link>

          {token && (
            <>
              <button
                onClick={fetchStats}
                disabled={loadingStats}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-sm disabled:opacity-50"
                title="Làm mới thống kê"
              >
                <RefreshCw
                  className={`w-4 h-4 text-emerald-400 ${
                    loadingStats ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col">
        {!token ? (
          /* LOGIN FORM SCREEN */
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl pointer-events-none"></div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-500/25">
                  <ShieldCheck className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  Đăng nhập Admin
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập thông tin quản trị viên để tiếp tục
                </p>
              </div>

              {loginError && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loggingIn ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Đăng nhập trang quản trị</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ADMIN DASHBOARD SCREEN */
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">
                      Đang hoạt động với quyền Admin
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md font-semibold">
                      Authenticated
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Cập nhật gần nhất: {lastUpdated || 'Vừa xong'}</span>
                  </p>
                </div>
              </div>

              {stats && (
                <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800/80 text-xs">
                  <Database className="w-4 h-4 text-sky-400" />
                  {stats.db_connected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      MongoDB Atlas Connected (Realtime)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Chế độ File JSON Local (Cần cấu hình MONGO_URI)
                    </span>
                  )}
                </div>
              )}
            </div>

            {statsError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{statsError}</span>
              </div>
            )}

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Visits Card */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-bl-full pointer-events-none group-hover:bg-sky-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tổng lượt truy cập
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {stats
                    ? stats.total_visits.toLocaleString('vi-VN')
                    : '---'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Tích lũy từ khi khởi chạy hệ thống
                </p>
              </div>

              {/* Today Visits Card */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Truy cập hôm nay
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {stats
                    ? stats.today_visits.toLocaleString('vi-VN')
                    : '---'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Lượt xem trang trong ngày hôm nay
                </p>
              </div>

              {/* Unique Visitors Card */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Khách truy cập duy nhất
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {stats
                    ? stats.unique_visitors.toLocaleString('vi-VN')
                    : '---'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Địa chỉ IP phân biệt đã ghé thăm
                </p>
              </div>
            </div>

            {/* IP & Visits Section */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
                {/* Tab Controls */}
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                  <button
                    onClick={() => setActiveTab('all_ips')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'all_ips'
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Toàn bộ địa chỉ IP</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-900/60 text-slate-300 border border-slate-700/50">
                      {stats?.unique_ips?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('recent_visits')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'recent_visits'
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Nhật ký truy cập gần đây</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-900/60 text-slate-300 border border-slate-700/50">
                      {stats?.recent_visits?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm địa chỉ IP..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Tab Content: All IP Addresses */}
              {activeTab === 'all_ips' && (
                <div>
                  {(() => {
                    const allIpsDetails = stats?.ip_details || (stats?.unique_ips || []).map(ip => ({ ip, count: 1, last_visit: 'N/A' }));
                    const filtered = allIpsDetails.filter((item) =>
                      item.ip.toLowerCase().includes(searchTerm.toLowerCase().trim())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 text-sm italic">
                          {searchTerm ? `Không tìm thấy IP phù hợp với "${searchTerm}"` : 'Chưa có dữ liệu IP nào.'}
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                              <th className="pb-3 px-4">#</th>
                              <th className="pb-3 px-4">Địa chỉ IP</th>
                              <th className="pb-3 px-4">Lượt ghé thăm ghi nhận</th>
                              <th className="pb-3 px-4">Lần truy cập gần nhất</th>
                              <th className="pb-3 px-4 text-right">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {filtered.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-3.5 px-4 text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-sky-400 text-sm flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                                  <span>{item.ip}</span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-200 font-semibold">
                                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                                    {item.count > 0 ? `${item.count} lượt` : '1+ lượt'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-300">
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    {item.last_visit || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    Ghé thăm
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tab Content: Recent Visits Log */}
              {activeTab === 'recent_visits' && (
                <div>
                  {(() => {
                    const visits = stats?.recent_visits || [];
                    const filtered = visits.filter((item) =>
                      (item.ip || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-slate-500 text-sm italic">
                          {searchTerm ? `Không tìm thấy nhật ký phù hợp với "${searchTerm}"` : 'Chưa có nhật ký truy cập.'}
                        </div>
                      );
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                              <th className="pb-3 px-4">#</th>
                              <th className="pb-3 px-4">Thời gian</th>
                              <th className="pb-3 px-4">Địa chỉ IP</th>
                              <th className="pb-3 px-4 text-right">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono">
                            {filtered.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-800/40 transition-colors"
                              >
                                <td className="py-3 px-4 text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                                  {item.timestamp || 'N/A'}
                                </td>
                                <td className="py-3 px-4 font-semibold text-sky-400">
                                  {item.ip || 'Local / Hidden'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    Active
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/50 py-4 px-6 text-center text-xs text-slate-500">
        Viemap Chronicle Admin Portal &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
