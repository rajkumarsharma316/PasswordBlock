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
import {
  createVerificationToken,
  verifyMasterPassword,
} from './crypto/encryption';
import type { EncryptedData } from './crypto/encryption';
import { getEntryCount } from './stellar/contract';
import Header from './components/Header';
import MasterPassword from './components/MasterPassword';
import PasswordList from './components/PasswordList';
import AddPassword from './components/AddPassword';

// ── Local storage keys for master password verification ─────────────────
const VAULT_TOKEN_KEY = 'passwordblock_vault_token';

function getStoredToken(publicKey: string): EncryptedData | null {
  try {
    const raw = localStorage.getItem(`${VAULT_TOKEN_KEY}_${publicKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeToken(publicKey: string, token: EncryptedData): void {
  localStorage.setItem(`${VAULT_TOKEN_KEY}_${publicKey}`, JSON.stringify(token));
}

// ── App Component ───────────────────────────────────────────────────────
const App: React.FC = () => {
  const { wallet, loading: walletLoading, connect, disconnect, displayAddress } = useWallet();
  const [appView, setAppView] = useState<AppView>('landing');
  
  // New state to manage "checking chain" vs "setup" vs "unlock"
  const [masterMode, setMasterMode] = useState<'setup' | 'unlock' | 'checking'>('checking');

  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const {
    entries,
    loading: entriesLoading,
    addEntry,
    updateEntry,
    removeEntry,
    toggleFavorite,
    loadEntries,
  } = usePasswords(wallet.publicKey, masterPassword, wallet.isDemo);

  // ── Transition views and determine Mode based on wallet state ───────
  useEffect(() => {
    let active = true;

    async function determineVaultStatus() {
      if (!wallet.publicKey) return;
      setMasterMode('checking');
      
      // 1. If we have local token, they are returning for sure.
      const localToken = getStoredToken(wallet.publicKey);
      if (localToken) {
        if (active) setMasterMode('unlock');
        return;
      }

      // 2. No local token (browser cleared / new browser). Check the blockchain!
      try {
        const count = await getEntryCount(wallet.publicKey, wallet.isDemo);
        if (count > 0) {
          // They have on-chain data! Skip Setup and ask them to Unlock.
          if (active) setMasterMode('unlock');
        } else {
          // No history on-chain either. Truly a new vault.
          if (active) setMasterMode('setup');
        }
      } catch (e) {
        console.error("Failed to query vault count:", e);
        // Fallback to setup if chain fetch fails (assuming new user)
        if (active) setMasterMode('setup');
      }
    }

    if (wallet.connected && appView === 'landing') {
      determineVaultStatus().then(() => {
        if (active) setAppView('unlock');
      });
    }

    if (!wallet.connected) {
      setAppView('landing');
      setMasterPassword(null);
    }

    return () => {
      active = false;
    };
  }, [wallet.connected, wallet.publicKey, wallet.isDemo, appView]);

  // ── Load entries when vault is unlocked ───────────────────────────
  useEffect(() => {
    if (appView === 'dashboard' && masterPassword) {
      loadEntries();
    }
  }, [appView, masterPassword, loadEntries]);

  // ── Track mouse for gradient glow effect ──────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── Handle master password submit ─────────────────────────────────
  const handleMasterSubmit = useCallback(
    async (password: string) => {
      if (!wallet.publicKey) return;
      setMasterLoading(true);
      setMasterError(null);

      try {
        if (masterMode === 'setup') {
          // First-time: create verification token and save
          const token = await createVerificationToken(password);
          storeToken(wallet.publicKey, token);
          setMasterPassword(password);
          setAppView('dashboard');
          toast.success('Vault created! Your passwords are encrypted.', {
            icon: '🔐',
            style: {
              background: '#111827',
              color: '#F1F5F9',
              border: '1px solid rgba(255,255,255,0.06)',
            },
          });
        } else if (masterMode === 'unlock') {
          // Returning user: verify against stored token
          const token = getStoredToken(wallet.publicKey);
          
          if (!token) {
            // CACHE WAS CLEARED: We know they have on-chain data due to determineVaultStatus().
            // So we blindly trust this password (generating a new token), and let them try to decrypt the chain entries.
            // If they entered the wrong password, the chain entries will simply fail to decrypt when they load.
            const newToken = await createVerificationToken(password);
            storeToken(wallet.publicKey, newToken);
            setMasterPassword(password);
            setAppView('dashboard');
            toast.success('Vault token recovered!', {
              icon: '🔄',
              style: {
                background: '#111827',
                color: '#F1F5F9',
                border: '1px solid rgba(255,255,255,0.06)',
              },
            });
            return;
          }

          // NORMAL LOGIN: verify via local token instantly
          const valid = await verifyMasterPassword(password, token);
          if (!valid) {
            setMasterError('Incorrect master password. Please try again.');
            return;
          }

          setMasterPassword(password);
          setAppView('dashboard');
          toast.success('Vault unlocked!', {
            icon: '🔓',
            style: {
              background: '#111827',
              color: '#F1F5F9',
              border: '1px solid rgba(255,255,255,0.06)',
            },
          });
        }
      } catch {
        setMasterError('An error occurred. Please try again.');
      } finally {
        setMasterLoading(false);
      }
    },
    [wallet.publicKey, masterMode]
  );

  // ── Lock vault ────────────────────────────────────────────────────
  const handleLock = useCallback(() => {
    setMasterPassword(null);
    setAppView('unlock');
    toast('Vault locked.', {
      icon: '🔒',
      style: {
        background: '#111827',
        color: '#F1F5F9',
        border: '1px solid rgba(255,255,255,0.06)',
      },
    });
  }, []);

  // ── Handle delete with confirmation ───────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      if (deleteConfirm === id) {
        try {
          await removeEntry(id);
          toast.success('Password deleted.', {
            style: {
              background: '#111827',
              color: '#F1F5F9',
              border: '1px solid rgba(255,255,255,0.06)',
            },
          });
        } catch {
          toast.error('Failed to delete password.');
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
        // Auto-clear confirmation after 3 seconds
        setTimeout(() => setDeleteConfirm(null), 3000);
      }
    },
    [deleteConfirm, removeEntry]
  );

  // ── Handle save / update ──────────────────────────────────────────
  const handleSave = useCallback(
    async (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      await addEntry(data);
      toast.success('Password saved on-chain!', {
        icon: '✅',
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      });
    },
    [addEntry]
  );

  const handleUpdate = useCallback(
    async (entry: PasswordEntry) => {
      await updateEntry(entry);
      toast.success('Password updated on-chain!', {
        icon: '✏️',
        style: {
          background: '#111827',
          color: '#F1F5F9',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      });
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
        onLock={handleLock}
      />

      {/* Landing — auto-redirects once wallet is connected */}
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

      {/* Master Password */}
      {appView === 'unlock' && (
        <>
          {masterMode === 'checking' ? (
            <div className="landing-container">
               <div className="glass-card landing-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="spinner" style={{ width: '30px', height: '30px', marginBottom: '20px' }}></span>
                  <h3>Verifying Blockchain Vault...</h3>
               </div>
            </div>
          ) : (
            <MasterPassword
              mode={masterMode}
              onSubmit={handleMasterSubmit}
              loading={masterLoading}
              error={masterError}
            />
          )}
        </>
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
