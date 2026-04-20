/**
 * PasswordBlock — useWallet hook.
 *
 * Manages wallet connection state and provides connect/disconnect actions.
 * Falls back to demo mode when Freighter is not available.
 */

import { useState, useCallback } from 'react';
import type { WalletState } from '../types';
import { connectWallet, isFreighterInstalled, shortenAddress, signUnlockMessage } from '../stellar/wallet';

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
      const installed = await isFreighterInstalled();
      if (!installed) {
        // Enter demo mode
        const demoSignature = btoa(`DEMO_SIGNATURE_FOR_${DEMO_PUBLIC_KEY}`);
        setWallet({
          connected: true,
          publicKey: DEMO_PUBLIC_KEY,
          network: 'DEMO',
          signature: demoSignature,
          isDemo: true,
        });
        return;
      }

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
