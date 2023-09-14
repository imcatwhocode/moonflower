/**
 * This module performs the actual backup.
 */

import 'zx/globals';
import config from './config';
import { getDateTimeIn } from './utils/date';

export const GNUPG_KEYCHAIN_LOCATION = '/tmp/twinspur.gpg';

export const getPgDumpArgs = (database: string, compress?: boolean) => {
  const cmd: string[] = [
    "-h",
    config.pg.host,
    "-p",
    config.pg.port,
    "-U",
    config.pg.user,
  ];

  if (compress) {
    cmd.push('-Z', '5');
  }

  cmd.push(database);
  return cmd;
}

export const getS3UploadString = (database: string) => {
  const now = new Date().toISOString();
  const extension = (config.encryption.publicKey || config.encryption.passphrase)
    ? 'sql.gpg'
    : 'sql.gz';

  return `${config.s3.path}/${database}_${now}.${extension}`;
}

export const getS3RemoveObjectArgs = (path: string) => {
  const cmd: string[] = [
    's3api',
    'delete-object',
    '--endpoint-url',
    config.s3.endpoint,
    '--bucket',
    config.s3.bucket,
    '--key',
    path,
  ];

  return cmd;
}

export const getS3PutObjectRetentionArgs = (path: string) => {
  const policy = {
    Mode: "GOVERNANCE",
    RetainUntilDate: getDateTimeIn(config.s3.governance as string),
  };

  const cmd: string[] = [
    's3api',
    'put-object-retention',
    '--endpoint-url',
    config.s3.endpoint,
    '--bucket',
    config.s3.bucket,
    '--key',
    path,
    '--retention',
    JSON.stringify(policy),
  ];

  return cmd;
};

export const getS3UploadArgs = (path: string) => {
  const cmd: string[] = [
    '--endpoint-url',
    config.s3.endpoint,
    's3',
    'cp',
    '-',
    `s3://${config.s3.bucket}/${path}`,
  ];

  if (config.s3.expiresIn) {
    cmd.push(
      '--expires',
      getDateTimeIn(config.s3.expiresIn)
    );
  }

  return cmd;
}

export const getGPGEncryptArgs = (keyId?: string) => {
  if (config.encryption.passphrase) {
    return [
      '--quiet',
      '--batch',
      '--yes',
      '--passphrase',
      config.encryption.passphrase,
      '--symmetric',
    ];
  } else if (config.encryption.publicKey) {
    return [
      '--no-default-keyring',
      '--keyring',
      GNUPG_KEYCHAIN_LOCATION,
      '--quiet',
      '--batch',
      '--yes',
      '--encrypt',
      '--recipient',
      keyId,
      '--trust-model',
      'always'
    ];
  }
};

