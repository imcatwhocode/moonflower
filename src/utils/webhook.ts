import { fetch } from 'zx';

export const post = async (url: string, body: string = '') => {
  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'text/plain',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Webhook returned ${response.status}`);
  }
};