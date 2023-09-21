import { LogEntry } from 'zx';

export type ParsedLogEntry = {
  prefix: string;
  message: string;
};

const parseLogEntry = (entry: LogEntry): ParsedLogEntry => {
  let prefix = '';
  let message = '';

  switch (entry.kind) {
    case 'cd':
      prefix = '📂';
      message = `cd ${entry.dir}`;
      break;
    case 'cmd':
      prefix = '👉';
      message = entry.cmd;
      break;
    case 'fetch':
      prefix = '📡';
      message = `fetch ${entry.url}`;
      break;
    case 'retry':
      prefix = '🔁';
      message = `retry ${entry.error}`;
      break;
    case 'stderr':
      prefix = '⚠️ ';
      message = entry.data.toString();
      break;
    case 'stdout':
      prefix = '👈';
      message = entry.data.toString();
      break;
    default:
      prefix = '🤷‍♂️';
      message = JSON.stringify(entry);
      break;
  }

  return {
    prefix,
    message,
  };
};

class LogBuffer {
  private buffer: string[];

  private secrets: string[] = [];

  constructor() {
    this.buffer = [];
    this.secrets = [];
  }

  wipeSecrets(message: string) {
    let newMessage = message;
    this.secrets.forEach((secret) => {
      newMessage = newMessage.replaceAll(secret, '********');
    });
    return newMessage;
  }

  addSecret(...args: (string | undefined)[]) {
    const exists = args.filter((a) => typeof a === 'string' && a.length > 0) as string[];
    this.secrets.push(...exists);
  }

  push(entry: LogEntry) {
    const { prefix, message } = parseLogEntry(entry);
    const timestamp = new Date().toISOString();
    const content = this.wipeSecrets(message).replaceAll(/^\n|\n$/g, '');

    const row = `[${timestamp}] ${prefix} ${content}`;
    this.buffer.push(row);
    if (entry.kind === 'stderr') {
      process.stderr.write(`${row}\n`);
    } else {
      process.stdout.write(`${row}\n`);
    }
  }

  get output() {
    return this.buffer.join('\n');
  }
}

export default LogBuffer;
