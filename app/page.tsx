"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Providers } from "./providers";

function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p data-testid="loading">読み込み中...</p>;
  }

  if (session) {
    return (
      <div data-testid="authenticated">
        <h2>ログイン済み</h2>
        <p data-testid="user-name">ユーザー名: {session.user?.name}</p>
        <p data-testid="user-email">メール: {session.user?.email}</p>
        <p data-testid="auth-provider">
          プロバイダー: {(session as any).provider ?? "不明"}
        </p>
        <button data-testid="signout-button" onClick={() => signOut()}>
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div data-testid="unauthenticated">
      <h2>ログインしてください</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "300px" }}>
        <button
          data-testid="google-signin-button"
          onClick={() => signIn("google")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Googleでログイン
        </button>
        <button
          data-testid="line-signin-button"
          onClick={() => signIn("line")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#06C755",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          LINEでログイン
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
        <h1>POC: E2E認証テスト</h1>
        <p>LINE認証・Google認証のCI E2Eテスト検証用</p>
        <hr style={{ margin: "20px 0" }} />
        <AuthButtons />
      </main>
    </Providers>
  );
}
