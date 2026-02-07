import { test, expect } from "@playwright/test";
import { loginWithGoogle, logout } from "./helpers/auth";

test.describe("Google認証 E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("unauthenticated")).toBeVisible();
  });

  test("Googleログインボタンが表示される", async ({ page }) => {
    const button = page.getByTestId("google-signin-button");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Googleでログイン");
  });

  test("Googleアカウントでログインできる", async ({ page }) => {
    await loginWithGoogle(page);

    // 認証後の状態を検証
    await expect(page.getByTestId("authenticated")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("user-name")).toBeVisible();
    await expect(page.getByTestId("auth-provider")).toContainText("google");
  });

  test("Googleログイン後にログアウトできる", async ({ page }) => {
    await loginWithGoogle(page);
    await expect(page.getByTestId("authenticated")).toBeVisible({
      timeout: 15_000,
    });

    await logout(page);
    await expect(page.getByTestId("unauthenticated")).toBeVisible();
  });
});
