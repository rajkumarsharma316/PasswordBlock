// ── Password Entry Types ────────────────────────────────────────────────────

export interface PasswordEntry {
  id: string; // 32-byte hex string used as entry_id on chain
  site: string;
  username: string;
  password: string;
  notes: string;
  category: PasswordCategory;
  createdAt: number; // unix timestamp ms
  updatedAt: number;
  favorite: boolean;
}

export type PasswordCategory =
  | 'social'
  | 'email'
  | 'banking'
  | 'shopping'
  | 'work'
  | 'gaming'
  | 'crypto'
  | 'other';

export const CATEGORY_META: Record<PasswordCategory, { label: string; icon: string; color: string }> = {
  social:   { label: 'Social',   icon: '👥', color: '#3B82F6' },
  email:    { label: 'Email',    icon: '📧', color: '#10B981' },
  banking:  { label: 'Banking',  icon: '🏦', color: '#F59E0B' },
  shopping: { label: 'Shopping', icon: '🛒', color: '#EC4899' },
  work:     { label: 'Work',     icon: '💼', color: '#8B5CF6' },
  gaming:   { label: 'Gaming',   icon: '🎮', color: '#EF4444' },
  crypto:   { label: 'Crypto',   icon: '🔐', color: '#00D4FF' },
  other:    { label: 'Other',    icon: '📁', color: '#6B7280' },
};

// ── Encrypted Payload ───────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string;         // base64
  salt: string;       // base64
}

// ── Wallet State ────────────────────────────────────────────────────────────

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  network: string | null;
  isDemo: boolean;
}

// ── App State ───────────────────────────────────────────────────────────────

export type AppView = 'landing' | 'unlock' | 'dashboard';

export interface VaultState {
  unlocked: boolean;
  masterKeyHash: string | null; // stored to verify master password on unlock
}
