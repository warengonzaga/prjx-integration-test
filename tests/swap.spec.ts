import { test, expect, type BrowserContext, type Page, type Locator } from '@playwright/test';
import { bootstrap, Dappwright, MetaMaskWallet } from '@tenkeylabs/dappwright';
import { handleMetaMaskPopup, TIMEOUT } from './helpers/metamask';
import * as dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  seedPhrase: process.env.SEED_PHRASE || 'test test test test test test test test test test test junk',
  password: process.env.WALLET_PASSWORD || 'Tester@123',
  swapAmount: process.env.SWAP_AMOUNT || '1',
  prjxSwapUrl: 'https://www.prjx.com/swap',
} as const;

const TOKENS = {
  USDC_ADDRESS: '0xb883...630f',
  USDC_NAME: 'USDC',
} as const;

const NETWORKS = {
  BASE: 'Base',
} as const;

const WAIT_TIMES = {
  QUOTE_GENERATION: 10000,
  METAMASK_POPUP: 5000,
  BRIDGE_CHECK: 5000,
} as const;

/**
 * Page Object Model for PRJX Swap Page
 */
class PRJXSwapPage {
  constructor(private page: Page) {}

  get connectWalletButton(): Locator {
    return this.page.locator('button:has-text("CONNECT WALLET")');
  }

  get sellTokenButton(): Locator {
    return this.page.locator('body > main > div > div > div > div > div > div > div:nth-child(2) > div > div > div > div > div:nth-child(2) > button').first();
  }

  get buyTokenButton(): Locator {
    return this.page.locator('body > main > div > div > div > div > div > div > div:nth-child(2) > div > div > div > div > div:nth-child(2) > button').nth(1);
  }

  get swapButton(): Locator {
    return this.page.locator('button:has-text("SWAP")');
  }

  get networkSelectorButton(): Locator {
    return this.page.locator('button:has-text("HyperEVM")').or(this.page.locator('button:has-text("Base")'));
  }

  get networkSearchInput(): Locator {
    return this.page.locator('input[placeholder*="Search"]').or(this.page.locator('input[type="text"]')).first();
  }

  get baseNetworkOption(): Locator {
    return this.page.locator('text=Base').first();
  }

  get usdcTokenOption(): Locator {
    return this.page.locator('text=USDC').or(this.page.locator('[alt="USDC"]')).or(this.page.getByText('USDC', { exact: false })).nth(0);
  }

  get sellAmountInput(): Locator {
    return this.page.locator('input[type="text"]').filter({ hasText: /^$/ }).first();
  }

  get walletAddress(): Locator {
    return this.page.locator('body > div.fixed > nav > div > div > div > div > button');
  }

  getMetaMaskOption(): Locator {
    return this.page
      .locator('text=MetaMask')
      .or(this.page.locator('[alt*="MetaMask"]'))
      .or(this.page.locator('button:has-text("MetaMask")'))
      .first();
  }

  async navigate(): Promise<void> {
    await this.page.goto(CONFIG.prjxSwapUrl, { waitUntil: 'load' });
  }

  async clickConnectWallet(): Promise<void> {
    await this.connectWalletButton.click();
  }

  async selectMetaMaskWallet(): Promise<void> {
    const metamaskOption = this.getMetaMaskOption();
    await expect(metamaskOption).toBeVisible({ timeout: TIMEOUT.LONG });
    await metamaskOption.click();
  }

  async clickSellTokenButton(): Promise<void> {
    await this.sellTokenButton.click();
  }

  async clickBuyTokenButton(): Promise<void> {
    await this.buyTokenButton.click();
  }

  async selectBaseNetwork(): Promise<void> {
    await this.networkSelectorButton.click();
    await this.page.waitForTimeout(1000);
    
    await this.networkSearchInput.fill(NETWORKS.BASE);
    await this.page.waitForTimeout(500);
    
    await this.baseNetworkOption.click();
    await this.page.waitForTimeout(1000);
  }

  async selectUSDCToken(): Promise<void> {
    await this.usdcTokenOption.click();
    await this.page.waitForTimeout(1000);
  }

  async selectUSDCForBuy(): Promise<void> {
    await this.page.waitForTimeout(1000);
    
    const searchInput = this.page.locator('input[placeholder="Search tokens"]');
    await searchInput.fill(TOKENS.USDC_NAME);
    await this.page.waitForTimeout(500);
    
    const usdcToken = this.page.locator(`text=${TOKENS.USDC_ADDRESS}`);
    await usdcToken.click();
    await this.page.waitForTimeout(1000);
  }

  async clickSwapButton(): Promise<void> {
    await this.swapButton.click();
  }

  async approveMetaMaskTransaction(context: BrowserContext): Promise<void> {
    await this.page.waitForTimeout(2000);
    await handleMetaMaskPopup(context, 'Confirm');
  }

