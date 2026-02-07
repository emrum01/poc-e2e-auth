#!/usr/bin/env bash
#
# Google Cloud KMS のキーリングとキーを初期セットアップするスクリプト
#
# 使い方:
#   GCP_PROJECT_ID=your-project GCP_KMS_KEYRING=e2e-auth GCP_KMS_KEY=credentials ./scripts/setup-kms.sh
#
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
KEYRING="${GCP_KMS_KEYRING:?GCP_KMS_KEYRING is required}"
KEY="${GCP_KMS_KEY:?GCP_KMS_KEY is required}"
LOCATION="${GCP_KMS_LOCATION:-asia-northeast1}"

# GitHub Actions の Workload Identity Federation 用サービスアカウント
SA_NAME="${GCP_SA_NAME:-github-actions-e2e}"

echo "=== Google Cloud KMS セットアップ ==="
echo "プロジェクト: $PROJECT_ID"
echo "ロケーション: $LOCATION"
echo "キーリング: $KEYRING"
echo "キー: $KEY"
echo ""

# KMS API を有効化
echo "1. Cloud KMS API を有効化..."
gcloud services enable cloudkms.googleapis.com --project="$PROJECT_ID"

# キーリングの作成
echo "2. キーリングを作成..."
gcloud kms keyrings create "$KEYRING" \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  2>/dev/null || echo "  (既に存在します)"

# 暗号化キーの作成
echo "3. 暗号化キーを作成..."
gcloud kms keys create "$KEY" \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --keyring="$KEYRING" \
  --purpose="encryption" \
  2>/dev/null || echo "  (既に存在します)"

# Workload Identity Federation のセットアップ
echo "4. Workload Identity Federation をセットアップ..."

# サービスアカウント作成
gcloud iam service-accounts create "$SA_NAME" \
  --project="$PROJECT_ID" \
  --display-name="GitHub Actions E2E Test" \
  2>/dev/null || echo "  サービスアカウント: 既に存在します"

SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# KMS 復号権限を付与
echo "5. KMS 復号権限を付与..."
gcloud kms keys add-iam-policy-binding "$KEY" \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --keyring="$KEYRING" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudkms.cryptKeyDecrypter" \
  2>/dev/null || echo "  (既に付与済み)"

# Workload Identity Pool の作成
echo "6. Workload Identity Pool を作成..."
gcloud iam workload-identity-pools create "github-pool" \
  --project="$PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool" \
  2>/dev/null || echo "  (既に存在します)"

# Workload Identity Provider の作成
echo "7. Workload Identity Provider を作成..."
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="$PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  2>/dev/null || echo "  (既に存在します)"

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "GitHub Actions のシークレットに以下を設定してください:"
echo "  GCP_PROJECT_ID: $PROJECT_ID"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER: projects/<project-number>/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
echo "  GCP_SERVICE_ACCOUNT: $SA_EMAIL"
echo "  GCP_KMS_KEYRING: $KEYRING"
echo "  GCP_KMS_KEY: $KEY"
echo "  GCP_KMS_LOCATION: $LOCATION"
