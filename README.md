# POC: E2E Authentication Test (LINE / Google)

LINE認証・Google認証のE2Eテストを GitHub Actions CI で実行する POC。
認証情報は Google Cloud KMS で暗号化してリポジトリに保存する。

## アーキテクチャ

```
┌─────────────────────────────────────────────────┐
│  GitHub Actions CI                              │
│                                                 │
│  1. Workload Identity Federation で GCP 認証    │
│  2. Cloud KMS で credentials.env.enc を復号     │
│  3. Next.js アプリを起動                        │
│  4. Playwright で LINE/Google 認証の E2E テスト │
└─────────────────────────────────────────────────┘
```

## 技術スタック

- **Web App**: Next.js 16 (App Router)
- **認証**: NextAuth.js (Google / LINE OAuth)
- **E2E テスト**: Playwright
- **CI/CD**: GitHub Actions
- **ホスティング**: Cloudflare Pages (@opennextjs/cloudflare)
- **秘密情報管理**: Google Cloud KMS + Workload Identity Federation

## セットアップ

### 1. 前提条件

- Node.js 20+
- Google Cloud プロジェクト (KMS API 有効)
- Google OAuth クライアント ID/Secret
- LINE Login チャネル ID/Secret
- テスト用アカウント (Google, LINE)

### 2. Google Cloud KMS セットアップ

```bash
export GCP_PROJECT_ID=your-project
export GCP_KMS_KEYRING=e2e-auth
export GCP_KMS_KEY=credentials
export GCP_KMS_LOCATION=asia-northeast1

# KMS キーリング・キー・Workload Identity Federation を一括セットアップ
./scripts/setup-kms.sh
```

### 3. 認証情報の暗号化

```bash
# .env.example を参考に .env を作成
cp .env.example .env
# 各値を実際の認証情報に書き換え

# KMS で暗号化
./scripts/encrypt-credentials.sh

# 暗号化ファイルをコミット
git add credentials/credentials.env.enc
git commit -m "chore: add encrypted credentials"
```

### 4. GitHub Actions シークレット設定

リポジトリの Settings > Secrets and variables > Actions に以下を設定:

| シークレット名 | 値 |
|---|---|
| `GCP_PROJECT_ID` | GCP プロジェクト ID |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<number>/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `github-actions-e2e@<project>.iam.gserviceaccount.com` |
| `GCP_KMS_KEYRING` | KMS キーリング名 |
| `GCP_KMS_KEY` | KMS キー名 |
| `GCP_KMS_LOCATION` | KMS ロケーション (例: `asia-northeast1`) |

### 5. Cloudflare デプロイ設定

GitHub Secrets に追加:

| シークレット名 | 値 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン (Edit Workers権限) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare アカウント ID |

また、Cloudflare ダッシュボードで以下の環境変数(Secrets)を設定:

```
NEXTAUTH_SECRET, NEXTAUTH_URL,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
LINE_CLIENT_ID, LINE_CLIENT_SECRET
```

### 6. ローカル開発

```bash
npm install
npx playwright install chromium

# .env ファイルを設定した状態で
npm run dev

# Cloudflare ローカルプレビュー
npm run build:cf && npm run preview:cf

# E2E テスト実行
npx playwright test
```

## E2E テストの仕組み

### Google 認証テスト (`e2e/auth-google.spec.ts`)

1. トップページでGoogleログインボタンをクリック
2. Googleの OAuth 同意画面でテストアカウントの認証情報を入力
3. リダイレクト後、ログイン状態を検証

### LINE 認証テスト (`e2e/auth-line.spec.ts`)

1. トップページでLINEログインボタンをクリック
2. LINE Login画面でテストアカウントの認証情報を入力
3. リダイレクト後、ログイン状態を検証

## CI での認証情報フロー

```
暗号化 (ローカル)                    復号 (CI)
.env ──[KMS encrypt]──> .enc ──[git]──> .enc ──[KMS decrypt]──> .env
                         │                        ▲
                    リポジトリに保存          Workload Identity
                    (安全)                   Federation で認証
```

### セキュリティ上の考慮事項

- 平文の `.env` は `.gitignore` に含まれ、コミットされない
- 暗号化ファイルのみリポジトリに保存
- CI では Workload Identity Federation でキーレス認証（サービスアカウントキー不要）
- KMS の復号権限は CI 用サービスアカウントのみに付与
- テスト用アカウントには本番データへのアクセス権限を付与しない

## 既知の制約・注意事項

- **Google**: bot検出により認証フローがブロックされる可能性あり。テスト専用アカウントで2段階認証を無効にすることを推奨
- **LINE**: LINE Loginの仕様変更によりセレクタの調整が必要になる場合あり
- OAuth プロバイダーの UI 変更により E2E テストが壊れる可能性があるため、定期的なメンテナンスが必要
