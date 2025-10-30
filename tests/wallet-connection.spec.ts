import { test, expect, chromium, type BrowserContext, type Page, type Locator } from '@playwright/test';
import path from 'path';

// Environment configuration
const CONFIG = {
  seedPhrase: process.env.SEED_PHRASE || 'test test test test test test test test test test test junk',
  password: process.env.WALLET_PASSWORD || 'Tester@123',
  prjxSwapUrl: 'https://www.prjx.com/swap',
  metamaskExtensionPath: path.join(__dirname, '../metamask-extension'),
} as const;

// Timeout configuration
const TIMEOUT = {
  SHORT: 1000,
  MEDIUM: 3000,
  LONG: 10000,
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
    return this.page.locator('button').filter({ hasText: /0x[a-fA-F0-9]{4}/ }).first();
  }

  async navigate(): Promise<void> {
    await this.page.goto(CONFIG.prjxSwapUrl);
    await this.page.waitForLoadState('networkidle');
  }

  async clickConnectWallet(): Promise<void> {
    await this.connectWalletButton.click();
  }

  async selectMetaMaskWallet(): Promise<void> {
    const metamaskOption = this.getMetaMaskOption();
    await expect(metamaskOption).toBeVisible({ timeout: TIMEOUT.LONG });
    await metamaskOption.click();
  }

  async isWalletConnected(): Promise<boolean> {
    return this.getWalletAddress().isVisible({ timeout: TIMEOUT.LONG });
  }
}

/**
 * Page Object Model for MetaMask Popup
 */
class MetaMaskPopup {
  constructor(private page: Page) {}

  get nextButton(): Locator {
    return this.page.locator('button:has-text("Next")');
  }

  get connectButton(): Locator {
    return this.page.locator('button:has-text("Connect")');
  }

  async approveConnection(): Promise<void> {
    await this.page.waitForLoadState('load');
    
    // Click Next if available
    if (await this.nextButton.isVisible({ timeout: TIMEOUT.MEDIUM })) {
      await this.nextButton.click();
      await this.page.waitForTimeout(500);
    }

    // Click Connect
    await expect(this.connectButton).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await this.connectButton.click();
  }
}

/**
 * Browser helper utilities
 */
class BrowserHelper {
  static async launchWithMetaMask() {
    return chromium.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${CONFIG.metamaskExtensionPath}`,
        `--load-extension=${CONFIG.metamaskExtensionPath}`,
      ],
    });
  }

  static async findMetaMaskPopup(context: BrowserContext): Promise<Page | null> {
    const pages = context.pages();
    const metamaskPage = pages.find(p => {
      const url = p.url();
      return url.includes('notification') || url.includes('metamask');
    });
    
    return metamaskPage || null;
  }
}

test.describe('MetaMask Wallet Connection', () => {
  test('should connect wallet to PRJX successfully', async () => {
    const browser = await BrowserHelper.launchWithMetaMask();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Arrange - Initialize page objects
      const prjxPage = new PRJXSwapPage(page);

      // Act - Navigate and initiate connection
      await prjxPage.navigate();
      await expect(prjxPage.connectWalletButton).toBeVisible({ timeout: TIMEOUT.LONG });
      await prjxPage.clickConnectWallet();

      // Wait for wallet modal
      await page.waitForTimeout(TIMEOUT.SHORT);
      await prjxPage.selectMetaMaskWallet();

      // Handle MetaMask popup
      await page.waitForTimeout(TIMEOUT.MEDIUM);
      const metamaskPopupPage = await BrowserHelper.findMetaMaskPopup(context);
      
      if (!metamaskPopupPage) {
        throw new Error('MetaMask popup window not found');
      }

      const metamaskPopup = new MetaMaskPopup(metamaskPopupPage);
      await metamaskPopup.approveConnection();

      // Assert - Verify connection
      await page.bringToFront();
      await page.waitForTimeout(TIMEOUT.MEDIUM);
      
      const isConnected = await prjxPage.isWalletConnected();
      expect(isConnected).toBe(true);

      // Allow time to observe results
      await page.waitForTimeout(TIMEOUT.LONG);
    } finally {
      await browser.close();
    }
  });
});
