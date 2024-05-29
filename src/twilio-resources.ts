import { twilioGet, twilioGetPaged } from "./twilio-request";

interface Link {
  label: string;
  url: string;
}

export abstract class TwilioResource {
  readonly sid: string;
  _objectCache: Record<string, unknown>;
  constructor(sid: string) {
    this.sid = sid;
    this._objectCache = undefined;
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
    for (const item of response.results) {
      if (item.object_sid.startsWith("IT")) {
        results.push(new TwilioRegulatoryEndUser(item.object_sid));
      } else if (item.object_sid.startsWith("RD")) {
        results.push(new TwilioRegulatorySupportingDocument(item.object_sid));
      }
    }
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
  getFullName = async () => {
    const object = await this.getObject();
    return `${this.getName()} (${object.friendly_name}; ${object.phone_number})`;
  };
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${this._getAccountSid()}/IncomingPhoneNumbers/${this.sid}.json`;
}

export class TwilioMessagingService extends TwilioResource {
  getName = () => `Messaging service: ${this.sid}`;
  getRelatedResources = async () => {
    const response = await twilioGet(
      `https://messaging.twilio.com/v1/Services/${this.sid}/Compliance/Usa2p`,
    );
    const results = response.compliance.map(
      (campaign: Record<string, string>) =>
        new TwllioA2pCampaign(campaign.sid, this.sid),
    );
    for await (const response of twilioGetPaged(
      `https://messaging.twilio.com/v1/Services/${this.sid}/PhoneNumbers`,
    )) {
      const phones = (
        response as Record<string, Record<string, string>[]>
      ).phone_numbers.map(
        (phone: Record<string, string>) => new TwilioIncomingNumber(phone.sid),
      );
      results.push(...phones);
    }

    return results;
  };
  getApiUrl = () => `https://messaging.twilio.com/v1/Services/${this.sid}`;
}

export class TwllioA2pCampaign extends TwilioResource {
  messagingServiceSid: string;
  constructor(sid: string, messagingServiceSid: string) {
    super(sid);
    this.messagingServiceSid = messagingServiceSid;
  }
  getName = () => `A2p campaign: ${this.sid}`;
  getRelatedResources = async () => {
    const object = await this.getObject();
    return [new TwilioA2pBrand(object.brand_registration_sid as string)];
  };
  getApiUrl = () =>
    `https://messaging.twilio.com/v1/Services/${this.messagingServiceSid}/Compliance/Usa2p/${this.sid}`;
}

export class TwilioA2pBrand extends TwilioResource {
  getName = () => `A2p brand: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://messaging.twilio.com/v1/a2p/BrandRegistrations/${this.sid}`;
}
