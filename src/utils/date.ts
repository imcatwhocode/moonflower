import * as chrono from 'chrono-node';

/**
 * Get target datetime by NLP-ing the duration
 * @param duration Interval in time (eg: "1 day", "1 month", "3 days", "next monday")
 * @returns
 */
export default function getDateTimeIn(duration: string): string {
  const date = chrono.parseDate(`in ${duration}`);
  if (!date) {
    throw new Error(`Unsupported duration: ${duration}`);
  }

  return date.toISOString();
}
