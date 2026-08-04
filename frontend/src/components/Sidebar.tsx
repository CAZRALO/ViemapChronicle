'use client';

import React, { useState, useEffect } from 'react';
import { fetchProvinceReport } from '@/lib/api';
import { ProvinceReport } from '@/types';
import { BookOpen, Landmark, GitCommit, FileText, ChevronRight, Video } from 'lucide-react';

interface SidebarProps {
  selectedArea: any;
  lang: 'vi' | 'en';
}

export default function Sidebar({ selectedArea, lang }: SidebarProps) {
  const [report, setReport] = useState<ProvinceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'sites' | 'changes'>('events');

  const provinceName = selectedArea?.province || 'Hà Nội';

  useEffect(() => {
    if (!provinceName) return;
    setLoading(true);
    fetchProvinceReport(provinceName, lang)
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setReport(null);
        setLoading(false);
      });
  }, [provinceName, lang]);

  return (
    <aside className="w-96 border-l border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-col h-full z-20 shrink-0">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-sky-400 font-semibold tracking-wider uppercase">
            {lang === 'vi' ? 'Thông tin địa phương' : 'Regional Details'}
          </span>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {provinceName}
          </h2>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'events'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sự kiện ({report?.events.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('sites')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'sites'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Địa danh ({report?.sites.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab('changes')}
          className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'changes'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Biến động</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Đang tải dữ liệu...</div>
        ) : (
          <>
            {activeTab === 'events' && (
              <div className="space-y-3">
                {report?.events && report.events.length > 0 ? (
                  report.events.map((evt, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2 hover:border-sky-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs text-sky-400 font-semibold">
                        <span>Năm {evt.year || 'N/A'}</span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm">{evt.title}</h4>
                      <p className="text-xs text-slate-300 line-clamp-3">{evt.description}</p>

                      {evt.videos && evt.videos.length > 0 && (
                        <div className="pt-2 border-t border-slate-700/40 flex items-center gap-1.5 text-xs text-amber-400">
                          <Video className="w-3.5 h-3.5" />
                          <a
                            href={evt.videos[0].url}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>Xem video tư liệu</span>
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs text-center py-8">
                    Không có sự kiện lịch sử ghi nhận
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sites' && (
              <div className="space-y-3">
                {report?.sites && report.sites.length > 0 ? (
                  report.sites.map((site, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2 hover:border-sky-500/40 transition-all"
                    >
                      <h4 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                        <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{site.name}</span>
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-3">{site.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs text-center py-8">
                    Không có thông tin địa danh
                  </div>
                )}
              </div>
            )}

            {activeTab === 'changes' && (
              <div className="space-y-3">
                {report?.admin_changes && report.admin_changes.length > 0 ? (
                  report.admin_changes.map((ch, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 space-y-2"
                    >
                      <div className="text-xs text-indigo-400 font-semibold">
                        Năm {ch.year || 'N/A'}
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm">{ch.title}</h4>
                      <p className="text-xs text-slate-300">{ch.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-xs text-center py-8">
                    Không có dữ liệu biến động hành chính
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
