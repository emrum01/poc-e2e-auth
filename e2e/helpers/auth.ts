import { Page, expect } from "@playwright/test";

/**
 * Google OAuth ログインフローを自動化する
 *
 * 注意: Googleはbot検出が厳しいため、以下の対策が必要:
 * - テスト専用のGoogleアカウントを使用
 * - 2段階認証を無効にするか、App Passwordを使用
 * - 「安全性の低いアプリのアクセス」を許可（非推奨、代わりにApp Passwordを推奨）
 */
export async function loginWithGoogle(page: Page) {
  const email = process.env.TEST_GOOGLE_EMAIL;
  const password = process.env.TEST_GOOGLE_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_GOOGLE_EMAIL and TEST_GOOGLE_PASSWORD must be set in environment variables"
    );
  }

  // Googleログインボタンをクリック
  await page.getByTestId("google-signin-button").click();

  // Google OAuth 同意画面を待つ
  await page.waitForURL(/accounts\.google\.com/, { timeout: 15_000 });

  // メールアドレス入力
  await page.locator('input[type="email"]').fill(email);
  await page.locator("#identifierNext button").click();

  // パスワード入力画面を待つ
  await page.waitForSelector('input[type="password"]', {
    state: "visible",
    timeout: 10_000,
  });
  await page.locator('input[type="password"]').fill(password);
  await page.locator("#passwordNext button").click();

  // 同意画面が表示される場合はクリック（初回のみ）
  try {
    const allowButton = page.locator('button:has-text("Allow"), button:has-text("許可")');
    await allowButton.click({ timeout: 5_000 });
  } catch {
    // 同意画面が表示されない場合はスキップ
  }

  // リダイレクト完了を待つ
  await page.waitForURL(/localhost/, { timeout: 15_000 });
}

/**
 * LINE OAuth ログインフローを自動化する
 *
 * LINE Loginのテスト用アカウントで認証を行う
 */
export async function loginWithLine(page: Page) {
  const email = process.env.TEST_LINE_EMAIL;
  const password = process.env.TEST_LINE_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_LINE_EMAIL and TEST_LINE_PASSWORD must be set in environment variables"
    );
  }

  // LINEログインボタンをクリック
  await page.getByTestId("line-signin-button").click();

  // LINE OAuth 画面を待つ
  await page.waitForURL(/access\.line\.me/, { timeout: 15_000 });

  // メールアドレスでログインを選択（LINEアプリではなくメール認証）
  await page.locator('input[name="tid"]').fill(email);
  await page.locator('input[name="tpasswd"]').fill(password);
  await page.locator("button.MdBtn01Lnk01").click();

  // 権限同意画面が表示される場合
  try {
    const permitButton = page.locator(
      'button:has-text("許可する"), button:has-text("Allow"), .MdBtn01Lnk03'
    );
    await permitButton.click({ timeout: 5_000 });
  } catch {
    // 同意画面が表示されない場合はスキップ
  }

  // リダイレクト完了を待つ
  await page.waitForURL(/localhost/, { timeout: 15_000 });
}

/**
 * ログアウトする
 */
export async function logout(page: Page) {
  await page.getByTestId("signout-button").click();
  await expect(page.getByTestId("unauthenticated")).toBeVisible({
    timeout: 10_000,
  });
}
