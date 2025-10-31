# PRJX Integration Test Suite

Automated end-to-end testing for PRJX platform using Playwright and dAppwright for Web3 wallet interactions.

## Prerequisites

- Node.js v20+
- pnpm
- Test MetaMask wallet (never use real funds)

## Quick Start

```bash
# Install dependencies
pnpm install

# Install browsers
pnpm exec playwright install

# Configure environment (optional)
cp .env.example .env

# Run tests
pnpm test          # Headless mode
pnpm test:headed   # Visible browser
```

## Environment Variables

Optional - defaults provided. Create `.env` to customize:

```env
# MetaMask (test wallet only!)
SEED_PHRASE="test test test test test test test test test test test junk"
WALLET_PASSWORD="Tester@123"

# Swap amount (optional, default: 1)
SWAP_AMOUNT="0.5"
```

⚠️ **Never use real credentials or commit `.env` file**

## Tests

### ✅ Wallet Connection

Connects MetaMask wallet to PRJX platform

### ✅ Referral Creation

Opens referral dialog and verifies X connection requirement

### ✅ Swap/Bridge

Complete USDC swap transaction across networks

- Configurable swap amounts
- Conditional MetaMask approvals (1-2 popups)
- Full screenshot documentation

## Project Structure

```text
tests/
├── wallet-connection.spec.ts    # Wallet connection
├── referral-creation.spec.ts    # Referral dialog
├── swap.spec.ts                 # Token swap/bridge
└── helpers/metamask.ts          # MetaMask utilities
```

## Troubleshooting

**MetaMask popup issues:**

- Ensure only one MetaMask extension installed
- Use test wallet with minimal funds

**Swap quote fails:**

- Use SWAP_AMOUNT >= 0.5
- Verify network connectivity

## License

MIT
