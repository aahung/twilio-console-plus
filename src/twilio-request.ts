export const twilioGet = (apiUrl: string) => {
  const { accountSid, authToken } = window.ptTwilioCreds;
  return fetch(apiUrl, {
    headers: {
      Authorization: "Basic " + btoa(`${accountSid}:${authToken}`),
    },
  }).then((res) => res.json());
};
