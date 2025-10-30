import { test, expect, type Page, type Locator, type BrowserContext } from '@playwright/test';
import { bootstrap, Dappwright, MetaMaskWallet } from '@tenkeylabs/dappwright';
import { handleMetaMaskPopup, TIMEOUT } from './helpers/metamask';

const CONFIG = {
  seedPhrase: process.env.SEED_PHRASE || 'test test test test test test test test test test test junk',
  password: process.env.WALLET_PASSWORD || 'Tester@123',
  prjxSwapUrl: 'https://www.prjx.com/swap',
} as const;

/**
 * Page Object Model for PRJX Swap Page
 */
class PRJXSwapPage {
  constructor(private page: Page) {}

  get connectWalletButton(): Locator {
    return this.page.locator('button:has-text("CONNECT WALLET")');
  }

  getMetaMaskOption(): Locator {
    return this.page
      .locator('text=MetaMask')
      .or(this.page.locator('[alt*="MetaMask"]'))
      .or(this.page.locator('button:has-text("MetaMask")'))
      .first();
  }

  getWalletAddress(): Locator {
    return this.page.locator('body > div.fixed > nav > div > div > div > div > button');
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
}

test.describe('MetaMask Wallet Connection', () => {
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
  });

  test.afterAll(async () => {
    await context.close();
  });

  /**
   * Verifies MetaMask wallet connection flow
   * 
   * @remarks
   * Handles three MetaMask popup windows:
   * - Connection request (Next/Connect)
   * - Connection confirmation (Confirm/Connect)
   * - Sign-in request (Sign)
   */
  test('should connect wallet successfully', async () => {
    const prjxPage = new PRJXSwapPage(page);

    await prjxPage.navigate();
    await expect(prjxPage.connectWalletButton).toBeVisible({ timeout: TIMEOUT.LONG });
    
    await prjxPage.clickConnectWallet();
    
    await prjxPage.selectMetaMaskWallet();
    
    // Handle MetaMask popups (connection, confirmation, sign-in)
    await handleMetaMaskPopup(context, 'Next', 'Connect');
    await handleMetaMaskPopup(context, 'Confirm', 'Connect');
    await handleMetaMaskPopup(context, 'Sign', 'Confirm');
    
    const walletAddress = prjxPage.getWalletAddress();
    await expect(walletAddress).toBeVisible({ timeout: 20000 });
    
    await page.screenshot({ path: 'screenshots/wallet-connected.png', fullPage: true });
  });
});
