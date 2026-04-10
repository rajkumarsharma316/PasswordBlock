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
): Promise<void> {
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
    return;
  }

  // ── On-chain (Soroban SDK) ──────────────
  const client = new PasswordVault.Client({
    networkPassphrase: PasswordVault.networks.testnet.networkPassphrase,
    contractId: PasswordVault.networks.testnet.contractId,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    publicKey: userPublicKey,
  });

  const tx = await client.store_entry({
    user: userPublicKey,
    entry_id: Buffer.from(entryId, 'hex'),
    encrypted_data: Buffer.from(JSON.stringify(encryptedData), 'utf-8'),
    encrypted_label: Buffer.from(JSON.stringify(encryptedLabel), 'utf-8'),
    timestamp: BigInt(Date.now()),
  });

  await tx.signAndSend();
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

  // On-chain fetch
  const client = new PasswordVault.Client({
    networkPassphrase: PasswordVault.networks.testnet.networkPassphrase,
    contractId: PasswordVault.networks.testnet.contractId,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    publicKey: userPublicKey,
  });

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
}

/**
 * Delete an entry.
 */
export async function deleteEntry(
  userPublicKey: string,
  entryId: string,
  _isDemo: boolean
): Promise<void> {
  if (_isDemo || !isContractConfigured()) {
    const entries = getDemoEntries(userPublicKey).filter(
      (e) => e.entry_id !== entryId
    );
    setDemoEntries(userPublicKey, entries);
    return;
  }

  const client = new PasswordVault.Client({
    networkPassphrase: PasswordVault.networks.testnet.networkPassphrase,
    contractId: PasswordVault.networks.testnet.contractId,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    publicKey: userPublicKey,
  });

  const tx = await client.delete_entry({
    user: userPublicKey,
    entry_id: Buffer.from(entryId, 'hex'),
  });

  await tx.signAndSend();
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

  const client = new PasswordVault.Client({
    networkPassphrase: PasswordVault.networks.testnet.networkPassphrase,
    contractId: PasswordVault.networks.testnet.contractId,
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    publicKey: userPublicKey,
  });

  const tx = await client.get_entry_count({ user: userPublicKey });
  return Number(tx.result);
}
