import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { bootstrap, Dappwright, MetaMaskWallet } from '@tenkeylabs/dappwright';
import { handleMetaMaskPopup, TIMEOUT } from './helpers/metamask';

const CONFIG = {
  seedPhrase: process.env.SEED_PHRASE || 'test test test test test test test test test test test junk',
  password: process.env.WALLET_PASSWORD || 'Tester@123',
  portfolioUrl: 'https://www.prjx.com/portfolio',
} as const;

const URLS = {
  SWAP: 'https://www.prjx.com/swap',
  PORTFOLIO: CONFIG.portfolioUrl,
} as const;

/**
 * Page Object Model for PRJX Portfolio Page
 */
class PRJXPortfolioPage {
  constructor(private page: Page) {}

  get createReferralButton(): ReturnType<Page['locator']> {
    return this.page.locator('body > main > div > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > button');
  }

  get createReferralDialog(): ReturnType<Page['locator']> {
    return this.page.locator('text=Create Referral');
  }

  get connectXButton(): ReturnType<Page['locator']> {
    return this.page.locator('button:has-text("Connect your X")');
  }

  get eligibilityMessage(): ReturnType<Page['locator']> {
    return this.page.locator('text=Must have 100+ followers');
  }

  get walletAddress(): ReturnType<Page['locator']> {
    return this.page.locator('body > div.fixed > nav > div > div > div > div > button');
  }

  async navigate(): Promise<void> {
    await this.page.goto(CONFIG.portfolioUrl, { waitUntil: 'load' });
  }

  async clickCreateReferral(): Promise<void> {
    await this.createReferralButton.click();
  }
}

test.describe('Referral Creation Flow', () => {
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
    
    // Connect wallet once before all tests in this suite
    await page.goto(URLS.SWAP, { waitUntil: 'load' });
    
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
    
    // Handle MetaMask popups (connection, confirmation, sign-in)
    await handleMetaMaskPopup(context, 'Next', 'Connect');
    await handleMetaMaskPopup(context, 'Confirm', 'Connect');
    await handleMetaMaskPopup(context, 'Sign', 'Confirm');
    
    const portfolioPage = new PRJXPortfolioPage(page);
    await expect(portfolioPage.walletAddress).toBeVisible({ timeout: 20000 });
  });

  test.afterAll(async () => {
    await context.close();
  });

  /**
   * Verifies referral creation dialog with X connection requirement
   * 
   * @remarks
   * Wallet is already connected in beforeAll hook
   */
  test('should open referral creation dialog with X connection requirement', async () => {
    const portfolioPage = new PRJXPortfolioPage(page);
    
    await expect(portfolioPage.walletAddress).toBeVisible({ timeout: TIMEOUT.LONG });
    
    await portfolioPage.navigate();
    
    await expect(portfolioPage.createReferralButton).toBeVisible({ timeout: TIMEOUT.LONG });
    await portfolioPage.clickCreateReferral();
    
    await expect(portfolioPage.createReferralDialog).toBeVisible({ timeout: TIMEOUT.LONG });
    await expect(portfolioPage.connectXButton).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await expect(portfolioPage.eligibilityMessage).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    
    await page.screenshot({ path: 'screenshots/referral-dialog.png', fullPage: true });
  });
});
