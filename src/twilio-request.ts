export const twilioGet = (apiUrl: string) => {
  const { accountSid, authToken } = window.ptTwilioCreds;
  return fetch(apiUrl, {
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
  }).then((res) => res.json());
};

export async function* twilioGetPaged(
  apiUrl: string,
): AsyncGenerator<unknown, void, unknown> {
  const response = await twilioGet(apiUrl);
  yield response;
  const next_url = response.meta?.next_page_url;
  if (next_url) {
    yield* await twilioGetPaged(next_url);
  }
}
