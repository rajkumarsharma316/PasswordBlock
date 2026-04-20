/**
 * PasswordBlock — Application entry point.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { StellarWalletsKit, Networks } from '@creit-tech/stellar-wallets-kit';
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';
import App from './App';
import './index.css';

// Initialize StellarWalletsKit Global Singleton
StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: defaultModules(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
