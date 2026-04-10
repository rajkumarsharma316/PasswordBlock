/**
 * AddPassword — Modal for creating / editing a password entry.
 */

import React, { useState, useEffect } from 'react';
import { FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import type { PasswordEntry, PasswordCategory } from '../types';
import { CATEGORY_META } from '../types';
import PasswordGenerator from './PasswordGenerator';

interface AddPasswordProps {
  isOpen: boolean;
  editEntry?: PasswordEntry | null;
  onClose: () => void;
  onSave: (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate: (entry: PasswordEntry) => Promise<void>;
}

const AddPassword: React.FC<AddPasswordProps> = ({
  isOpen,
  editEntry,
  onClose,
  onSave,
  onUpdate,
}) => {
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<PasswordCategory>('other');
  const [favorite, setFavorite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editEntry;

  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      setSite(editEntry.site);
      setUsername(editEntry.username);
      setPassword(editEntry.password);
      setNotes(editEntry.notes);
      setCategory(editEntry.category);
      setFavorite(editEntry.favorite);
    } else {
      setSite('');
      setUsername('');
      setPassword('');
      setNotes('');
      setCategory('other');
      setFavorite(false);
    }
    setShowGenerator(false);
    setError(null);
  }, [editEntry, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!site.trim()) {
      setError('Site name is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editEntry) {
        await onUpdate({
          ...editEntry,
          site: site.trim(),
          username: username.trim(),
          password,
          notes: notes.trim(),
          category,
          favorite,
        });
      } else {
        await onSave({
          site: site.trim(),
          username: username.trim(),
          password,
          notes: notes.trim(),
          category,
          favorite,
        });
      }
      onClose();
    } catch {
      setError('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" id="add-password-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Password' : 'Add New Password'}</h2>
          <button className="btn-icon" onClick={onClose} id="close-modal-btn">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Site */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-site">Site / Service</label>
              <input
                id="entry-site"
                type="text"
                className="input-field"
                placeholder="e.g., GitHub, Gmail, Twitter…"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                autoFocus
              />
            </div>

            {/* Username */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-username">Username / Email</label>
              <input
                id="entry-username"
                type="text"
                className="input-field"
                placeholder="e.g., user@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-password">Password</label>
              <div className="master-password-input-group">
                <input
                  id="entry-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field input-field-mono"
                  placeholder="Enter or generate a password…"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="master-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowGenerator(!showGenerator)}
                style={{ alignSelf: 'flex-start', marginTop: '4px' }}
              >
                {showGenerator ? 'Hide Generator' : '🎲 Generate Password'}
              </button>
            </div>

            {/* Password Generator (inline) */}
            {showGenerator && (
              <PasswordGenerator
                compact
                onUsePassword={(pw) => {
                  setPassword(pw);
                  setShowGenerator(false);
                }}
              />
            )}

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-category">Category</label>
              <select
                id="entry-category"
                className="select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value as PasswordCategory)}
              >
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.icon} {meta.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="entry-notes">Notes (optional)</label>
              <textarea
                id="entry-notes"
                className="textarea-field"
                placeholder="Any additional notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--accent-red-dim)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-red)',
                fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="modal-footer" style={{ padding: 0 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                id="save-password-btn"
              >
                {saving ? <span className="spinner" /> : isEditing ? 'Save Changes' : 'Add Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPassword;
