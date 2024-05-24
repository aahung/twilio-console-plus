declare global {
  export interface Window {
    ptTwilioCreds: {
      accountSid: string;
      authToken: string;
    };
  }
}

export {};
