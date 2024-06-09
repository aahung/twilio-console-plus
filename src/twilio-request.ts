export const twilioGet = <T>(apiUrl: string): Promise<T> => {
  const { accountSid, authToken } = window.ptTwilioCreds;
  return fetch(apiUrl, {
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
  }).then((response) => response.json());
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function* twilioGetPaged<T extends Record<string, any>>(
  apiUrl: string,
): AsyncGenerator<T, void, unknown> {
  const response = await twilioGet<T>(apiUrl);
  yield response;
  const next_url = response.meta?.next_page_url;
  const next_uri = response.next_page_uri;
  if (next_url) {
    yield* await twilioGetPaged(next_url);
  }
  if (next_uri) {
    const url = new URL(apiUrl);
    url.pathname = next_uri;
    yield* await twilioGetPaged(url.toString());
  }
}
