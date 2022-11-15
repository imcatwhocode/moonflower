# Moonflower

Astonishingly simple PostgreSQL to S3 backup solution.

Currently, supports only PostgreSQL 14.

Features:

- Backup multiple databases
- Cron-like schedule or immediate backup at launch
- Symmetric backup encryption using GnuPG

Based on [f213/postgres-backup-s3](https://github.com/f213/postgres-backup-s3)

# Environment variables configuration

| Variable            | Required | Default   | Description                                                                     |
| ------------------- | -------- | --------- | ------------------------------------------------------------------------------- |
| PG_DATABASES        | ✅       | –         | List of databases to perform backup on. Format "database1 database2 database3"  |
| PG_HOST             | ✅       | -         | PostgreSQL host                                                                 |
| PG_PORT             | ❌       | 5432      | Database port                                                                   |
| PG_USER             | ✅       | -         | PostgreSQL username                                                             |
| PG_PASSWORD         | ✅       | -         | PostgreSQL password                                                             |
| PG_OPTS             | ❌       | –         | Additional pg_dump options to use                                               |
| S3_ENDPOINT         | ✅       | -         | S3 Endpoint                                                                     |
| S3_REGION           | ❌       | us-west-1 | S3 Region                                                                       |
| S3_BUCKET           | ✅       | -         | S3 Bucket                                                                       |
| S3_PATH             | ❌       | database  | S3 Path relative to a bucket's root                                             |
| S3_KEY_ID           | ✅       | -         | S3 Key ID                                                                       |
| S3_ACCESS_KEY       | ✅       | -         | S3 Access key                                                                   |
| S3_OPTS             | ❌       | -         | Additional opts for awscli                                                      |
| WEBHOOK_START       | ❌       | -         | We'll make a GET query to this URL before backing up                            |
| WEBHOOK_END         | ❌       | -         | GET query will be made to this URL after successful backup                      |
| ENCRYPTION_PASSWORD | ❌       | -         | Secret for GPG symmetric encryption                                             |
| SCHEDULE            | ❌       | **None**  | Cron-ish schedule. If empty or "**None**", single backup will start immediately |

# Schedule

Moonflower uses [odise/go-cron](https://github.com/odise/go-cron) scheduler built on top
of [robfig/cron](https://github.com/robfig/cron), which supports
[both "standard" and Quartz](https://github.com/robfig/cron#background---cron-spec-format) formats.

⚠️ However, "standard" format parser seems broken. Please use Quartz instead.

# Example

```sh
# Example with only required configuration & instant one-time backup
docker run --rm \
  -e PG_DATABASES="test testdb2" \
  -e PG_HOST="172.17.0.1" \
  -e PG_USER=postgres \
  -e PG_PASSWORD=toor \
  -e S3_ENDPOINT="https://s3.acme.foo.bar" \
  -e S3_BUCKET="pgs3-test" \
  -e S3_KEY_ID="xxxx" \
  -e S3_ACCESS_KEY="xxxx" \
  imcatwhocode/moonflower:14

# Example with backup every night at 01:00
# Notice the "/etc/localtime" mount – it's mapping your host timezone to the container
# Without this mount, container will always use the UTC+00:00 TZ
docker run --rm \
  -e SCHEDULE="0 0 1 * * *" \
  -v /etc/localtime:/etc/localtime:ro \
  -e PG_DATABASES="test testdb2" \
  -e PG_HOST="172.17.0.1" \
  -e PG_USER=postgres \
  -e PG_PASSWORD=toor \
  -e S3_ENDPOINT="https://s3.acme.foo.bar" \
  -e S3_REGION="ru-central-1" \
  -e S3_BUCKET="pgs3-test" \
  -e S3_KEY_ID="xxxx" \
  -e S3_ACCESS_KEY="xxxx" \
  -e ENCRYPTION_PASSWORD="test123"\
  -e "WEBHOOK_START=http://172.17.0.1:1337/start" \
  -e "WEBHOOK_SUCCESS=http://172.17.0.1:1337/success" \
  imcatwhocode/moonflower:14
```
