/**
 * Header — Top navigation bar with logo, wallet status, and actions.
 */

import React from 'react';
import type { WalletState } from '../types';
import { shortenAddress } from '../stellar/wallet';
import { FiLogOut, FiLock, FiWifi, FiWifiOff } from 'react-icons/fi';

interface HeaderProps {
  wallet: WalletState;
  isUnlocked: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onLock: () => void;
}

const Header: React.FC<HeaderProps> = ({
  wallet,
  isUnlocked,
  onConnect,
  onDisconnect,
  onLock,
}) => {
  return (
    <header className="header" id="header">
      <div className="container header-inner">
        {/* Logo */}
        <div className="header-logo">
          <div className="header-logo-icon">🔐</div>
          <span className="header-logo-text">PasswordBlock</span>
          {wallet.isDemo && (
            <span className="header-logo-badge">Demo Mode</span>
          )}
          {wallet.connected && !wallet.isDemo && (
            <span
              className="header-logo-badge"
              style={{ color: 'var(--accent-green)', background: 'var(--accent-green-dim)' }}
            >
              {wallet.network}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="header-actions">
          {wallet.connected ? (
            <>
              {/* Wallet info */}
              <div className="wallet-info">
                <span className="wallet-dot" />
                <span className="wallet-address">
                  {wallet.isDemo ? 'Demo Vault' : shortenAddress(wallet.publicKey || '')}
                </span>
                {wallet.isDemo ? (
                  <FiWifiOff size={14} style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <FiWifi size={14} style={{ color: 'var(--accent-green)' }} />
                )}
              </div>

              {/* Lock button */}
              {isUnlocked && (
                <button
                  className="btn-icon"
                  onClick={onLock}
                  title="Lock vault"
                  id="lock-vault-btn"
                >
                  <FiLock size={18} />
                </button>
              )}

              {/* Disconnect */}
              {!wallet.isDemo && (
                <button
                  className="btn-icon"
                  onClick={onDisconnect}
                  title="Disconnect wallet"
                  id="disconnect-wallet-btn"
                >
                  <FiLogOut size={18} />
                </button>
              )}
            </>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={onConnect}
              id="connect-wallet-btn"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