  async waitForBridgingModal(): Promise<void> {
    const confirmBridgeText = this.page.locator('text=Confirm Bridge');
    await confirmBridgeText.waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForBridgingInProgress(): Promise<void> {
    const bridgingText = this.page.locator('text=Bridging...');
    await bridgingText.waitFor({ state: 'visible', timeout: 30000 });
  }

  async waitForSuccessModal(): Promise<void> {
    const prjxLogo = this.page.locator('text=PRJX');
    await prjxLogo.waitFor({ state: 'visible', timeout: 60000 });
  }

  async clickDoneButton(): Promise<void> {
    const doneButton = this.page.locator('body > div.fixed > div > div > div > div:nth-child(2) > button');
    await doneButton.click();
  }

  async enterSellAmount(amount: string): Promise<void> {
    await this.sellAmountInput.fill(amount);
  }
}

test.describe('Swap Functionality', () => {
  let wallet: Dappwright;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    [wallet, , context] = await bootstrap('', {
      wallet: 'metamask',
      version: MetaMaskWallet.recommendedVersion,
      seed: CONFIG.seedPhrase,
      headless: false,
      password: CONFIG.password,
    });

    page = await context.newPage();
    
    await page.goto(CONFIG.prjxSwapUrl, { waitUntil: 'load' });
    
    const connectWalletButton = page.locator('button:has-text("CONNECT WALLET")');
    await expect(connectWalletButton).toBeVisible({ timeout: TIMEOUT.LONG });
    await connectWalletButton.click();
    
    const metamaskOption = page
      .locator('text=MetaMask')
      .or(page.locator('[alt*="MetaMask"]'))
      .or(page.locator('button:has-text("MetaMask")'))
      .first();
    await expect(metamaskOption).toBeVisible({ timeout: TIMEOUT.LONG });
    await metamaskOption.click();
    
    await handleMetaMaskPopup(context, 'Next', 'Connect');
    await handleMetaMaskPopup(context, 'Confirm', 'Connect');
    await handleMetaMaskPopup(context, 'Sign', 'Confirm');
    
    const swapPage = new PRJXSwapPage(page);
    await expect(swapPage.walletAddress).toBeVisible({ timeout: 20000 });
  });

  test.afterAll(async () => {
    await context.close();
  });

  /**
   * Tests the complete swap/bridge flow from USDC to USDC across networks
   * 
   * @remarks
   * Flow:
   * 1. Select Sell token (USDC on Base network)
   * 2. Enter swap amount (configurable via SWAP_AMOUNT env var)
   * 3. Select Buy token (USDC on destination network)
   * 4. Approve MetaMask transaction
   * 5. Confirm bridge transaction
   * 6. Wait for bridge completion (detected by PRJX logo)
   * 7. Complete the swap
   */
  test('should complete swap and bridge transaction', async () => {
    const swapPage = new PRJXSwapPage(page);
    const swapAmount = CONFIG.swapAmount;
    
    await expect(swapPage.walletAddress).toBeVisible({ timeout: TIMEOUT.LONG });
    
    await expect(swapPage.sellTokenButton).toBeVisible({ timeout: TIMEOUT.LONG });
    await swapPage.clickSellTokenButton();
    await page.screenshot({ path: 'screenshots/swap-modal-opened.png', fullPage: true });
    
    await swapPage.selectBaseNetwork();
    await page.screenshot({ path: 'screenshots/swap-base-selected.png', fullPage: true });
    
    await swapPage.selectUSDCToken();
    await page.screenshot({ path: 'screenshots/swap-usdc-selected.png', fullPage: true });
    
    await swapPage.enterSellAmount(swapAmount);
    await page.screenshot({ path: 'screenshots/swap-amount-entered.png', fullPage: true });
    
    await expect(swapPage.buyTokenButton).toBeVisible({ timeout: TIMEOUT.LONG });
    await swapPage.clickBuyTokenButton();
    await page.screenshot({ path: 'screenshots/swap-buy-modal-opened.png', fullPage: true });
    
    await swapPage.selectUSDCForBuy();
    await page.screenshot({ path: 'screenshots/swap-buy-usdc-selected.png', fullPage: true });
    
    await page.waitForTimeout(WAIT_TIMES.QUOTE_GENERATION);
    await page.screenshot({ path: 'screenshots/swap-with-quote.png', fullPage: true });
    
    await expect(swapPage.swapButton).toBeVisible({ timeout: TIMEOUT.LONG });
    await swapPage.clickSwapButton();
    await page.waitForTimeout(WAIT_TIMES.METAMASK_POPUP);
    await page.screenshot({ path: 'screenshots/swap-metamask-popup.png', fullPage: true });
    
    await swapPage.approveMetaMaskTransaction(context);
    
    await swapPage.waitForBridgingModal();
    await page.screenshot({ path: 'screenshots/swap-confirm-bridge.png', fullPage: true });
    
    await page.waitForTimeout(WAIT_TIMES.BRIDGE_CHECK);
    
    const confirmBridgeStillVisible = await page.locator('text=Confirm Bridge').isVisible();
    const bridgingVisible = await page.locator('text=Bridging...').isVisible();
    
    if (bridgingVisible) {
      await page.screenshot({ path: 'screenshots/swap-bridging.png', fullPage: true });
    } else if (confirmBridgeStillVisible) {
      await swapPage.approveMetaMaskTransaction(context);
      await swapPage.waitForBridgingInProgress();
      await page.screenshot({ path: 'screenshots/swap-bridging.png', fullPage: true });
    }
    
    await swapPage.waitForSuccessModal();
    await page.screenshot({ path: 'screenshots/swap-success.png', fullPage: true });
    
    await swapPage.clickDoneButton();
    await page.screenshot({ path: 'screenshots/swap-completed.png', fullPage: true });
  });
});
