import { ReactNode } from "react";

export const metadata = {
  title: "POC E2E Auth - LINE & Google認証テスト",
  description: "LINE認証・Google認証のE2Eテスト用POC",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
