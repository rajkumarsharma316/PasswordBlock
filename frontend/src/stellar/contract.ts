/**
 * PasswordBlock — Soroban contract interaction layer.
 *
 * For demo mode (no wallet / no contract deployed), everything persists
 * to localStorage. When connected with Freighter and a contract ID,
 * transactions are built and sent through Soroban RPC using the generated bindings.
 */

import { Buffer } from 'buffer';
import type { EncryptedData } from '../crypto/encryption';
import * as PasswordVault from '../contracts/password-vault';
import { StellarWalletsKit } from './kit';

// ── Configuration ───────────────────────────────────────────────────────
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || '';

export function isContractConfigured(): boolean {
  return CONTRACT_ID.length > 0;
}

// ── On-chain entry shape (matches Soroban contract) ─────────────────────
export interface ChainEntry {
  entry_id: string;
  encrypted_data: string; // JSON of EncryptedData
  encrypted_label: string; // JSON of EncryptedData
  timestamp: number;
}

export interface TxResult {
  hash?: string;
  success: boolean;
  error?: string;
}

// ── Demo mode (localStorage) ────────────────────────────────────────────
const DEMO_STORAGE_KEY = 'passwordblock_demo_entries';

function getDemoEntries(userKey: string): ChainEntry[] {
  try {
    const raw = localStorage.getItem(`${DEMO_STORAGE_KEY}_${userKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setDemoEntries(userKey: string, entries: ChainEntry[]): void {
  localStorage.setItem(`${DEMO_STORAGE_KEY}_${userKey}`, JSON.stringify(entries));
}

// ── On-chain Client Factory ───────────────────────────────────────────────
function getClient(userPublicKey: string) {
  return new PasswordVault.Client({
    networkPassphrase: PasswordVault.networks.testnet.networkPassphrase,
    contractId: CONTRACT_ID || PasswordVault.networks.testnet.contractId,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    publicKey: userPublicKey,
    signTransaction: async (txXdr: string, opts?: any) => {
      try {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(txXdr, {
          networkPassphrase: opts?.networkPassphrase
        });
        return { signedTxXdr };
      } catch (error: any) {
        return { error: error.message || String(error) } as any;
      }
    },
    signAuthEntry: async (entryXdr: string, opts?: any) => {
      try {
        const { signedAuthEntry } = await StellarWalletsKit.signAuthEntry(entryXdr, {
          networkPassphrase: opts?.networkPassphrase,
          address: opts?.address
        });
        return { signedAuthEntry };
      } catch (error: any) {
        return { error: error.message || String(error) } as any;
      }
    }
  });
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Store an encrypted entry on-chain (or in localStorage for demo).
 */
export async function storeEntry(
  userPublicKey: string,
  entryId: string,
  encryptedData: EncryptedData,
  encryptedLabel: EncryptedData,
  _isDemo: boolean
): Promise<TxResult> {
  if (_isDemo || !isContractConfigured()) {
    // Demo: use localStorage
    const entries = getDemoEntries(userPublicKey);
    const existing = entries.findIndex((e) => e.entry_id === entryId);
    const chainEntry: ChainEntry = {
      entry_id: entryId,
      encrypted_data: JSON.stringify(encryptedData),
      encrypted_label: JSON.stringify(encryptedLabel),
      timestamp: Date.now(),
    };

    if (existing >= 0) {
      entries[existing] = chainEntry;
    } else {
      entries.push(chainEntry);
    }
    setDemoEntries(userPublicKey, entries);
    return { success: true };
  }

  // ── On-chain (Soroban SDK) ──────────────
  try {
    const client = getClient(userPublicKey);

    const tx = await client.store_entry({
      user: userPublicKey,
      entry_id: Buffer.from(entryId, 'hex'),
      encrypted_data: Buffer.from(JSON.stringify(encryptedData), 'utf-8'),
      encrypted_label: Buffer.from(JSON.stringify(encryptedLabel), 'utf-8'),
      timestamp: BigInt(Date.now()),
    });

    const result = await tx.signAndSend();
    return { 
      success: true, 
      hash: result.sendTransactionResponse?.hash 
    };
  } catch (err: any) {
    let error = err.message || 'Transaction failed';
    if (error.includes('STW-001')) error = 'Transaction rejected by user.';
    return { success: false, error };
  }
}

/**
 * Get all encrypted entries for a user.
 */
export async function getAllEntries(
  userPublicKey: string,
  _isDemo: boolean
): Promise<ChainEntry[]> {
  if (_isDemo || !isContractConfigured()) {
    return getDemoEntries(userPublicKey);
  }

  try {
    const client = getClient(userPublicKey);
    const result = await client.get_all_entries({ user: userPublicKey });
    const entries: ChainEntry[] = [];
    
    for (const [idBuf, entry] of result.result) {
      entries.push({
        entry_id: idBuf.toString('hex'),
        encrypted_data: entry.data.toString('utf-8'),
        encrypted_label: entry.label.toString('utf-8'),
        timestamp: Number(entry.timestamp),
      });
    }

    return entries;
  } catch (err) {
    console.error('Failed to fetch entries from chain:', err);
    return [];
  }
}

/**
 * Delete an entry.
 */
export async function deleteEntry(
  userPublicKey: string,
  entryId: string,
  _isDemo: boolean
): Promise<TxResult> {
  if (_isDemo || !isContractConfigured()) {
    const entries = getDemoEntries(userPublicKey).filter(
      (e) => e.entry_id !== entryId
    );
    setDemoEntries(userPublicKey, entries);
    return { success: true };
  }

  try {
    const client = getClient(userPublicKey);

    const tx = await client.delete_entry({
      user: userPublicKey,
      entry_id: Buffer.from(entryId, 'hex'),
    });

    const result = await tx.signAndSend();
    return { 
      success: true, 
      hash: result.sendTransactionResponse?.hash 
    };
  } catch (err: any) {
    let error = err.message || 'Transaction failed';
    if (error.includes('STW-001')) error = 'Delete transaction rejected.';
    return { success: false, error };
  }
}

/**
 * Get entry count for a user.
 */
export async function getEntryCount(
  userPublicKey: string,
  _isDemo: boolean
): Promise<number> {
  if (_isDemo || !isContractConfigured()) {
    return getDemoEntries(userPublicKey).length;
  }

  try {
    const client = getClient(userPublicKey);
    const tx = await client.get_entry_count({ user: userPublicKey });
    return Number(tx.result);
  } catch {
    return 0;
  }
}
