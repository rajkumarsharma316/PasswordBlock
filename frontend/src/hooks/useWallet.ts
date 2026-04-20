/**
 * PasswordBlock — useWallet hook.
 *
 * Manages wallet connection state and provides connect/disconnect actions.
 * Falls back to demo mode when Freighter is not available.
 */

import { useState, useCallback } from 'react';
import type { WalletState } from '../types';
import { connectWallet, shortenAddress, signUnlockMessage } from '../stellar/wallet';

const DEMO_PUBLIC_KEY = 'GDEMO000000000000000000000000000000000000000DEMOKEY';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    network: null,
    isDemo: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Current kit logic opens a modal. If it fails or is canceled, it throws.
      const { publicKey, network } = await connectWallet();
      const signature = await signUnlockMessage(publicKey);
      
      setWallet({
        connected: true,
        publicKey,
        network,
        signature,
        isDemo: false,
      });
    } catch (err: unknown) {
      if (err instanceof Error && (err.message.includes('Rejected') || err.message.includes('canceled'))) {
        // Just stop loading, don't show error if user just closed the modal
        setLoading(false);
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      
      // Fallback to demo mode if user wants? Or just show error.
      // For Yellow Belt, we want to show we handles errors.
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      publicKey: null,
      network: null,
      signature: null,
      isDemo: false,
    });
  }, []);

  return {
    wallet,
    loading,
    error,
    connect,
    disconnect,
    displayAddress: wallet.publicKey ? shortenAddress(wallet.publicKey) : null,
  };
}
