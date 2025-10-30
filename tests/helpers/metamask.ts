import { expect, type BrowserContext } from '@playwright/test';

export const TIMEOUT = {
  SHORT: 1000,
  MEDIUM: 3000,
  LONG: 10000,
} as const;

/**
 * Handles MetaMask popup windows with auto-wait
 * 
 * @param context - Browser context containing popup pages
 * @param buttonTexts - Text options for the action button
 * 
 * @example
 * await handleMetaMaskPopup(context, 'Next', 'Connect');
 * await handleMetaMaskPopup(context, 'Confirm', 'Connect');
 * await handleMetaMaskPopup(context, 'Sign', 'Confirm');
 */
export async function handleMetaMaskPopup(context: BrowserContext, ...buttonTexts: string[]): Promise<void> {
  try {
    const popup = await context.waitForEvent('page', { 
      predicate: page => page.url().includes('notification'),
      timeout: TIMEOUT.LONG 
    });
    
    await popup.waitForLoadState('load');
    
    const buttonSelector = buttonTexts.map(text => `button:has-text("${text}")`).join(', ');
    const button = popup.locator(buttonSelector).first();
    
    await expect(button).toBeVisible({ timeout: TIMEOUT.MEDIUM });
    await button.click();
    await popup.waitForEvent('close', { timeout: TIMEOUT.MEDIUM }).catch(() => {});
  } catch (error) {
    // If popup doesn't appear, check if it already exists
    const pages = context.pages();
    const existingPopup = pages.find(p => p.url().includes('notification'));
    
    if (existingPopup) {
      const buttonSelector = buttonTexts.map(text => `button:has-text("${text}")`).join(', ');
      const button = existingPopup.locator(buttonSelector).first();
      
      if (await button.isVisible({ timeout: TIMEOUT.SHORT })) {
        await button.click();
      }
    }
  }
}
