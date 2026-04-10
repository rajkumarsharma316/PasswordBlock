/**
 * PasswordList — Dashboard view showing all password entries
 * with search, category filter, and grid layout.
 */

import React, { useState, useMemo } from 'react';
import { FiSearch, FiPlus, FiKey, FiShield } from 'react-icons/fi';
import type { PasswordEntry, PasswordCategory } from '../types';
import { CATEGORY_META } from '../types';
import PasswordCard from './PasswordCard';

interface PasswordListProps {
  entries: PasswordEntry[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const PasswordList: React.FC<PasswordListProps> = ({
  entries,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PasswordCategory | 'all' | 'favorites'>('all');

  // Filter entries based on search and category
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Category / favorites filter
    if (activeCategory === 'favorites') {
      result = result.filter((e) => e.favorite);
    } else if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.site.toLowerCase().includes(q) ||
          e.username.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
      );
    }

    return result;
  }, [entries, search, activeCategory]);

  // Count favorites
  const favCount = entries.filter((e) => e.favorite).length;

  return (
    <div className="dashboard">
      <div className="container">
        {/* Dashboard header */}
        <div className="dashboard-header animate-fade-in">
          <div>
            <h1 className="dashboard-title">My Vault</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div className="dashboard-stats">
              <div className="stat-chip">
                <FiKey size={14} />
                <strong>{entries.length}</strong> passwords
              </div>
              <div className="stat-chip">
                <FiShield size={14} />
                <strong style={{ color: 'var(--accent-green)' }}>AES-256</strong> encrypted
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={onAdd}
              id="add-password-btn"
            >
              <FiPlus size={16} />
              Add Password
            </button>
          </div>
        </div>

        {/* Search & Filter toolbar */}
        <div className="toolbar animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search passwords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-passwords"
            />
          </div>
          <div className="filter-chips">
            <button
              className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All ({entries.length})
            </button>
            <button
              className={`filter-chip ${activeCategory === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveCategory('favorites')}
            >
              ⭐ Favorites ({favCount})
            </button>
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const count = entries.filter((e) => e.category === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  className={`filter-chip ${activeCategory === key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(key as PasswordCategory)}
                >
                  {meta.icon} {meta.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3xl)' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        )}

        {/* Password grid */}
        {!loading && filteredEntries.length > 0 && (
          <div className="password-grid">
            {filteredEntries.map((entry, index) => (
              <PasswordCard
                key={entry.id}
                entry={entry}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredEntries.length === 0 && (
          <div className="empty-state">
            {entries.length === 0 ? (
              <>
                <div className="empty-state-icon">🔐</div>
                <h3>Your Vault is Empty</h3>
                <p>Add your first password to get started. All entries are encrypted client-side before being stored.</p>
                <button className="btn btn-primary" onClick={onAdd} id="empty-add-btn">
                  <FiPlus size={16} />
                  Add Your First Password
                </button>
              </>
            ) : (
              <>
                <div className="empty-state-icon">🔍</div>
                <h3>No Results Found</h3>
                <p>
                  No passwords match your search
                  {activeCategory !== 'all' ? ' and filter' : ''} criteria.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearch('');
                    setActiveCategory('all');
                  }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordList;
