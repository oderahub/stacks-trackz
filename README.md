# 🔥 Proof of Presence

A daily habit tracker dApp built on Stacks blockchain. Users check in daily, log their activity (likes, comments), build streaks, and earn NFT badges for their consistency.

## Features

- **Daily Check-ins**: Check in once per day to maintain your streak
- **Activity Logging**: Track likes and comments
- **Streak Tracking**: Build consecutive day streaks (current & longest)
- **NFT Badges**: Earn SIP-009 compliant NFT badges for achievements:
  - 🔥 Week Warrior (7-day streak)
  - 🌟 Monthly Master (30-day streak)
  - 💯 Century Club (100-day streak)
  - 💬 Chatterbox (100 comments)
  - ❤️ Love Machine (500 likes)
  - 🏆 OG Presence (100 check-ins)
- **Leaderboard**: Track global stats (users can build frontends to index events)

## Project Structure

```
presence-protocol/
├── contracts/
│   ├── presence-badges.clar    # SIP-009 NFT contract for badges
│   └── presence-tracker.clar   # Core tracking logic
├── tests/
│   └── presence.test.ts        # Unit tests
├── frontend/
│   ├── src/
│   │   ├── lib/stacks.ts       # Stacks wallet & contract utilities
│   │   ├── App.tsx             # Main React component
│   │   ├── App.css             # Styles
│   │   └── main.tsx            # Entry point
│   ├── index.html
│   └── package.json
├── settings/
│   ├── Devnet.toml             # Local development
│   ├── Testnet.toml            # Testnet deployment
│   └── Mainnet.toml            # Mainnet deployment
├── Clarinet.toml               # Clarinet configuration
└── package.json                # Root package.json for tests
```

## Prerequisites

- [Clarinet](https://github.com/stx-labs/clarinet) - Clarity development environment
- [Node.js](https://nodejs.org/) (v18+)
- A Stacks wallet (e.g., [Leather](https://leather.io/) or [Xverse](https://www.xverse.app/))

## Quick Start

### 1. Install Clarinet

```bash
# macOS
brew install clarinet

# Windows
winget install clarinet

# Or from source
cargo install clarinet
```

### 2. Clone and Setup

```bash
cd presence-protocol
npm install
```

### 3. Test the Contracts

```bash
# Check contract syntax
clarinet check

# Run unit tests
npm run test

# Interactive REPL
clarinet console
```

### 4. Deploy to Testnet

#### Get Testnet Tokens
1. Go to [Hiro Platform](https://platform.hiro.so/) and create an account
2. Navigate to the Faucet tab
3. Request testnet STX to your wallet address

#### Configure Deployment
Edit `settings/Testnet.toml`:
```toml
[accounts.deployer]
mnemonic = "your twelve word seed phrase goes here"
derivation = "m/44'/5757'/0'/0/0"
```

#### Deploy
```bash
# Generate deployment plan
clarinet deployments generate --testnet --medium-cost

# Deploy contracts
clarinet deployments apply --testnet
```

#### After Deployment
1. Note your deployed contract addresses
2. Call `set-authorized-minter` on `presence-badges` to allow `presence-tracker` to mint:
   ```clarity
   (contract-call? .presence-badges set-authorized-minter 'YOUR_ADDRESS.presence-tracker)
   ```

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Update `src/lib/stacks.ts` with your deployed contract address:
```typescript
export const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_ADDRESS';
export const NETWORK = 'testnet'; // or 'mainnet'
```

## Contract Functions

### presence-tracker.clar

#### Public Functions
| Function | Description |
|----------|-------------|
| `(check-in)` | Daily check-in, updates streak |
| `(log-likes (count uint))` | Log like activity |
| `(log-comments (count uint))` | Log comment activity |
| `(claim-badge (badge-type uint))` | Claim NFT badge if eligible |

#### Read-Only Functions
| Function | Description |
|----------|-------------|
| `(get-user-stats (user principal))` | Get all stats for a user |
| `(get-streak (user principal))` | Get current streak |
| `(can-check-in (user principal))` | Check if user can check in |
| `(has-badge (user principal) (badge-type uint))` | Check if user owns badge |
| `(is-eligible-for-badge (user principal) (badge-type uint))` | Check eligibility |
| `(get-global-stats)` | Get total users and check-ins |

### presence-badges.clar (SIP-009)

#### Public Functions
| Function | Description |
|----------|-------------|
| `(transfer (id uint) (sender principal) (recipient principal))` | Transfer NFT |
| `(mint (recipient principal) (badge-type uint))` | Mint badge (authorized only) |

#### Read-Only Functions
| Function | Description |
|----------|-------------|
| `(get-last-token-id)` | Last minted token ID |
| `(get-token-uri (id uint))` | Metadata URI for token |
| `(get-owner (id uint))` | Owner of token |
| `(get-badge-type (id uint))` | Badge type of token |

## Badge Types

| ID | Name | Requirement |
|----|------|-------------|
| 1 | Week Warrior | 7-day streak |
| 2 | Monthly Master | 30-day streak |
| 3 | Century Club | 100-day streak |
| 4 | Chatterbox | 100 total comments |
| 5 | Love Machine | 500 total likes |
| 6 | OG Presence | 100 total check-ins |

## Frontend Integration

The frontend uses `@stacks/connect` for wallet connection and `@stacks/transactions` for contract calls.

### Connect Wallet
```typescript
import { connect } from '@stacks/connect';

const response = await connect();
const stxAddress = response.addresses.find(a => a.symbol === 'STX')?.address;
```

### Call Contract
```typescript
import { request } from '@stacks/connect';
import { Cl } from '@stacks/transactions';

// Check in
const result = await request('stx_callContract', {
  contract: 'ADDRESS.presence-tracker',
  functionName: 'check-in',
  functionArgs: [],
  network: 'testnet',
});
```

### Read Contract
```typescript
import { fetchCallReadOnlyFunction, Cl, cvToValue } from '@stacks/transactions';

const result = await fetchCallReadOnlyFunction({
  contractAddress: 'ADDRESS',
  contractName: 'presence-tracker',
  functionName: 'get-user-stats',
  functionArgs: [Cl.principal(userAddress)],
  network: 'testnet',
  senderAddress: userAddress,
});

const stats = cvToValue(result);
```

## Deploy to Mainnet

1. Get mainnet STX for deployment fees
2. Update `settings/Mainnet.toml` with your mainnet mnemonic
3. Deploy:
   ```bash
   clarinet deployments generate --mainnet --medium-cost
   clarinet deployments apply --mainnet
   ```
4. Update frontend to use `'mainnet'` network

## Building a Leaderboard

The contract emits events on every action. Use [Chainhooks](https://docs.hiro.so/en/tools/chainhooks) to index events and build a leaderboard:

```json
{
  "if_this": {
    "scope": "contract_call",
    "contract_identifier": "YOUR_ADDRESS.presence-tracker",
    "method": "check-in"
  },
  "then_that": {
    "http_post": {
      "url": "https://your-api.com/webhook"
    }
  }
}
```

## Resources

- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Book](https://book.clarity-lang.org)
- [Stacks.js Reference](https://stacks.js.org)
- [Hiro Platform](https://platform.hiro.so)

## License

MIT
