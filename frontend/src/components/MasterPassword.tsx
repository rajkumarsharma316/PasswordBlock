/**
 * MasterPassword — Setup / Unlock screen for the master password.
 *
 * Two modes:
 * 1. "setup" — first-time user: enter + confirm a master password.
 * 2. "unlock" — returning user: enter master password to decrypt vault.
 */

import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiShield, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import { getPasswordStrength } from '../crypto/encryption';

interface MasterPasswordProps {
  mode: 'setup' | 'unlock';
  onSubmit: (password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const MasterPassword: React.FC<MasterPasswordProps> = ({
  mode,
  onSubmit,
  loading = false,
  error,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!password) {
      setLocalError('Please enter your master password.');
      return;
    }

    if (mode === 'setup') {
      if (password.length < 8) {
        setLocalError('Master password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
    }

    try {
      await onSubmit(password);
    } catch {
      // Error is handled in the parent
    }
  };

  const displayError = localError || error;

  return (
    <div className="landing-container">
      <div className="glass-card landing-card">
        <div className="landing-icon">
          <FiShield size={36} />
        </div>

        <h1 className="landing-title">
          {mode === 'setup' ? 'Create Master Password' : 'Unlock Your Vault'}
        </h1>
        <p className="landing-subtitle">
          {mode === 'setup'
            ? 'Choose a strong master password to encrypt your vault. This password never leaves your browser.'
            : 'Enter your master password to decrypt your passwords.'}
        </p>

        {mode === 'setup' && (
          <div className="landing-features">
            <div className="landing-feature">
              <FiCheck className="landing-feature-icon" />
              <span>AES-256-GCM client-side encryption</span>
            </div>
            <div className="landing-feature">
              <FiCheck className="landing-feature-icon" />
              <span>PBKDF2 key derivation (600k iterations)</span>
            </div>
            <div className="landing-feature">
              <FiCheck className="landing-feature-icon" />
              <span>Zero-knowledge — we never see your password</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Password field */}
          <div className="form-group">
            <label className="form-label" htmlFor="master-password">
              Master Password
            </label>
            <div className="master-password-input-group">
              <input
                id="master-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder={mode === 'setup' ? 'Choose a strong password…' : 'Enter your master password…'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                autoFocus
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
          </div>

          {/* Strength meter (setup only) */}
          {mode === 'setup' && password.length > 0 && (
            <div>
              <div className="strength-meter">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`strength-bar ${i <= strength.score - 1 ? 'filled' : ''}`}
                    style={{ '--bar-color': strength.color } as React.CSSProperties}
                  />
                ))}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: strength.color,
                  marginTop: '4px',
                  textAlign: 'right',
                  fontWeight: 600,
                }}
              >
                {strength.label}
              </div>
            </div>
          )}

          {/* Confirm password (setup only) */}
          {mode === 'setup' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                placeholder="Confirm your master password…"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          {/* Warning */}
          {mode === 'setup' && (
            <div className="master-password-warning">
              <FiAlertTriangle className="master-password-warning-icon" />
              <span>
                <strong>Warning:</strong> If you forget your master password, your encrypted data
                will be permanently unrecoverable. There is no recovery mechanism.
              </span>
            </div>
          )}

          {/* Error */}
          {displayError && (
            <div
              style={{
                padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--accent-red-dim)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-red)',
                fontSize: '0.85rem',
              }}
            >
              {displayError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            id="master-password-submit"
            style={{ width: '100%', padding: '14px' }}
          >
            {loading ? (
              <span className="spinner" />
            ) : mode === 'setup' ? (
              'Create Vault'
            ) : (
              'Unlock Vault'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MasterPassword;
