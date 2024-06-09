import { twilioGet } from "../twilio-request";

interface Link {
  label: string;
  url: string;
}

export abstract class TwilioResource<T> {
  readonly sid: string;
  _objectCache: T;
  constructor(sid: string) {
    this.sid = sid;
    this._objectCache = undefined;
  }
  abstract getName(): string;
  abstract getRelatedResources(): Promise<TwilioResource<unknown>[]>;
  abstract getApiUrl(): string;
  _getAccountSid = () => window.ptTwilioCreds.accountSid;
  getObject = async () => {
    if (!this._objectCache) {
      this._objectCache = await twilioGet<T>(this.getApiUrl());
    }
    return this._objectCache;
  };
  getFullName = async () => {
    return this.getName();
  };
  getRelatedLinks: () => Promise<Link[]> = async () => [];
}
