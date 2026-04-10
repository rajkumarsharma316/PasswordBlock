/**
 * PasswordCard — A single password entry displayed as a glassmorphism card.
 */

import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiCopy, FiEdit2, FiTrash2, FiStar, FiCheck } from 'react-icons/fi';
import type { PasswordEntry } from '../types';
import { CATEGORY_META } from '../types';

interface PasswordCardProps {
  entry: PasswordEntry;
  onEdit: (entry: PasswordEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  index: number;
}

const PasswordCard: React.FC<PasswordCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  index,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const category = CATEGORY_META[entry.category];

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="glass-card password-card"
      style={{
        '--card-accent': category.color,
        animationDelay: `${index * 0.05}s`,
      } as React.CSSProperties}
      id={`password-card-${entry.id.slice(0, 8)}`}
    >
      {/* Header */}
      <div className="password-card-header">
        <div
          className="password-card-icon"
          style={{
            background: `${category.color}18`,
            color: category.color,
          }}
        >
          {category.icon}
        </div>
        <div className="password-card-info">
          <div className="password-card-site">{entry.site}</div>
          <div className="password-card-username">{entry.username}</div>
        </div>
        <button
          className={`password-card-fav ${entry.favorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(entry.id)}
          title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <FiStar size={18} fill={entry.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Password field */}
      <div className="password-card-body">
        <span className="password-card-password">
          {showPassword ? entry.password : '•'.repeat(Math.min(entry.password.length, 20))}
        </span>
        <div className="password-card-actions">
          <button
            className="btn-icon"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
          <button
            className="btn-icon"
            onClick={() => handleCopy(entry.password, 'password')}
            title="Copy password"
          >
            {copiedField === 'password' ? (
              <FiCheck size={14} style={{ color: 'var(--accent-green)' }} />
            ) : (
              <FiCopy size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="password-card-footer">
        <span
          className="password-card-category"
          style={{
            background: `${category.color}18`,
            color: category.color,
          }}
        >
          {category.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span className="password-card-time">{formatDate(entry.updatedAt)}</span>
          <button
            className="btn-icon"
            onClick={() => onEdit(entry)}
            title="Edit"
          >
            <FiEdit2 size={14} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(entry.id)}
            title="Delete"
            style={{ color: 'var(--accent-red)' }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordCard;
