/**
 * PasswordBlock — StellarWalletsKit integration.
 *
 * Handles connecting multiple Stellar wallets (Freighter, xBull, etc.)
 * using a unified modal. Falls back to "demo mode" when needed.
 */

import { StellarWalletsKit, Networks } from './kit';

export interface WalletConnection {
  publicKey: string;
  network: string;
}

const UNLOCK_MESSAGE = 'PasswordBlock_Master_Key_v2'; 

/**
 * Sign a deterministic message to act as the encryption key.
 */
export async function signUnlockMessage(publicKey: string): Promise<string> {
  try {
    // In v2, we use signMessage for arbitrary strings
    const { signedMessage } = await StellarWalletsKit.signMessage(UNLOCK_MESSAGE, {
      address: publicKey
    });
    
    if (!signedMessage) throw new Error('Signature was empty');
    return signedMessage;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes('code: -1') || err.message.includes('closed') || err.message.includes('rejected')) {
        throw new Error('Wallet Signature Rejected: Please sign the message to unlock your vault.');
      }
      throw err;
    }
    throw new Error('Failed to sign unlock message.');
  }
}

/**
 * Connect to a wallet using the kit's modal and retrieve the user's public key + network.
 */
export async function connectWallet(): Promise<WalletConnection> {
  try {
    // Open v2 auth modal
    const { address } = await StellarWalletsKit.authModal();
    
    if (!address) {
      throw new Error('Failed to get address from wallet.');
    }

    return { publicKey: address, network: 'TESTNET' };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes('closed')) {
        throw new Error('Connection Canceled: The modal was closed.');
      }
      throw err;
    }
    throw new Error('Failed to connect to Stellar wallet.');
  }
}

/**
 * Get the current wallet address (if already connected).
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
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
