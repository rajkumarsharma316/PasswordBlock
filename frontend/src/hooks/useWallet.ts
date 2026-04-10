/**
 * PasswordBlock — useWallet hook.
 *
 * Manages wallet connection state and provides connect/disconnect actions.
 * Falls back to demo mode when Freighter is not available.
 */

import { useState, useCallback, useEffect } from 'react';
import type { WalletState } from '../types';
import { connectWallet, isFreighterInstalled, shortenAddress } from '../stellar/wallet';

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

  // Auto-detect Freighter on mount
  useEffect(() => {
    const check = async () => {
      const installed = await isFreighterInstalled();
      if (!installed) {
        // Auto-connect in demo mode
        setWallet({
          connected: true,
          publicKey: DEMO_PUBLIC_KEY,
          network: 'DEMO',
          isDemo: true,
        });
      }
    };
    check();
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        // Enter demo mode
        setWallet({
          connected: true,
          publicKey: DEMO_PUBLIC_KEY,
          network: 'DEMO',
          isDemo: true,
        });
        return;
      }

      const { publicKey, network } = await connectWallet();
      setWallet({
        connected: true,
        publicKey,
        network,
        isDemo: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      connected: false,
      publicKey: null,
      network: null,
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
