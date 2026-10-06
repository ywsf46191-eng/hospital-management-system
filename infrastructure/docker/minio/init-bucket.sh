#!/bin/sh
# Idempotent MinIO initialization: private bucket + least-privilege application user.
set -eu

mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null

mc mb --ignore-existing "local/$MINIO_BUCKET"
mc anonymous set none "local/$MINIO_BUCKET"

sed "s/__BUCKET__/$MINIO_BUCKET/g" /scripts/app-policy.template.json > /tmp/app-policy.json
mc admin policy create local hospital-app /tmp/app-policy.json

mc admin user add local "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
mc admin policy attach local hospital-app --user "$MINIO_ACCESS_KEY" 2>/dev/null || true

echo "MinIO initialized: bucket '$MINIO_BUCKET' (private), application user attached to policy 'hospital-app'."
