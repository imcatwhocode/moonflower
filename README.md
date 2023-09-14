[![Stand With Ukraine](https://raw.githubusercontent.com/vshymanskyy/StandWithUkraine/main/banner2-direct.svg)](https://stand-with-ukraine.pp.ua)

# Moonflower
Quickly set up simple PostgreSQL databases backup to S3 in container environment.

Let's cut to the chase. Moonflower is cool because:
1. Simple configuration via environment variables. You'll set it up in minutes.
2. Supports both one-shot and periodic backups.
3. Utilizes well-known tools (pg_dump, GnuPG, gzip) under the hood.
4. Supports client-side encryption.
5. Supports S3 Object Lock and Expiration.
6. Supports lifecycle webhooks.

## Quick start

Perform a one-shot backup of "test" and "testdb2" databases with minimal configuration:
```bash
docker run --rm \
  -e PG_DATABASES="test testdb2" \
  -e PG_HOST="172.17.0.1" \
  -e PG_USER=postgres \
  -e PG_PASSWORD=toor \
  -e S3_ENDPOINT="https://s3.acme.foo.bar" \
  -e S3_BUCKET="pgs3-test" \
  -e S3_KEY_ID="xxxx" \
  -e S3_ACCESS_KEY="xxxx" \
  imcatwhocode/moonflower
```

Alternatively, set up regular backups every night at 1:00 AM on server's local time:
```bash
docker run \
  --restart=always \
  -v /etc/localtime:/etc/localtime:ro \
  -e SCHEDULE="0 1 * * *" \
  -e PG_DATABASES="test testdb2" \
  -e PG_HOST="172.17.0.1" \
  -e PG_USER=postgres \
  -e PG_PASSWORD=toor \
  -e S3_ENDPOINT="https://s3.acme.foo.bar" \
  -e S3_BUCKET="pgs3-test" \
  -e S3_KEY_ID="xxxx" \
  -e S3_ACCESS_KEY="xxxx" \
  imcatwhocode/moonflower
```

## Expiration
Moonflower supports S3 object expiration. You can specify how long backups should be kept in S3.
Use `S3_EXPIRES_IN` configuration parameter to define expiration duration:
```bash
S3_EXPIRES_IN="30 days"
```

Duration is specified in natural language. For example, `"1 month"`, `"2 weeks"` or `"30 days"`.

We use [chrono-node](https://github.com/wanasit/chrono) to parse durations.
While chrono-node can parse complicated expressions like `"next monday"`, we don't recommend doing so,
as we may switch to another parser in the future.

## Object Lock
Moonflower supports S3 [Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html) 
in governance mode to prevent accidental or malicious deletion of backups.

To set up Object Lock on each backup file Moonflower creates, use `S3_GOVERNANCE` parameter:
```bash
S3_GOVERNANCE="30 days"
```

This parameter defines how long backups should be locked. Duration is specified in 
natural language  (eg. `"1 month"`, `"2 weeks"` or `"30 days"`).

## Webhooks
Moonflower supports lifecycle webhooks. You can use them to get notified when backup is done or failed.
Despite these webhooks are opionated for [Healthchecks.io](https://healthchecks.io), you can simply fit them to your needs.

```bash
# Sends POST request to this URL when backup is started
WEBHOOK_START=xxxx

# Sends POST request to this URL when backup is done
WEBHOOK_SUCCESS=xxxx

# Sends POST request to this URL if backup failed
WEBHOOK_FAILURE=xxxx

# If this variable is set, Moonflower will put logs to 
# WEBHOOK_SUCCESS and WEBHOOK_FAILURE requests' body
WEBHOOK_POST_LOGS
```

## Encryption
Moonflower supports client-side encryption which prevents unauthorized access
even if an attacker gains access to S3. Encryption backend is GnuPG which is widely used and trusted.

Both symmetric and asymmetric encryption are supported:

1. Symmetric encryption uses a single passphrase to encrypt and decrypt data.

2. Asymmetric encryption uses a pair of keys: public and private. 
Using asymmetric encryption prevents attacker from decrypting data 
even if they gain access to Moonflower configuration.

### Setting up symmetric encryption
Use `ENCRYPTION_PASSPHRASE` configuration parameter to set up symmetric encryption.
```bash
ENCRYPTION_PASSPHRASE=my-secret-passphrase
```

### Setting up assymetric encryption
First, you need to generate a GPG key pair:
```bash
# Generates a key pair
# You'll be asked to enter a passphrase for your private key
gpg --batch --quick-gen-key 'Backup Encryption Key' default default
```

Then, find and export your public and private keys:
```bash
# Show all GPG keys and find the one you've just generated
gpg --list-keys

# You'll see export like that. 
# In this example, "EB565B6964DC7F0CE3DD77F7F8C5892D14B5CE23" is a key ID we look for.

# pub   rsa3072 2023-09-12 [SC] [expires: 2025-09-11]
#       EB565B6964DC7F0CE3DD77F7F8C5892D14B5CE23
# uid           [ultimate] Backup Encryption Key
# sub   rsa3072 2023-09-12 [E]

# Export private key to a file. Store it safely and securely.
gpg --export-secret-keys --armor YOUR_KEY_ID > private.asc

# Export public key to a file.
gpg --export --armor YOUR_KEY_ID > public.asc
```

Encode your public key to base64:
```bash
# You need to encode your public key to base64
# Use "-b 0" instead of "-w 0" on macOS
base64 -w 0 public.asc
```

Finally, put the base64-encoded public key to `ENCRYPTION_PUBLIC_KEY` configuration parameter:
```bash
ENCRYPTION_PUBLIC_KEY=quite-long-base64-encoded-public-key
```

## Backup recovery
Moonflower itself doesn't provide any tools for backup recovery. 
Internally, it's just a pg_dump, GnuPG and gzip with some glue.

You can easily unpack and decrypt backups using standard tools:
```bash
# Plaintext backups without encryption
gzip -dc backup.sql.gz > plain.sql

# Both symmetrically (required passphrase) or asymmetrically (requires private key) encrypted backups
gpg -d backup.sql.gz.gpg > plain.sql
```

## Configuration reference
Here's the full list of configuration parameters. 
Warning sign (⚠️) indicates that parameter is required.

### PostgreSQL
| Parameter           | Default     | Description                                                   |
| ------------------- | ----------- | ------------------------------------------------------------- |
| PG_DATABASES ⚠️      | –           | Database to backup. Space-separated list like "db1 db2 db3"   |
| PG_HOST ⚠️           | -           | Database host                                                 |
| PG_PORT             | 5432        | Database port                                                 |
| PG_USER ⚠️           | -           | Database username                                             |
| PG_PASSWORD ⚠️       | -           | Database password                                             |


### S3
| Parameter           | Default     | Description                                             |
| ------------------- | ----------- | ------------------------------------------------------- |
| S3_ENDPOINT ⚠️       | -           | S3 Endpoint                                             |
| S3_REGION           | "us-west-1" | S3 Region                                               |
| S3_BUCKET ⚠️         | -           | S3 Bucket                                               |
| S3_PATH             | "/"         | Path to backup files' folder relative to bucket's root  |
| S3_ACCESS_KEY ⚠️     | -           | S3 Access key                                           |
| S3_SECRET_KEY ⚠️     | -           | S3 Secret key                                           |
| S3_GOVERNANCE       | -           | Duration of S3 Object Lock in governance mode           |
| S3_EXPIRES_IN       | -           | Duration of S3 Object Expiration                        |


### Webhooks
| Parameter           | Default     | Description                                                                     |
| ------------------- | ----------- | ------------------------------------------------------------------------------- |
| WEBHOOK_START       | -           | POST query will be made to this URL when backup is started                      |
| WEBHOOK_SUCCESS     | -           | POST query will be made to this URL when backup is done.                        |
| WEBHOOK_FAILURE     | -           | POST query will be made to this URL if backup failed.                           |
| WEBHOOK_POST_LOGS   | -           | If set, WEBHOOK_SUCCESS and WEBHOOK_FAILURE requests will contain logs in body  |

### Encryption
| Parameter               | Default | Description                                                                     |
| ----------------------- | ------- | ------------------------------------------------------------------------------- |
| ENCRYPTION_PASSPHRASE   | -       | Passphrase for symmetric encryption.                                            |
| ENCRYPTION_PUBLIC_KEY   | -       | Base64-encoded public key for asymmetric encryption.                            |


### Scheduler
| Parameter           | Default     | Description                                                                     |
| ------------------- | ----------- | ------------------------------------------------------------------------------- |
| SCHEDULE            | -           | Schedule in cron format. Supports 5 and 6-field cron expressions.               |