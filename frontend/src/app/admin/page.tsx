'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  LogOut,
  RefreshCw,
  Database,
  Users,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
  Search,
  Globe,
  Activity,
  Clock,
  CheckCircle2,
  Download,
  Trash2,
  BarChart3,
  X,
  Server,
  Sparkles
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
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'all_ips' | 'recent_visits' | 'daily_chart'>('all_ips');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'count_desc' | 'time_desc'>('count_desc');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Ensure body and html can scroll properly when visiting the Admin page
  useEffect(() => {
    document.documentElement.classList.add('admin-html');
    document.body.classList.add('admin-body');
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
    document.body.style.height = 'auto';

    return () => {
      document.documentElement.classList.remove('admin-html');
      document.body.classList.remove('admin-body');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.height = '';
    };
  }, []);

  // Helper to determine API Base URL safely
  const getApiUrl = (path: string) => {
    let baseUrl = '';
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      } else if (win.NEXT_PUBLIC_API_BASE_URL) {
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
      setStatsError('Không thể kết nối đến máy chủ API backend (cổng 5050).');
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
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
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
              : 'Tên đăng nhập hoặc mật khẩu không chính xác.')
        );
      }
    } catch (err) {
      setLoginError('Lỗi kết nối máy chủ. Vui lòng kiểm tra backend Python (app.py).');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setStats(null);
    setStatsError(null);
  };

  const handleResetStats = async () => {
    setResetting(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/reset-stats'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setShowResetConfirm(false);
        setActionNotice('Đã đặt lại toàn bộ thống kê thành công!');
        setTimeout(() => setActionNotice(null), 3500);
        fetchStats();
      } else {
        alert('Không thể đặt lại thống kê.');
      }
    } catch (e) {
      alert('Lỗi kết nối khi đặt lại thống kê.');
    } finally {
      setResetting(false);
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    if (!stats) return;
    let content = '';
    let mimeType = 'text/plain';
    let filename = `viemap_analytics_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      content = JSON.stringify(stats, null, 2);
      mimeType = 'application/json';
      filename += '.json';
    } else {
      mimeType = 'text/csv;charset=utf-8;';
      filename += '.csv';
      const lines = [
        'IP,Luot_Ghe_Tham,Lan_Cuoi_Truy_Cap',
        ...(stats.ip_details || []).map(
          (d) => `"${d.ip}",${d.count},"${d.last_visit}"`
        ),
      ];
      content = '\uFEFF' + lines.join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered & Sorted IP details
  const processedIps = useMemo(() => {
    const allIpsDetails =
      stats?.ip_details ||
      (stats?.unique_ips || []).map((ip) => ({
        ip,
        count: 1,
        last_visit: 'N/A',
      }));

    let list = allIpsDetails.filter((item) =>
      item.ip.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

    if (sortBy === 'count_desc') {
      list.sort((a, b) => b.count - a.count || b.last_visit.localeCompare(a.last_visit));
    } else {
      list.sort((a, b) => b.last_visit.localeCompare(a.last_visit) || b.count - a.count);
    }

    return list;
  }, [stats, searchTerm, sortBy]);

  // Filtered Visits
  const processedVisits = useMemo(() => {
    const visits = stats?.recent_visits || [];
    return visits.filter(
      (item) =>
        (item.ip || '').toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (item.timestamp || '').toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
  }, [stats, searchTerm]);

  // Daily breakdown sorted
  const dailyEntries = useMemo(() => {
    if (!stats?.daily_breakdown) return [];
    return Object.entries(stats.daily_breakdown).sort((a, b) =>
      b[0].localeCompare(a[0])
    );
  }, [stats]);

  const maxDailyVisits = useMemo(() => {
    if (dailyEntries.length === 0) return 1;
    return Math.max(...dailyEntries.map(([, count]) => count), 1);
  }, [dailyEntries]);

  return (
    <div className="admin-page-root min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white relative overflow-y-auto overflow-x-hidden">
      {/* Background Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xl sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                VIEMAP CHRONICLE
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-wider uppercase hidden xs:inline-block">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Trang Quản Trị Hệ Thống & Thống Kê Truy Cập
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Quay lại Bản đồ</span>
            <span className="sm:hidden">Bản đồ</span>
          </Link>

          {token && (
            <>
              <button
                onClick={fetchStats}
                disabled={loadingStats}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/60 text-slate-300 hover:text-white transition-all shadow-sm disabled:opacity-50"
                title="Làm mới thống kê"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-400 ${
                    loadingStats ? 'animate-spin' : ''
                  }`}
                />
                <span className="hidden md:inline">Làm mới</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all shadow-sm"
                title="Đăng xuất"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="relative z-20 mx-auto mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2 shadow-lg animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto flex flex-col pb-12">
        {!token ? (
          /* ========================================================================= */
          /* 1. LOGIN SCREEN                                                           */
          /* ========================================================================= */
          <div className="flex-1 flex items-center justify-center py-8 sm:py-16">
            <div className="w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25">
                  <ShieldCheck className="w-9 h-9 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-100">
                  Đăng nhập Admin
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập thông tin quản trị viên để xem thống kê
                </p>
              </div>

              {loginError && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên đăng nhập
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Tài khoản mặc định: <strong>admin</strong> /{' '}
                    <strong>admin123</strong> (Cấu hình qua biến môi trường{' '}
                    <code className="text-emerald-300">ADMIN_USERNAME</code> /{' '}
                    <code className="text-emerald-300">ADMIN_PASSWORD</code>).
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
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
          /* ========================================================================= */
          /* 2. ADMIN DASHBOARD SCREEN                                                 */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50 shrink-0"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-200">
                      Đang hoạt động với quyền Admin
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md font-semibold">
                      Online
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Cập nhật gần nhất: {lastUpdated || 'Vừa xong'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {stats && (
                  <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <Database className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    {stats.db_connected ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        MongoDB Atlas Connected
                      </span>
                    ) : (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Lưu trữ JSON Local (Sẵn sàng)
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => exportData('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700/60 text-xs font-semibold transition-all shadow-sm"
                  title="Tải xuống báo cáo CSV"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Xuất CSV</span>
                </button>

                <button
                  onClick={() => exportData('json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700/60 text-xs font-semibold transition-all shadow-sm"
                  title="Tải xuống dữ liệu JSON"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Xuất JSON</span>
                </button>

                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
                  title="Đặt lại toàn bộ thống kê"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {statsError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{statsError}</span>
              </div>
            )}

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Visits Card */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Tổng lượt truy cập
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {stats ? stats.total_visits.toLocaleString('vi-VN') : '---'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Tích lũy từ khi khởi chạy hệ thống
                </p>
              </div>

              {/* Today Visits Card */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
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
                  {stats ? stats.today_visits.toLocaleString('vi-VN') : '---'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Lượt xem trong ngày hôm nay
                </p>
              </div>

              {/* Unique Visitors Card */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-bl-full pointer-events-none group-hover:bg-sky-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Khách duy nhất (IP)
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">
                  {stats ? stats.unique_visitors.toLocaleString('vi-VN') : '---'}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Địa chỉ IP phân biệt đã ghé thăm
                </p>
              </div>

              {/* System Engine Status Card */}
              <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full pointer-events-none group-hover:bg-teal-500/20 transition-all"></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Hệ thống & AI
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Server className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-xl font-extrabold text-emerald-400 tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Active / Ready</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Flask Port 5050 &bull; Gemini RAG Engine
                </p>
              </div>
            </div>

            {/* Analytics Tab Section */}
            <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
                {/* Tab Controls */}
                <div className="flex items-center flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('all_ips')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'all_ips'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Địa chỉ IP</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-slate-300 border border-slate-700/50">
                      {stats?.unique_ips?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('recent_visits')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'recent_visits'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Nhật ký gần đây</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-slate-300 border border-slate-700/50">
                      {stats?.recent_visits?.length || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('daily_chart')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'daily_chart'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Theo ngày</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900/80 text-slate-300 border border-slate-700/50">
                      {dailyEntries.length}
                    </span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {activeTab === 'all_ips' && (
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="count_desc">Nhiều lượt nhất</option>
                      <option value="time_desc">Mới truy cập nhất</option>
                    </select>
                  )}

                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm IP hoặc ngày..."
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab 1: All IP Addresses */}
              {activeTab === 'all_ips' && (
                <div>
                  {processedIps.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs italic">
                      {searchTerm
                        ? `Không tìm thấy IP phù hợp với "${searchTerm}"`
                        : 'Chưa có dữ liệu IP nào.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                            <th className="pb-3 px-4">#</th>
                            <th className="pb-3 px-4">Địa chỉ IP</th>
                            <th className="pb-3 px-4">Lượt ghé thăm</th>
                            <th className="pb-3 px-4">Lần truy cập gần nhất</th>
                            <th className="pb-3 px-4 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {processedIps.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3 px-4 text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-400 text-sm flex items-center gap-2">
                                <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>{item.ip}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-200 font-semibold">
                                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                                  {item.count > 0 ? `${item.count} lượt` : '1+ lượt'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  {item.last_visit || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  Recorded
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Recent Visits Log */}
              {activeTab === 'recent_visits' && (
                <div>
                  {processedVisits.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs italic">
                      {searchTerm
                        ? `Không tìm thấy nhật ký phù hợp với "${searchTerm}"`
                        : 'Chưa có nhật ký truy cập.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                            <th className="pb-3 px-4">#</th>
                            <th className="pb-3 px-4">Thời gian</th>
                            <th className="pb-3 px-4">Địa chỉ IP</th>
                            <th className="pb-3 px-4 text-right">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {processedVisits.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3 px-4 text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-3 px-4 text-slate-300 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                {item.timestamp || 'N/A'}
                              </td>
                              <td className="py-3 px-4 font-semibold text-emerald-400">
                                {item.ip || 'Local / Client'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  Logged
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Daily Breakdown */}
              {activeTab === 'daily_chart' && (
                <div className="space-y-4">
                  {dailyEntries.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs italic">
                      Chưa có dữ liệu theo ngày.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dailyEntries.map(([dateStr, count], idx) => {
                        const pct = Math.round((count / maxDailyVisits) * 100);
                        return (
                          <div
                            key={idx}
                            className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-3 sm:w-48 shrink-0">
                              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-mono text-xs font-semibold text-slate-200">
                                {dateStr}
                              </span>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              <div className="flex-1 bg-slate-800/60 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(pct, 4)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-emerald-300 font-mono w-20 text-right shrink-0">
                                {count} lượt
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-100">
                Xác nhận đặt lại thống kê?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Toàn bộ dữ liệu tổng lượt truy cập, IP và nhật ký sẽ được đưa về 0. Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetStats}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {resetting ? 'Đang xóa...' : 'Xóa thống kê'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        Viemap Chronicle Admin Portal &copy; 2026. Tất cả các quyền được bảo lưu.
      </footer>
    </div>
  );
}
