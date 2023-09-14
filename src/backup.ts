import 'zx/globals';
import config from './config';
import LogBuffer from './utils/log-buffer';
import { post } from './utils/webhook';
import { GNUPG_KEYCHAIN_LOCATION, getGPGEncryptArgs, getPgDumpArgs, getS3PutObjectRetentionArgs, getS3RemoveObjectArgs, getS3UploadArgs, getS3UploadString } from './cmd';

/**
 * Performs a full database backup, including encryption, S3 upload & meta.
 * @param database Name of the database to backup.
 */
const backupDatabase = async (database: string) => {
  const path = getS3UploadString(database);
  await $`# Backing up "${database}" to "${path}"`;

  try {
    if (config.encryption.passphrase || config.encryption.publicKey) {
      await $`pg_dump ${getPgDumpArgs(database)} | gpg ${getGPGEncryptArgs(process.env.TWINSPUR_GPG_KEY_ID)} | aws ${getS3UploadArgs(path)}`;
    } else {
      await $`pg_dump ${getPgDumpArgs(database, true)} | aws ${getS3UploadArgs(path)}`;
    }

    // Set object lock on shiny new backup
    if (config.s3.governance) {
      await $`aws ${getS3PutObjectRetentionArgs(path)}`;
    }
  } catch (error) {
    // Remove current backup as it's incomplete
    await $`aws ${getS3RemoveObjectArgs(path)}`;
    throw error;
  }
};

/**
 * For asymmetric encryption, import the public key and return its ID.
 * @returns Public key ID.
 */
const importPublicKey = async (): Promise<string> => {
  await $`echo ${config.encryption.publicKey} | base64 -d | gpg --no-default-keyring --keyring ${GNUPG_KEYCHAIN_LOCATION} --import`;
  const { stdout } = await $`gpg --no-default-keyring --keyring ${GNUPG_KEYCHAIN_LOCATION} --list-keys --with-colons | grep pub | cut -d: -f5`;
  const keyId = stdout.replaceAll(/\n/g, '');
  if (!keyId) {
    throw new Error('Could not obtain public key ID');
  }
  return keyId;
}

/**
 * Main backup routine.
 */
export const execute = async () => {
  // Set up LogBuffer, add secrets and attach to zx.
  const lb = new LogBuffer();
  lb.addSecret(config.pg.password, config.encryption.passphrase, config.s3.secretKey);
  $.log = entry => lb.push(entry);

  // Submit start webhook
  if (config.webhook.start) {
    await post(config.webhook.start);
  }

  try {
    // Import public key if asymmetric encryption is enabled
    if (config.encryption.publicKey) {
      process.env.TWINSPUR_GPG_KEY_ID = await importPublicKey();
    }

    // Set credentials
    process.env.PGPASSWORD = config.pg.password;
    process.env.AWS_ACCESS_KEY_ID = config.s3.accessKey;
    process.env.AWS_SECRET_ACCESS_KEY = config.s3.secretKey;
    process.env.AWS_DEFAULT_REGION = config.s3.region;

    // Iterate over databases
    for await (const db of config.pg.databases) {
      await backupDatabase(db);
    }

    if (config.webhook.success) {
      await post(config.webhook.success, config.webhook.postLogs ? lb.output : undefined);
    }
  } catch (error) {
    if (config.webhook.failure) {
      await post(config.webhook.failure, config.webhook.postLogs ? lb.output : undefined);
    }
    throw error;
  }
};

execute();