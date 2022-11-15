#!/bin/bash
set -e
set -o pipefail

envShouldHas() {
  if [ "$(printenv $1)" = "**None**" ]; then
    >&2 echo "Environment variable \$$1 should be declared"
    exit 1
  fi
}

log() {
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] $*"
}

envShouldHas PG_DATABASES
envShouldHas PG_HOST
envShouldHas PG_PORT
envShouldHas PG_USER
envShouldHas PG_PASSWORD

envShouldHas S3_ENDPOINT
envShouldHas S3_BUCKET
envShouldHas S3_ACCESS_KEY_ID
envShouldHas S3_ACCESS_ACCESS_KEY

export PGPASSWORD=$PG_PASSWORD

export AWS_ACCESS_KEY_ID=$S3_KEY_ID
export AWS_SECRET_ACCESS_KEY=$S3_ACCESS_KEY
export AWS_DEFAULT_REGION=$S3_REGION

if [ ! -z "$WEBHOOK_START" ]; then
  curl -fsS -m 10 --retry 5 $WEBHOOK_START \
  && log "Starting webhook sent" \
  ||:
fi

for DB in $PG_DATABASES; do
  log "Backing up \"$DB\""
  # Encrypted backup
  if [ ! -z "$ENCRYPTION_PASSWORD" ]; then
    # It's OK to use GPG's "--passphrase" as we're inside the container
    # where passphrase can also be obtained from environment variables
    pg_dump -h $PG_HOST -p $PG_PORT -U $PG_USER -Z 5 $PG_OPTS $DB \
    | gpg -q --passphrase $ENCRYPTION_PASSWORD --symmetric --batch \
    | aws --endpoint-url ${S3_ENDPOINT} $S3_OPTS s3 cp - s3://$S3_BUCKET/$S3_PATH/${DB}_$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql.gz.gpg
    log "Database \"$DB\" successfully backed up"

  # Plain backup
  else
    pg_dump -h $PG_HOST -p $PG_PORT -U $PG_USER -Z 5 $PG_OPTS $DB \
    | aws --endpoint-url ${S3_ENDPOINT} $S3_OPTS s3 cp - s3://$S3_BUCKET/$S3_PATH/${DB}_$(date -u +"%Y-%m-%dT%H:%M:%SZ").sql.gz || exit 2
    log "Database \"$DB\" successfully backed up"
  fi
done

if [ ! -z "$WEBHOOK_SUCCESS" ]; then
  curl -fsS -m 10 --retry 5 $WEBHOOK_SUCCESS \
  && log "Success webhook sent" \
  ||:
fi
