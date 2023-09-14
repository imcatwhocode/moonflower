/**
 * This module is responsible for obtaining configuration values,
 * and check them for common issues.
 */

import { validate } from 'node-cron';
import { Configuration } from './types';
import getDateTimeIn from './utils/date';
import getConfigValue from './utils/get-config-value';

const config: Configuration = {
  pg: {
    databases: getConfigValue('PG_DATABASES', true).split(' '),
    host: getConfigValue('PG_HOST', true),
    port: getConfigValue('PG_PORT', false, '5432'),
    user: getConfigValue('PG_USER', true),
    password: getConfigValue('PG_PASSWORD', true),
  },

  s3: {
    endpoint: getConfigValue('S3_ENDPOINT', true),
    region: getConfigValue('S3_REGION', false, 'us-west-1'),
    bucket: getConfigValue('S3_BUCKET', true),
    path: getConfigValue('S3_PATH', false, ''),
    accessKey: getConfigValue('S3_ACCESS_KEY', true),
    secretKey: getConfigValue('S3_SECRET_KEY', true),
    governance: getConfigValue('S3_GOVERNANCE'),
    expiresIn: getConfigValue('S3_EXPIRES_IN'),
  },

  webhook: {
    start: getConfigValue('WEBHOOK_START'),
    success: getConfigValue('WEBHOOK_SUCCESS'),
    failure: getConfigValue('WEBHOOK_FAILURE'),
    postLogs: getConfigValue('WEBHOOK_POST_LOGS') !== undefined,
  },

  encryption: {
    passphrase: getConfigValue('ENCRYPTION_PASSPHRASE'),
    publicKey: getConfigValue('ENCRYPTION_PUBLIC_KEY'),
  },

  scheduler: {
    schedule: getConfigValue('SCHEDULE'),
  },
};

// Check that at least one database is specified
if (config.pg.databases.length === 0) {
  throw new Error('No databases specified');
}

// Check that S3 endpoint is a valid URL
try {
  // eslint-disable-next-line no-new -- URL.canParse is not available in Node/Bun yet
  new URL(config.s3.endpoint);
} catch (_) {
  if (!config.s3.endpoint.startsWith('http')) {
    throw new Error('S3 endpoint must include protocol (http or https)');
  }

  throw new Error(`Incorrect S3 endpoint URL: ${config.s3.endpoint}`);
}

// Trim excess leading & trailing slashes from S3 path
config.s3.path = config.s3.path.replace(/^\/|\/$/g, '');

// Check that S3 Object Lock governance mode duration is recognized
if (config.s3.governance) {
  try {
    getDateTimeIn(config.s3.governance);
  } catch (_) {
    throw new Error(`Unrecognized S3 governance duration: ${config.s3.governance}`);
  }
}

// Check that S3 Object expiration duration is recognized
if (config.s3.expiresIn) {
  try {
    getDateTimeIn(config.s3.expiresIn);
  } catch (_) {
    throw new Error(`Unrecognized S3 expiration duration: ${config.s3.expiresIn}`);
  }
}

// Check that start webhook is parsable with new URL
if (config.webhook.start) {
  try {
    // eslint-disable-next-line no-new -- URL.canParse is not available in Node/Bun yet
    new URL(config.webhook.start);
  } catch (_) {
    throw new Error(`Incorrect start webhook URL: ${config.webhook.start}`);
  }
}

// Check that success webhook is parsable with new URL
if (config.webhook.success) {
  try {
    // eslint-disable-next-line no-new -- URL.canParse is not available in Node/Bun yet
    new URL(config.webhook.success);
  } catch (_) {
    throw new Error(`Incorrect success webhook URL: ${config.webhook.success}`);
  }
}

// Check that failure webhook is parsable with new URL
if (config.webhook.failure) {
  try {
    // eslint-disable-next-line no-new -- URL.canParse is not available in Node/Bun yet
    new URL(config.webhook.failure);
  } catch (_) {
    throw new Error(`Incorrect failure webhook URL: ${config.webhook.failure}`);
  }
}

// Verify that if set, encryption password must be at least 8 characters long
if (config.encryption.passphrase && config.encryption.passphrase.length < 8) {
  throw new Error('Encryption passphrase must be at least 8 characters long');
}

// Verify that if set, encryption public key is valid base64 string
if (config.encryption.publicKey) {
  if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(config.encryption.publicKey) === false) {
    throw new Error('Encryption public key is not a valid base64 string');
  }
}

// Verify that schedule is a valid cron expression
if (config.scheduler.schedule && !validate(config.scheduler.schedule)) {
  throw new Error(`Schedule is not a valid cron expression: ${config.scheduler.schedule}`);
}

export default config;
