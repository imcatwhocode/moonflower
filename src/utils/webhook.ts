import { fetch } from 'zx';

export default async function post(url: string, body: string = '') {
  try {
    fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (_) {
    // Do nothing really.
  }
}
