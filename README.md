# PasswordBlock

PasswordBlock is a professional-grade, decentralized password management solution. It combines client-side industry-standard encryption with the Stellar blockchain to provide a "Zero-Knowledge" storage vault for your most sensitive credentials.

## 🚀 Key Features

- **Multi-Wallet Support**: Integrated with `StellarWalletsKit` for a seamless connection experience across **Freighter, xBull, Hana, and Albedo**.
- **On-Chain Persistence**: All vault metadata and encrypted entries are stored on the **Stellar Testnet** using high-performance Soroban smart contracts.
- **End-to-End Encryption**: Credentials are never sent in plain text. We use your unique wallet signature to derive a master key, ensuring only *you* can decrypt your data.
- **Real-Time Synchronization**: A sophisticated event-polling system ensures your vault is always in sync with the latest on-chain state.
- **Transaction Transparency**: Full visibility into every on-chain action with integrated links to the Stellar Expert explorer.
- **Robust Error Handling**: Graceful handling of wallet rejections, missing extensions, and network-level exceptions to ensure a smooth user experience.

## 🛠️ Technical Stack

- **Frontend**: React (Vite) + Tailwind-inspired Vanilla CSS aesthetics.
- **Blockchain**: Soroban (Rust) smart contracts.
- **Wallet SDK**: StellarWalletsKit v2 (Native JSR support).
- **Communication**: Soroban RPC with generated TypeScript bindings.

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- A Stellar wallet extension (e.g., [Freighter](https://www.freighter.app/))

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔗 Public Network Data

- **Deployed Contract ID**: `CDKMBJRDVC6G3QRIRS7ZBLG7RZHDGR5XDVFTBLVXWG4TUTRHPT6HWJJF`
- **Explorer Link**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDKMBJRDVC6G3QRIRS7ZBLG7RZHDGR5XDVFTBLVXWG4TUTRHPT6HWJJF)
- **Deployment Transaction**: [43848ced9218ac64ef4951bb4d344c7dc309c68743be5501c6852e4207022635](https://stellar.expert/explorer/testnet/tx/43848ced9218ac64ef4951bb4d344c7dc309c68743be5501c6852e4207022635)

## ⚖️ Security Model
PasswordBlock operates on a **Zero-Knowledge** architecture. Your master password/key is never stored on a server or on the blockchain. Instead, we use your hardware or software wallet to sign a deterministic "unlock message." The result of this signature is used as the AES-256-GCM encryption key to lock and unlock your data locally.
