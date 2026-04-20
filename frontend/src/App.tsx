/**
 * App.tsx — PasswordBlock main application shell.
 *
 * Manages the overall app state flow:
 * Landing → Connect Wallet → Setup/Unlock Master Password → Dashboard
 */

import React, { useState, useCallback, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { AppView, PasswordEntry } from './types';
import { useWallet } from './hooks/useWallet';
import { usePasswords } from './hooks/usePasswords';
import Header from './components/Header';
import PasswordList from './components/PasswordList';
import AddPassword from './components/AddPassword';

// ── App Component ───────────────────────────────────────────────────────
const App: React.FC = () => {
  const { wallet, loading: walletLoading, connect, disconnect, displayAddress } = useWallet();
  const [appView, setAppView] = useState<AppView>('landing');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    entries,
    loading: entriesLoading,
    actionLoading,
    addEntry,
    updateEntry,
    removeEntry,
    toggleFavorite,
    loadEntries,
  } = usePasswords(wallet.publicKey, wallet.signature || null, wallet.isDemo);

  // ── Route to dashboard upon connection ───────────────────────────────
  useEffect(() => {
    if (wallet.connected && wallet.signature) {
      setAppView('dashboard');
    } else {
      setAppView('landing');
    }
  }, [wallet.connected, wallet.signature]);

  // ── Load entries when dashboard opens ───────────────────────────────
  useEffect(() => {
    if (appView === 'dashboard' && wallet.signature) {
      loadEntries();
    }
  }, [appView, wallet.signature, loadEntries]);

  // ── Track mouse for gradient glow effect ──────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── Helper to show Tx toast ──────────────────────────────────────────
  const showTxToast = (message: string, hash?: string) => {
    toast.success(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 600 }}>{message}</span>
          {hash && (
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.75rem',
                color: '#3B82F6',
                textDecoration: 'underline',
              }}
              onClick={() => toast.dismiss(t.id)}
            >
              View on Explorer: {hash.slice(0, 8)}...{hash.slice(-8)}
            </a>
          )}
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        },
      }
    );
  };

  // ── Handle delete with confirmation ───────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      if (deleteConfirm === id) {
        const loadingToast = toast.loading('Transaction pending...', {
          style: {
            background: '#111827',
            color: '#F1F5F9',
            border: '1px solid rgba(255,255,255,0.06)',
          },
        });
        try {
          const result = await removeEntry(id);
          toast.dismiss(loadingToast);
          if (result.success) {
            showTxToast('Password deleted.', result.hash);
          } else {
            toast.error(result.error || 'Failed to delete password.');
          }
        } catch {
          toast.dismiss(loadingToast);
          toast.error('An unexpected error occurred.');
        }
        setDeleteConfirm(null);
      } else {
        setDeleteConfirm(id);
        toast('Click delete again to confirm.', {
          icon: '⚠️',
          style: {
            background: '#111827',
            color: '#F59E0B',
            border: '1px solid rgba(245,158,11,0.2)',
          },
        });
        setTimeout(() => setDeleteConfirm(null), 3000);
      }
    },
    [deleteConfirm, removeEntry]
  );

  // ── Handle save / update ──────────────────────────────────────────
  const handleSave = useCallback(
    async (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      const loadingToast = toast.loading('Sharing with the blockchain...', {
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      });
      const result = await addEntry(data);
      toast.dismiss(loadingToast);
      if (result.success) {
        showTxToast('Password saved on-chain!', result.hash);
      } else {
        toast.error(result.error || 'Failed to save password.');
      }
    },
    [addEntry]
  );

  const handleUpdate = useCallback(
    async (entry: PasswordEntry) => {
      const loadingToast = toast.loading('Updating on-chain...', {
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      });
      const result = await updateEntry(entry);
      toast.dismiss(loadingToast);
      if (result.success) {
        showTxToast('Password updated on-chain!', result.hash);
      } else {
        toast.error(result.error || 'Failed to update password.');
      }
    },
    [updateEntry]
  );

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      await toggleFavorite(id);
    },
    [toggleFavorite]
  );

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: 'toast-custom',
        }}
      />

      <Header
        wallet={wallet}
        isUnlocked={appView === 'dashboard'}
        onConnect={connect}
        onDisconnect={disconnect}
        onLock={disconnect}
      />

      {/* Landing */}
      {appView === 'landing' && !wallet.connected && (
        <div className="landing-container">
          <div className="glass-card landing-card">
            <div className="landing-icon">🔐</div>
            <h1 className="landing-title">PasswordBlock</h1>
            <p className="landing-subtitle">
              A decentralized, blockchain-powered password manager.
              Your credentials, encrypted and stored on the Stellar network.
            </p>
            <div className="landing-features">
              <div className="landing-feature">
                <span className="landing-feature-icon">🔒</span>
                <span>AES-256-GCM client-side encryption</span>
              </div>
              <div className="landing-feature">
                <span className="landing-feature-icon">⛓️</span>
                <span>Stored on Stellar blockchain via Soroban</span>
              </div>
              <div className="landing-feature">
                <span className="landing-feature-icon">👁️</span>
                <span>Zero-knowledge architecture</span>
              </div>
              <div className="landing-feature">
                <span className="landing-feature-icon">🌐</span>
                <span>Access from any browser, anywhere</span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={connect}
              disabled={walletLoading}
              id="landing-connect-btn"
              style={{ width: '100%', padding: '14px' }}
            >
              {walletLoading ? (
                <span className="spinner" />
              ) : (
                'Connect Wallet & Get Started'
              )}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>
              No Freighter wallet? The app will launch in <strong>demo mode</strong> (offline, localStorage).
            </p>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {appView === 'dashboard' && (
        <>
          <PasswordList
            entries={entries}
            loading={entriesLoading}
            onAdd={() => {
              setEditEntry(null);
              setShowAddModal(true);
            }}
            onEdit={(entry) => {
              setEditEntry(entry);
              setShowAddModal(true);
            }}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
          <AddPassword
            isOpen={showAddModal}
            editEntry={editEntry}
            onClose={() => {
              setShowAddModal(false);
              setEditEntry(null);
            }}
            onSave={handleSave}
            onUpdate={handleUpdate}
          />
        </>
      )}
    </>
  );
};

export default App;
