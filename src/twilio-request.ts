export const twilioGet = (apiUrl: string) => {
  const { accountSid, authToken } = window.ptTwilioCreds;
  return fetch(apiUrl, {
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
  }).then((response) => response.json());
};

export async function* twilioGetPaged(
  apiUrl: string,
): AsyncGenerator<unknown, void, unknown> {
  const response = await twilioGet(apiUrl);
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
