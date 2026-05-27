"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface GiphyResult {
  id: string;
  title: string;
  images: {
    fixed_height_small: { url: string; width: string; height: string };
    original: { url: string };
  };
}

interface Props {
  onSelect: (gifUrl: string, title: string) => void;
  onClose: () => void;
  mode: "gif" | "sticker";
}

const API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

export default function GiphyPicker({ onSelect, onClose, mode }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GiphyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"trending" | "search">("trending");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchGifs = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const endpoint = mode === "sticker" ? "stickers" : "gifs";
      let url: string;
      if (searchQuery.trim()) {
        url = `https://api.giphy.com/v1/${endpoint}/search?api_key=${API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=24&rating=g`;
      } else {
        url = `https://api.giphy.com/v1/${endpoint}/trending?api_key=${API_KEY}&limit=24&rating=g`;
      }
      const res = await fetch(url);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchGifs("");
  }, [fetchGifs]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(query);
      setTab(query.trim() ? "search" : "trending");
    }, 400);
  }, [query, fetchGifs]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-16 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-40"
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setTab("trending"); setQuery(""); fetchGifs(""); }}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition ${tab === "trending" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Trending
          </button>
          <span className="text-xs font-bold text-gray-400 self-center uppercase">{mode === "sticker" ? "Stickers" : "GIFs"}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder={`Search ${mode === "sticker" ? "stickers" : "GIFs"}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
      </div>

      <div className="h-64 overflow-y-auto px-2 pb-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 w-8 h-8" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No results found
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {results.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.original.url, gif.title)}
                className="rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition focus:outline-none"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-20 object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 flex justify-end">
        <img src="https://developers.giphy.com/branch/master/static/header-logo-0fec0225d189bc0eae27dac3e3770582.gif" alt="Powered by GIPHY" className="h-4 opacity-60" />
      </div>
    </div>
  );
}
