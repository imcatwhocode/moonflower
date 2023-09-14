function getConfigValue(key: string, required?: false, defaultValue?: undefined): string | undefined;
function getConfigValue(key: string, required?: false, defaultValue?: string): string;
function getConfigValue(key: string, required?: true, defaultValue?: undefined): string | never;
function getConfigValue(key: string, required?: true, defaultValue?: string): string;

function getConfigValue(key: string, required?: boolean, defaultValue?: string) {
  const value = process.env[key];

  if (required && !value) {
    throw new Error(`Missing required environment variable ${key}`);
  }

  return value || defaultValue;
}

export default getConfigValue;