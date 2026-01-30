# Proof of Presence

A daily habit tracker dApp on Stacks blockchain. Check in daily, build streaks, and earn NFT badges.

## Live on Mainnet

| Contract | Address |
|----------|---------|
| presence-tracker | `SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG.presence-tracker` |
| presence-badges | `SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG.presence-badges` |

## Features

- **Daily Check-ins** - Maintain your streak with one check-in per day
- **Activity Tracking** - Log likes and comments
- **Streak System** - Track current and longest streaks
- **NFT Badges** - SIP-009 compliant badges for achievements

### Badges

| Badge | Requirement |
|-------|-------------|
| Week Warrior | 7-day streak |
| Monthly Master | 30-day streak |
| Century Club | 100-day streak |
| Chatterbox | 100 comments |
| Love Machine | 500 likes |
| OG Presence | 100 check-ins |

## Project Structure

```
presence-protocol/
├── contracts/
│   ├── presence-badges.clar    # SIP-009 NFT contract
│   └── presence-tracker.clar   # Core tracking logic
├── frontend/
│   └── src/lib/stacks.ts       # Wallet & contract utilities
├── settings/
│   ├── Devnet.toml
│   ├── Simnet.toml
│   └── Mainnet.toml
├── scripts/
│   └── set-minter.js           # Helper to authorize minter
└── Clarinet.toml               # Clarity 3, Epoch 3.0
```

## Quick Start

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet)
- [Node.js](https://nodejs.org/) v18+
- [Leather Wallet](https://leather.io/)

### Setup

```bash
git clone <repo>
cd presence-protocol
npm install
clarinet check
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Contract API

### presence-tracker

```clarity
;; Check in daily
(contract-call? .presence-tracker check-in)

;; Log activity
(contract-call? .presence-tracker log-likes u10)
(contract-call? .presence-tracker log-comments u5)

;; Claim badge (1-6)
(contract-call? .presence-tracker claim-badge u1)

;; Read functions
(contract-call? .presence-tracker get-user-stats 'SP...)
(contract-call? .presence-tracker can-check-in 'SP...)
(contract-call? .presence-tracker get-streak 'SP...)
(contract-call? .presence-tracker get-badge-status 'SP...)
```

### presence-badges (SIP-009)

```clarity
(contract-call? .presence-badges get-owner u1)
(contract-call? .presence-badges get-token-uri u1)
(contract-call? .presence-badges transfer u1 sender recipient)
```

## Frontend Integration

```typescript
import { connect, request } from '@stacks/connect';

// Connect wallet
const response = await connect();
const address = response.addresses.find(a => a.symbol === 'STX')?.address;

// Check in
await request('stx_callContract', {
  contract: 'SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG.presence-tracker',
  functionName: 'check-in',
  functionArgs: [],
});

// Claim badge
await request('stx_callContract', {
  contract: 'SP2FY55DK4NESNH6E5CJSNZP2CQ5PZ5BX64B29FYG.presence-tracker',
  functionName: 'claim-badge',
  functionArgs: ['u1'], // Week Warrior
});
```

## Deploy Your Own

### 1. Configure

Edit `settings/Mainnet.toml`:
```toml
[accounts.deployer]
mnemonic = "your 24 word phrase"
```

### 2. Deploy

```bash
clarinet deployments generate --mainnet --low-cost
clarinet deployments apply --mainnet
```

### 3. Authorize Minter

```bash
MNEMONIC="your phrase" node scripts/set-minter.js
```

Or manually:
```clarity
(contract-call? .presence-badges set-authorized-minter 'YOUR_ADDRESS.presence-tracker)
```

## Tech Stack

- **Blockchain**: Stacks (Clarity 3, Epoch 3.0)
- **NFT Standard**: SIP-009
- **Frontend**: React + Vite + TypeScript
- **Wallet**: @stacks/connect

## Resources

- [Stacks Docs](https://docs.stacks.co)
- [Clarity Book](https://book.clarity-lang.org)
- [Hiro Platform](https://platform.hiro.so)

## License

MIT
