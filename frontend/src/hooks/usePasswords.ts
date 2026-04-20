import { useState, useCallback, useEffect, useRef } from 'react';
import type { PasswordEntry } from '../types';
import {
  encryptEntry,
  decryptEntry,
  generateEntryId,
} from '../crypto/encryption';
import type { EncryptedData } from '../crypto/encryption';
import { storeEntry, getAllEntries, deleteEntry as contractDelete } from '../stellar/contract';
import type { TxResult } from '../stellar/contract';

interface UsePasswordsReturn {
  entries: PasswordEntry[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  loadEntries: () => Promise<void>;
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TxResult>;
  updateEntry: (entry: PasswordEntry) => Promise<TxResult>;
  removeEntry: (id: string) => Promise<TxResult>;
  toggleFavorite: (id: string) => Promise<void>;
}

export function usePasswords(
  publicKey: string | null,
  masterPassword: string | null,
  isDemo: boolean
): UsePasswordsReturn {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchRef = useRef<number>(0);

  const loadEntries = useCallback(async (isSilent = false) => {
    if (!publicKey || !masterPassword) return;
    if (!isSilent) setLoading(true);
    setError(null);

    try {
      const chainEntries = await getAllEntries(publicKey, isDemo);
      const decrypted: PasswordEntry[] = [];

      for (const ce of chainEntries) {
        try {
          const encData: EncryptedData = JSON.parse(ce.encrypted_data);
          const entry = await decryptEntry(encData, masterPassword);
          decrypted.push(entry);
        } catch {
          console.warn(`Skipping entry ${ce.entry_id}: decryption failed`);
        }
      }

      decrypted.sort((a, b) => b.updatedAt - a.updatedAt);
      setEntries(decrypted);
      lastFetchRef.current = Date.now();
    } catch (err: unknown) {
      if (!isSilent) {
        const msg = err instanceof Error ? err.message : 'Failed to load entries';
        setError(msg);
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [publicKey, masterPassword, isDemo]);

  // ── Real-time Synchronization (Polling) ──
  useEffect(() => {
    if (!publicKey || !masterPassword || isDemo) return;

    const interval = setInterval(() => {
      // Only poll if tab is active to save RPC resources
      if (document.visibilityState === 'visible') {
        loadEntries(true);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [publicKey, masterPassword, isDemo, loadEntries]);

  const addEntry = useCallback(
    async (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!publicKey || !masterPassword) throw new Error('Not connected');

      setActionLoading(true);
      const now = Date.now();
      const entry: PasswordEntry = {
        ...data,
        id: generateEntryId(),
        createdAt: now,
        updatedAt: now,
      };

      try {
        const { encryptedData, encryptedLabel } = await encryptEntry(entry, masterPassword);
        const result = await storeEntry(publicKey, entry.id, encryptedData, encryptedLabel, isDemo);

        if (result.success) {
          setEntries((prev) => [entry, ...prev]);
        }
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add entry';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setActionLoading(false);
      }
    },
    [publicKey, masterPassword, isDemo]
  );

  const updateEntry = useCallback(
    async (entry: PasswordEntry) => {
      if (!publicKey || !masterPassword) throw new Error('Not connected');

      setActionLoading(true);
      const updated = { ...entry, updatedAt: Date.now() };

      try {
        const { encryptedData, encryptedLabel } = await encryptEntry(updated, masterPassword);
        const result = await storeEntry(publicKey, updated.id, encryptedData, encryptedLabel, isDemo);

        if (result.success) {
          setEntries((prev) =>
            prev.map((e) => (e.id === updated.id ? updated : e))
          );
        }
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update entry';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setActionLoading(false);
      }
    },
    [publicKey, masterPassword, isDemo]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!publicKey) throw new Error('Not connected');

      setActionLoading(true);
      try {
        const result = await contractDelete(publicKey, id, isDemo);
        if (result.success) {
          setEntries((prev) => prev.filter((e) => e.id !== id));
        }
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete entry';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setActionLoading(false);
      }
    },
    [publicKey, isDemo]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      await updateEntry({ ...entry, favorite: !entry.favorite });
    },
    [entries, updateEntry]
  );

  return {
    entries,
    loading,
    actionLoading,
    error,
    loadEntries,
    addEntry,
    updateEntry,
    removeEntry,
    toggleFavorite,
  };
}
