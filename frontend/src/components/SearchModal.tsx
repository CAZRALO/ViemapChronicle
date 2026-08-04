'use client';

import React, { useState, useEffect } from 'react';
import { searchInternalData } from '@/lib/api';
import { SearchResult } from '@/types';
import { Search, X, BookOpen, Landmark, ExternalLink, Loader2 } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'vi' | 'en';
}

export default function SearchModal({ isOpen, onClose, lang }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchInternalData(query, lang);
        setResults(res.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, lang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-sky-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên trận đánh, di tích, sáp nhập xã (ví dụ: Điện Biên Phủ, Tây Hồ)..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {results.length > 0 ? (
            results.map((res, idx) => (
              <div
                key={idx}
                className="bg-slate-800/50 border border-slate-700/50 hover:border-sky-500/50 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
                  <span className="font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                    {res.kind_label}
                  </span>
                  {res.year && <span>Năm {res.year}</span>}
                </div>
                <h4 className="font-bold text-slate-100 text-sm mb-1">{res.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-2">{res.excerpt}</p>
              </div>
            ))
          ) : query.trim() && !loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Không tìm thấy kết quả phù hợp cho "{query}"
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Gõ từ khóa để bắt đầu tìm kiếm RAG trong cơ sở dữ liệu Viemap
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
