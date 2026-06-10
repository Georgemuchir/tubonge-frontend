import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ExternalLink, Heart, Share2, Bookmark, ArrowLeft, Rss } from 'lucide-react';
import { getInterests, saveInterests, getFeed, trackInteraction } from '../services/newsService';

const ALL_INTERESTS = [
  { id: 'tech',          label: 'Technology',   icon: '🚀', color: '#3b82f6' },
  { id: 'business',      label: 'Business',     icon: '💼', color: '#059669' },
  { id: 'sports',        label: 'Sports',       icon: '⚽', color: '#dc2626' },
  { id: 'fashion',       label: 'Fashion',      icon: '👗', color: '#8b5cf6' },
  { id: 'politics',      label: 'Politics',     icon: '🏛️', color: '#374151' },
  { id: 'innovation',    label: 'Innovation',   icon: '💡', color: '#f59e0b' },
  { id: 'health',        label: 'Health',       icon: '🏥', color: '#10b981' },
  { id: 'travel',        label: 'Travel',       icon: '✈️', color: '#06b6d4' },
  { id: 'food',          label: 'Food',         icon: '🍜', color: '#f97316' },
  { id: 'entertainment', label: 'Entertainment',icon: '🎬', color: '#ec4899' },
  { id: 'science',       label: 'Science',      icon: '🔬', color: '#6366f1' },
  { id: 'art',           label: 'Art',          icon: '🎨', color: '#14b8a6' },
];

const CAT_META = Object.fromEntries(ALL_INTERESTS.map(i => [i.id, i]));

function formatAge(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60000);
  const hr  = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 60) return `${min}m ago`;
  if (hr  < 24) return `${hr}h ago`;
  return `${day}d ago`;
}

