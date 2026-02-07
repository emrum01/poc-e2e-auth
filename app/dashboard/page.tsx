"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Providers } from "../providers";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>読み込み中...</p>;
  }

  if (!session) {
    return null;
  }

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 data-testid="dashboard-title">ダッシュボード</h1>
      <p data-testid="welcome-message">
        ようこそ、{session.user?.name}さん
      </p>
      <p>認証に成功しました。このページは保護されたページです。</p>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Providers>
      <DashboardContent />
    </Providers>
  );
}
