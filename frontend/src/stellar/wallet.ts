/**
 * PasswordBlock — Freighter wallet integration.
 *
 * Handles connecting/disconnecting the Freighter browser extension,
 * fetching public key and network. Falls back to "demo mode" when
 * Freighter is not available.
 */

import {
  requestAccess,
  isConnected,
  getNetwork,
} from '@stellar/freighter-api';

export interface WalletConnection {
  publicKey: string;
  network: string;
}

/**
 * Check if Freighter extension is installed and available.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    return await isConnected();
  } catch {
    return false;
  }
}

/**
 * Connect to Freighter and retrieve the user's public key + network.
 */
export async function connectWallet(): Promise<WalletConnection> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new Error(
      'Freighter wallet not found. Please install the Freighter browser extension.'
    );
  }

  try {
    // requestAccess returns the public key as a string
    const publicKey = await requestAccess();
    if (!publicKey) {
      throw new Error('Failed to get public key from Freighter.');
    }

    // getNetwork returns the network name as a string
    const network = await getNetwork();

    return { publicKey, network: network || 'TESTNET' };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to connect to Freighter wallet.');
  }
}

/**
 * Get the current wallet address (if already connected).
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const publicKey = await requestAccess();
    return publicKey || null;
  } catch {
    return null;
  }
}

/**
 * Shorten a Stellar address for display: GABCD...WXYZ
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
