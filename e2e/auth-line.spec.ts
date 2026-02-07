import { test, expect } from "@playwright/test";
import { loginWithLine, logout } from "./helpers/auth";

test.describe("LINE認証 E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("unauthenticated")).toBeVisible();
  });

  test("LINEログインボタンが表示される", async ({ page }) => {
    const button = page.getByTestId("line-signin-button");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("LINEでログイン");
  });

  test("LINEアカウントでログインできる", async ({ page }) => {
    await loginWithLine(page);

    // 認証後の状態を検証
    await expect(page.getByTestId("authenticated")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("user-name")).toBeVisible();
    await expect(page.getByTestId("auth-provider")).toContainText("line");
  });

  test("LINEログイン後にログアウトできる", async ({ page }) => {
    await loginWithLine(page);
    await expect(page.getByTestId("authenticated")).toBeVisible({
      timeout: 15_000,
    });

    await logout(page);
    await expect(page.getByTestId("unauthenticated")).toBeVisible();
  });
});
