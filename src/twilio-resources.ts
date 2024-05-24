import { twilioGet } from "./twilio-request";

interface Link {
  label: string;
  url: string;
}

export abstract class TwilioResource {
  sid: string;
  _objectCache: Record<string, unknown>;
  constructor(sid: string) {
    this.sid = sid;
    this._objectCache = null;
  }
  abstract getName(): string;
  abstract getRelatedResources(): Promise<TwilioResource[]>;
  abstract getApiUrl(): string;
  _getAccountSid = () => window.ptTwilioCreds.accountSid;
  getObject = async () => {
    if (!this._objectCache) {
      this._objectCache = await twilioGet(this.getApiUrl());
    }
    return this._objectCache;
  };
  getFullName = async () => {
    return this.getName();
  };
  getRelatedLinks: () => Promise<Link[]> = async () => [];
}

export class TwilioAddress extends TwilioResource {
  getName = () => `Address: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${this._getAccountSid()}/Addresses/${this.sid}.json`;
}

export class TwilioRegulatoryBundle extends TwilioResource {
  getName = () => `Regulatory bundle: ${this.sid}`;
  getRelatedResources = async () => {
    // TODO: handle pagination
    const response = await twilioGet(
      `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${this.sid}/ItemAssignments?PageSize=100`,
    );
    const results: TwilioResource[] = [];
    response.results.forEach((item: Record<string, string>) => {
      if (item.object_sid.startsWith("IT")) {
        results.push(new TwilioRegulatoryEndUser(item.object_sid));
      } else if (item.object_sid.startsWith("RD")) {
        results.push(new TwilioRegulatorySupportingDocument(item.object_sid));
      }
    });
    return results;
  };
  getApiUrl = () =>
    `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${this.sid}`;
}

export class TwilioRegulatoryEndUser extends TwilioResource {
  getName = () => `Regulatory end user: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://numbers.twilio.com/v2/RegulatoryCompliance/EndUsers/${this.sid}`;
}

export class TwilioRegulatorySupportingDocument extends TwilioResource {
  getName = () => `Regulatory supporting document: ${this.sid}`;
  getRelatedResources = async () => {
    const object = await this.getObject();
    const attributes = (object.attributes as Record<string, unknown>) || {};
    const addressSids = (attributes.address_sids as string[]) || [];
    return addressSids.map(
      (addressSid: string) => new TwilioAddress(addressSid),
    );
  };
  getApiUrl = () =>
    `https://numbers.twilio.com/v2/RegulatoryCompliance/SupportingDocuments/${this.sid}`;
  getFullName = async () => {
    const object = await this.getObject();
    return `${this.getName()} (${object.friendly_name})`;
  };
  getRelatedLinks = async () => {
    const object = await this.getObject();
    if (object.mime_type) {
      return [
        {
          label: "Download",
          url: `https://www.twilio.com/console/phone-numbers/api/v1/regulatory/documents/${this.sid}/file`,
        },
      ];
    }
  };
}

export class TwilioIncomingNumber extends TwilioResource {
  getName = () => `Incoming number: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${this._getAccountSid()}/IncomingPhoneNumbers/${this.sid}.json`;
}

export class TwilioMessagingService extends TwilioResource {
  getName = () => `Messaging service: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () => `https://messaging.twilio.com/v1/Services/${this.sid}`;
}
