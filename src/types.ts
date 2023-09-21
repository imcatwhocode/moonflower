export type Configuration = {
  /**
   * PostgreSQL configuration
   */
  pg: {
    /**
     * Array with databases to perform backup on.
     */
    databases: string[];

    /**
     * Hostname of the database server
     */
    host: string;

    /**
     * Port of the database server
     */
    port: string;

    /**
     * Username to connect to the database server
     */
    user: string;

    /**
     * Password to connect to the database server
     */
    password: string;
  }

  /**
   * S3 configuration
   */
  s3: {
    /**
     * S3 endpoint
     */
    endpoint: string;

    /**
     * S3 region
     */
    region: string;

    /**
     * S3 bucket name
     */
    bucket: string;

    /**
     * S3 path
     */
    path: string;

    /**
     * S3 access key
     */
    accessKey: string;

    /**
     * S3 secret key
     */
    secretKey: string;

    /**
     * Duration of S3 Object Lock in Governance mode
     */
    governance?: string;

    /**
     * Time interval before S3 object expiration
     */
    expiresIn?: string;
  };

  /**
   * Webhook configuration
   */
  webhook: {
    /**
     * Webhook URL to POST when backup starts
     */
    start?: string;

    /**
     * Webhook URL to POST when backup completes
     */
    success?: string;

    /**
     * Webhook URL to POST when backup fails
     */
    failure?: string;

    /**
     * Include logs in the success and error webhooks body
     */
    postLogs?: boolean;
  };

  /**
   * Encryption configuration
   */
  encryption: {
    /**
     * Passphrase to encrypt backups
     */
    passphrase?: string;

    /**
     * Public key to encrypt backups
     */
    publicKey?: string;
  };

  /**
   * Scheduler configuration
   */
  scheduler: {
    /**
     * Cron expression
     */
    schedule?: string;
  };
};
