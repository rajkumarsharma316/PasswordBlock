/**
 * PasswordGenerator — Configurable random password generator.
 *
 * Used both stand-alone and embedded inside AddPassword modal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi';
import { generatePassword, getPasswordStrength, type GeneratorOptions } from '../crypto/encryption';

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void;
  compact?: boolean;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  onUsePassword,
  compact = false,
}) => {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setPassword(generatePassword(options));
    setCopied(false);
  }, [options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const strength = getPasswordStrength(password);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={compact ? 'generator-section' : ''}>
      {!compact && (
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Password Generator
          </h3>
        </div>
      )}

      {/* Generated password output */}
      <div className="generator-output">
        <span className="generator-password">{password}</span>
        <button className="btn-icon" onClick={handleCopy} title="Copy password" id="gen-copy-btn">
          {copied ? <FiCheck size={16} style={{ color: 'var(--accent-green)' }} /> : <FiCopy size={16} />}
        </button>
        <button className="btn-icon" onClick={regenerate} title="Regenerate" id="gen-refresh-btn">
          <FiRefreshCw size={16} />
        </button>
        {onUsePassword && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onUsePassword(password)}
            id="gen-use-btn"
          >
            Use
          </button>
        )}
      </div>

      {/* Strength meter */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div className="strength-meter">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`strength-bar ${i <= strength.score - 1 ? 'filled' : ''}`}
              style={{ '--bar-color': strength.color } as React.CSSProperties}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {password.length} characters
          </span>
          <span style={{ fontSize: '0.72rem', color: strength.color, fontWeight: 600 }}>
            {strength.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="generator-controls">
        {/* Length slider */}
        <div className="generator-slider-group">
          <div className="generator-slider-header">
            <span>Length</span>
            <span>{options.length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) =>
              setOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))
            }
            id="gen-length-slider"
          />
        </div>

        {/* Checkboxes */}
        <div className="generator-checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, uppercase: e.target.checked }))
              }
            />
            <span className="checkbox-custom" />
            Uppercase (A-Z)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, lowercase: e.target.checked }))
              }
            />
            <span className="checkbox-custom" />
            Lowercase (a-z)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, numbers: e.target.checked }))
              }
            />
            <span className="checkbox-custom" />
            Numbers (0-9)
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, symbols: e.target.checked }))
              }
            />
            <span className="checkbox-custom" />
            Symbols (!@#$)
          </label>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