// ---------------------------------------------------------------------------
// Interest Selection Screen
// ---------------------------------------------------------------------------
function InterestSelection({ onDone }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  async function handleContinue() {
    setSaving(true);
    setError('');
    try {
      await saveInterests(selected);
      onDone(selected);
    } catch {
      setError('Could not save interests. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: 'var(--pinglo-bg)' }}>
      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Rss className="w-7 h-7 text-purple-400" />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pinglo-text)' }}>
            Your Pinglo Feed
          </h1>
        </div>
        <p className="text-sm mb-8" style={{ color: 'var(--pinglo-text-muted)' }}>
          Pick at least 3 topics to personalise your news feed.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {ALL_INTERESTS.map(interest => {
            const active = selected.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggle(interest.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left"
                style={{
                  background: active ? interest.color + '22' : 'var(--pinglo-hover)',
                  borderColor: active ? interest.color : 'transparent',
                  color: active ? interest.color : 'var(--pinglo-text)',
                }}
              >
                <span className="text-xl">{interest.icon}</span>
                <span className="font-medium text-sm">{interest.label}</span>
                {active && (
                  <span className="ml-auto text-xs font-bold" style={{ color: interest.color }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={selected.length < 3 || saving}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40"
          style={{
            background: selected.length >= 3 ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : undefined,
            color: 'white',
          }}
        >
          {saving ? 'Saving…' : `Continue with ${selected.length} topic${selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article Card
// ---------------------------------------------------------------------------
function ArticleCard({ article, onLike, onShare, onSave }) {
  const meta  = CAT_META[article.category] || { icon: '📰', label: article.category, color: '#64748b' };
  const liked = article._liked;
  const saved = article._saved;

  function openArticle() {
    trackInteraction(article.id, 'view');
    window.open(article.url, '_blank', 'noopener');
  }

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4 transition-all duration-200 cursor-pointer"
      style={{
        background: 'var(--pinglo-sidebar)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      {article.image_url && (
        <div className="w-full h-40 overflow-hidden" onClick={openArticle}>
          <img
            src={article.image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-4" onClick={openArticle}>
        {/* Category + Source row */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: meta.color + '22', color: meta.color }}
          >
            {meta.icon} {meta.label}
          </span>
          <span className="text-xs ml-auto" style={{ color: 'var(--pinglo-text-muted)' }}>
            {article.source} · {formatAge(article.published_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base leading-snug mb-2" style={{ color: 'var(--pinglo-text)' }}>
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--pinglo-text-muted)' }}>
            {article.summary}
          </p>
        )}
      </div>

      {/* Action bar */}
      <div
        className="flex items-center gap-1 px-4 py-2 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
          style={{ color: liked ? '#ef4444' : 'var(--pinglo-text-muted)' }}
          onClick={e => { e.stopPropagation(); onLike(article.id); }}
        >
          <Heart className="w-3.5 h-3.5" fill={liked ? '#ef4444' : 'none'} />
          Like
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
          style={{ color: 'var(--pinglo-text-muted)' }}
          onClick={e => { e.stopPropagation(); onShare(article); }}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
          style={{ color: saved ? '#a855f7' : 'var(--pinglo-text-muted)' }}
          onClick={e => { e.stopPropagation(); onSave(article.id); }}
        >
          <Bookmark className="w-3.5 h-3.5" fill={saved ? '#a855f7' : 'none'} />
          Save
        </button>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
          style={{ color: 'var(--pinglo-text-muted)' }}
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Read
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category filter bar
// ---------------------------------------------------------------------------
function CategoryBar({ categories, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
      <button
        onClick={() => onChange(null)}
        className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{
          background: active === null ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'var(--pinglo-hover)',
          color: active === null ? 'white' : 'var(--pinglo-text-muted)',
        }}
      >
        All
      </button>
      {categories.map(id => {
        const m = CAT_META[id] || { icon: '📰', label: id };
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: active === id ? (m.color + '33') : 'var(--pinglo-hover)',
              color: active === id ? m.color : 'var(--pinglo-text-muted)',
              border: active === id ? `1px solid ${m.color}55` : '1px solid transparent',
            }}
          >
            {m.icon} {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main NewsFeed component
// ---------------------------------------------------------------------------
export default function NewsFeed({ onBack }) {
  const [phase, setPhase]           = useState('loading'); // loading | setup | feed
  const [articles, setArticles]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setFilter]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState('');

  const loadFeed = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const data = await getFeed();
      setArticles(data.articles || []);
      setCategories(data.categories || []);
      setPhase('feed');
    } catch {
      setError('Could not load your feed. Check your connection.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const { categories: cats } = await getInterests();
        if (!cats || cats.length < 3) {
          setPhase('setup');
        } else {
          await loadFeed();
        }
      } catch {
        setPhase('setup');
      }
    }
    init();
  }, [loadFeed]);

  function handleInterestsDone(cats) {
    setCategories(cats);
    loadFeed();
  }

  function handleLike(id) {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, _liked: !a._liked } : a
    ));
    trackInteraction(id, 'like');
  }

  function handleSave(id) {
    setArticles(prev => prev.map(a =>
      a.id === id ? { ...a, _saved: !a._saved } : a
    ));
    trackInteraction(id, 'save');
  }

  function handleShare(article) {
    if (navigator.share) {
      navigator.share({ title: article.title, url: article.url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(article.url).catch(() => {});
    }
    trackInteraction(article.id, 'share');
  }

  const visible = activeFilter
    ? articles.filter(a => a.category === activeFilter)
    : articles;

  if (phase === 'loading') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--pinglo-bg)' }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--pinglo-text-muted)' }}>Loading your feed…</p>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return <InterestSelection onDone={handleInterestsDone} />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: 'var(--pinglo-bg)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'var(--pinglo-header)' }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg transition-colors mr-1"
            style={{ color: 'var(--pinglo-text-muted)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <Rss className="w-5 h-5 text-purple-400" />
        <div className="flex-1">
          <h2 className="font-bold text-sm" style={{ color: 'var(--pinglo-text)' }}>Your Feed</h2>
          <p className="text-xs" style={{ color: 'var(--pinglo-text-muted)' }}>
            {articles.length} articles · personalised
          </p>
        </div>
        <button
          onClick={loadFeed}
          disabled={refreshing}
          className="p-2 rounded-xl transition-all"
          style={{ color: 'var(--pinglo-text-muted)' }}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setPhase('setup')}
          className="text-xs px-3 py-1.5 rounded-full"
          style={{
            background: 'rgba(124,58,237,0.15)',
            color: '#a78bfa',
          }}
        >
          Edit topics
        </button>
      </div>

      {/* Category filter bar */}
      {categories.length > 0 && (
        <div className="px-4 py-2 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <CategoryBar categories={categories} active={activeFilter} onChange={setFilter} />
        </div>
      )}

      {/* Articles */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={loadFeed}
              className="text-sm px-4 py-2 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}
            >
              Try again
            </button>
          </div>
        )}

        {!error && visible.length === 0 && !refreshing && (
          <div className="text-center py-16">
            <span className="text-4xl mb-4 block">📰</span>
            <p className="font-semibold mb-1" style={{ color: 'var(--pinglo-text)' }}>No articles here yet</p>
            <p className="text-sm" style={{ color: 'var(--pinglo-text-muted)' }}>
              {activeFilter ? 'Try a different topic or ' : ''}refresh to load the latest news.
            </p>
          </div>
        )}

        {visible.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onLike={handleLike}
            onShare={handleShare}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  );
}
