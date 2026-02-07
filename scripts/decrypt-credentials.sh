#!/usr/bin/env bash
#
# Google Cloud KMS を使って暗号化された認証情報を復号する
#
# 使い方:
#   ./scripts/decrypt-credentials.sh
#
# CI環境では GitHub Actions の Workload Identity Federation で認証後に実行される
#
set -euo pipefail

# 設定
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
KEYRING="${GCP_KMS_KEYRING:?GCP_KMS_KEYRING is required}"
KEY="${GCP_KMS_KEY:?GCP_KMS_KEY is required}"
LOCATION="${GCP_KMS_LOCATION:-asia-northeast1}"

ENCRYPTED_FILE="credentials/credentials.env.enc"
DECRYPTED_FILE=".env"

# 暗号化ファイルの存在確認
if [ ! -f "$ENCRYPTED_FILE" ]; then
  echo "エラー: $ENCRYPTED_FILE が見つかりません。"
  echo "先に encrypt-credentials.sh で暗号化してください。"
  exit 1
fi

# KMS で復号
echo "復号中: $ENCRYPTED_FILE -> $DECRYPTED_FILE"
gcloud kms decrypt \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --keyring="$KEYRING" \
  --key="$KEY" \
  --ciphertext-file="$ENCRYPTED_FILE" \
  --plaintext-file="$DECRYPTED_FILE"

echo "復号完了: $DECRYPTED_FILE"
