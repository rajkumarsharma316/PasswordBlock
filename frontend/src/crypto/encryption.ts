/**
 * PasswordBlock — Client-side AES-256-GCM encryption module.
 *
 * All encryption/decryption happens in the browser.
 * The master password is derived into an AES key via PBKDF2.
 * Nothing leaves the browser unencrypted.
 */

// ── Key Derivation ──────────────────────────────────────────────────────────

const PBKDF2_ITERATIONS = 600_000; // OWASP recommended for 2025+
const KEY_LENGTH = 256; // AES-256
const SALT_LENGTH = 16; // 128-bit salt
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

/**
 * Derive an AES-256-GCM CryptoKey from a master password + salt.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ── Encrypt ─────────────────────────────────────────────────────────────────

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string;         // base64
  salt: string;       // base64
}

/**
 * Encrypt plaintext with AES-256-GCM using a master password.
 * Returns ciphertext + iv + salt (all base64).
 */
export async function encrypt(plaintext: string, masterPassword: string): Promise<EncryptedData> {
  const salt = generateRandomBytes(SALT_LENGTH);
  const iv = generateRandomBytes(IV_LENGTH);
  const key = await deriveKey(masterPassword, salt);
  const encoder = new TextEncoder();

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
  };
}

// ── Decrypt ─────────────────────────────────────────────────────────────────

/**
 * Decrypt ciphertext with AES-256-GCM using the master password.
 */
export async function decrypt(encrypted: EncryptedData, masterPassword: string): Promise<string> {
  const salt = base64ToArrayBuffer(encrypted.salt);
  const iv = base64ToArrayBuffer(encrypted.iv);
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const key = await deriveKey(masterPassword, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  return new TextDecoder().decode(decrypted);
}


// ── Entry Encryption ────────────────────────────────────────────────────────

import type { PasswordEntry } from '../types';

/**
 * Encrypt a full password entry into an opaque payload.
 */
export async function encryptEntry(
  entry: PasswordEntry,
  masterPassword: string
): Promise<{ encryptedData: EncryptedData; encryptedLabel: EncryptedData }> {
  const json = JSON.stringify(entry);
  const encryptedData = await encrypt(json, masterPassword);
  const encryptedLabel = await encrypt(
    JSON.stringify({ site: entry.site, category: entry.category }),
    masterPassword
  );
  return { encryptedData, encryptedLabel };
}

/**
 * Decrypt an opaque payload back into a PasswordEntry.
 */
export async function decryptEntry(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<PasswordEntry> {
  const json = await decrypt(encryptedData, masterPassword);
  return JSON.parse(json) as PasswordEntry;
}

// ── Password Generator ──────────────────────────────────────────────────────

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Generate a cryptographically secure random password.
 */
export function generatePassword(options: GeneratorOptions): string {
  let charset = '';
  if (options.uppercase) charset += CHARSETS.uppercase;
  if (options.lowercase) charset += CHARSETS.lowercase;
  if (options.numbers) charset += CHARSETS.numbers;
  if (options.symbols) charset += CHARSETS.symbols;

  if (!charset) charset = CHARSETS.lowercase + CHARSETS.numbers;

  const randomValues = generateRandomBytes(options.length);
  let password = '';
  for (let i = 0; i < options.length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

/**
 * Calculate password strength (0-4).
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  score = Math.min(score, 4);

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#00D4FF'];

  return { score, label: labels[score], color: colors[score] };
}

// ── Generate Entry ID ───────────────────────────────────────────────────────

/**
 * Generate a random 32-byte hex string to use as an entry ID.
 */
export function generateEntryId(): string {
  const bytes = generateRandomBytes(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
