'use client';

import React from 'react';
import { Search, MapPin, Calendar, Languages, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  lang: 'vi' | 'en';
  setLang: (lang: 'vi' | 'en') => void;
  years: number[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  onOpenSearch: () => void;
}

export default function Header({
  lang,
  setLang,
  years,
  selectedYear,
  setSelectedYear,
  onOpenSearch,
}: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-300 bg-clip-text text-transparent">
            VIEMAP CHRONICLE
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            {lang === 'vi' ? 'Bản đồ Lịch sử & Địa lý Việt Nam' : 'Vietnam History & Geography Map'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Trigger Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-slate-300 transition-all hover:text-white"
        >
          <Search className="w-4 h-4 text-sky-400" />
          <span>{lang === 'vi' ? 'Tìm kiếm sự kiện, địa danh...' : 'Search events, sites...'}</span>
          <kbd className="hidden md:inline-block bg-slate-700/50 text-[10px] px-1.5 py-0.5 rounded text-slate-400 border border-slate-600/50">
            Ctrl K
          </kbd>
        </button>

        {/* Timeline Year Selector */}
        {years.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-sm">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-slate-400">{lang === 'vi' ? 'Năm:' : 'Year:'}</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              {years.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-slate-200">
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
          className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <Languages className="w-4 h-4 text-sky-400" />
          <span className="uppercase">{lang}</span>
        </button>
      </div>
    </header>
  );
}
