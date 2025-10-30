# Project X QA Test Suite

Integration tests for Project X (PRJX) using Playwright and dAppwright for MetaMask wallet testing.

## Prerequisites

- Node.js v20 (LTS)
- pnpm
- Test MetaMask wallet (never use real funds)

## Setup

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install

# Configure environment (optional)
cp .env.example .env
```

## Running Tests

```bash
pnpm test          # Headless mode
pnpm test:headed   # Visible browser
pnpm test:debug    # Debug mode
pnpm test:ui       # Interactive UI mode
```

## Environment Variables

Optional - defaults are provided in the test files. Copy `.env.example` to `.env` if you want to customize:

```env
SEED_PHRASE="test test test test test test test test test test test junk"
WALLET_PASSWORD="Tester@123"
RPC_URL="https://eth.llamarpc.com"
```

⚠️ **Never commit real wallet credentials! Use TEST WALLETS ONLY!**

## Project Structure

```text
project-x-qa-test/
├── tests/
│   ├── wallet-connection.spec.ts    # Wallet connection test
│   ├── referral-creation.spec.ts    # Referral creation test
│   └── helpers/
│       └── metamask.ts              # MetaMask helper functions
├── playwright.config.ts              # Playwright config
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── .env.example                      # Environment template
```

## Current Tests

- **Wallet Connection** - Connect wallet to Project X app
- **Create Referral** - Connect wallet and attempt to create referral link (didn't proceed as it requires X account)

## License

MIT
