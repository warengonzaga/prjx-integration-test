# Project X QA Test Suite

Integration tests for Project X (PRJX) using Playwright and Synpress for MetaMask wallet testing.

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
```

## Environment Variables

Optional - defaults are provided in the config files:

```env
SEED_PHRASE="test test test test test test test test test test test junk"
WALLET_PASSWORD="Tester@123"
RPC_URL="https://eth.llamarpc.com"
```

⚠️ **Never commit real wallet credentials!**

## Project Structure

```text
project-x-qa-test/
├── tests/
│   └── wallet-connection.spec.ts    # Wallet connection test
├── playwright.config.ts              # Playwright config
├── package.json                      # Dependencies
└── .env.example                      # Environment template
```

## Current Tests

- **Wallet Connection** - Connect MetaMask to PRJX website

## License

MIT
