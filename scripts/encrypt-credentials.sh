#!/usr/bin/env bash
#
# Google Cloud KMS を使って認証情報を暗号化し、リポジトリに保存する
#
# 使い方:
#   1. .env ファイルに認証情報を記載
#   2. このスクリプトを実行: ./scripts/encrypt-credentials.sh
#   3. 暗号化されたファイル credentials/credentials.env.enc をコミット
#
# 前提条件:
#   - gcloud CLI がインストール済み
#   - gcloud auth login 済み
#   - KMS キーリング・キーが作成済み
#
set -euo pipefail

# 設定（環境変数から取得、またはデフォルト値を使用）
PROJECT_ID="${GCP_PROJECT_ID:?GCP_PROJECT_ID is required}"
KEYRING="${GCP_KMS_KEYRING:?GCP_KMS_KEYRING is required}"
KEY="${GCP_KMS_KEY:?GCP_KMS_KEY is required}"
LOCATION="${GCP_KMS_LOCATION:-asia-northeast1}"

PLAINTEXT_FILE=".env"
ENCRYPTED_FILE="credentials/credentials.env.enc"

# .env ファイルの存在確認
if [ ! -f "$PLAINTEXT_FILE" ]; then
  echo "エラー: $PLAINTEXT_FILE が見つかりません。"
  echo ".env.example を参考に .env ファイルを作成してください。"
  exit 1
fi

# credentials ディレクトリを作成
mkdir -p credentials

# KMS で暗号化
echo "暗号化中: $PLAINTEXT_FILE -> $ENCRYPTED_FILE"
gcloud kms encrypt \
  --project="$PROJECT_ID" \
  --location="$LOCATION" \
  --keyring="$KEYRING" \
  --key="$KEY" \
  --plaintext-file="$PLAINTEXT_FILE" \
  --ciphertext-file="$ENCRYPTED_FILE"

echo "暗号化完了: $ENCRYPTED_FILE"
echo ""
echo "次のステップ:"
echo "  git add $ENCRYPTED_FILE"
echo "  git commit -m 'chore: update encrypted credentials'"
echo "  git push"
