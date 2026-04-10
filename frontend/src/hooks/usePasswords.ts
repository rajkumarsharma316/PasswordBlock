/**
 * PasswordBlock — usePasswords hook.
 *
 * Manages password entries: load, add, update, delete.
 * Handles client-side encryption/decryption transparently.
 */

import { useState, useCallback } from 'react';
import type { PasswordEntry } from '../types';
import {
  encryptEntry,
  decryptEntry,
  generateEntryId,
} from '../crypto/encryption';
import type { EncryptedData } from '../crypto/encryption';
import { storeEntry, getAllEntries, deleteEntry as contractDelete } from '../stellar/contract';

interface UsePasswordsReturn {
  entries: PasswordEntry[];
  loading: boolean;
  error: string | null;
  loadEntries: () => Promise<void>;
  addEntry: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (entry: PasswordEntry) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export function usePasswords(
  publicKey: string | null,
  masterPassword: string | null,
  isDemo: boolean
): UsePasswordsReturn {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!publicKey || !masterPassword) return;
    setLoading(true);
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
          // Skip entries that can't be decrypted (wrong master password or corrupted)
          console.warn(`Skipping entry ${ce.entry_id}: decryption failed`);
        }
      }

      // Sort by updatedAt descending
      decrypted.sort((a, b) => b.updatedAt - a.updatedAt);
      setEntries(decrypted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load entries';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [publicKey, masterPassword, isDemo]);

  const addEntry = useCallback(
    async (data: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!publicKey || !masterPassword) return;

      const now = Date.now();
      const entry: PasswordEntry = {
        ...data,
        id: generateEntryId(),
        createdAt: now,
        updatedAt: now,
      };

      try {
        const { encryptedData, encryptedLabel } = await encryptEntry(entry, masterPassword);
        await storeEntry(publicKey, entry.id, encryptedData, encryptedLabel, isDemo);

        setEntries((prev) => [entry, ...prev]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to add entry';
        setError(msg);
        throw err;
      }
    },
    [publicKey, masterPassword, isDemo]
  );

  const updateEntry = useCallback(
    async (entry: PasswordEntry) => {
      if (!publicKey || !masterPassword) return;

      const updated = { ...entry, updatedAt: Date.now() };

      try {
        const { encryptedData, encryptedLabel } = await encryptEntry(updated, masterPassword);
        await storeEntry(publicKey, updated.id, encryptedData, encryptedLabel, isDemo);

        setEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update entry';
        setError(msg);
        throw err;
      }
    },
    [publicKey, masterPassword, isDemo]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      if (!publicKey) return;

      try {
        await contractDelete(publicKey, id, isDemo);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete entry';
        setError(msg);
        throw err;
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
    error,
    loadEntries,
    addEntry,
    updateEntry,
    removeEntry,
    toggleFavorite,
  };
}
