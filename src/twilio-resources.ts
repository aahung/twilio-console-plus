import { twilioGet, twilioGetPaged } from "./twilio-request";

import {
  components as twilio_messaging_v1_components,
  operations as twilio_messaging_v1_operations,
} from "./generated-twilio-api-models/twilio_messaging_v1.schema";
import { components as twilio_api_v2010_components } from "./generated-twilio-api-models/twilio_api_v2010.schema";
import {
  components as twilio_numbers_v2_components,
  operations as twilio_numbers_v2_operations,
} from "./generated-twilio-api-models/twilio_numbers_v2.schema";

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

export class TwilioAddress extends TwilioResource<
  twilio_api_v2010_components["schemas"]["api.v2010.account.address"]
> {
  getName = () => `Address: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${this._getAccountSid()}/Addresses/${this.sid}.json`;
}

export class TwilioRegulatoryBundle extends TwilioResource<
  twilio_numbers_v2_components["schemas"]["numbers.v2.regulatory_compliance.bundle"]
> {
  getName = () => `Regulatory bundle: ${this.sid}`;
  getRelatedResources = async () => {
    // TODO: handle pagination
    const response = await twilioGet<
      twilio_numbers_v2_operations["ListItemAssignment"]["responses"]["200"]["content"]["application/json"]
    >(
      `https://numbers.twilio.com/v2/RegulatoryCompliance/Bundles/${this.sid}/ItemAssignments?PageSize=100`,
    );
    const results: TwilioResource<unknown>[] = [];
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

export class TwilioRegulatoryEndUser extends TwilioResource<
  twilio_numbers_v2_components["schemas"]["numbers.v2.regulatory_compliance.end_user"]
> {
  getName = () => `Regulatory end user: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://numbers.twilio.com/v2/RegulatoryCompliance/EndUsers/${this.sid}`;
}

export class TwilioRegulatorySupportingDocument extends TwilioResource<
  twilio_numbers_v2_components["schemas"]["numbers.v2.regulatory_compliance.supporting_document"]
> {
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

export class TwilioIncomingNumber extends TwilioResource<
  twilio_api_v2010_components["schemas"]["api.v2010.account.incoming_phone_number"]
> {
  getName = () => `Incoming number: ${this.sid}`;
  getFullName = async () => {
    const object = await this.getObject();
    return `${this.getName()} (${object.friendly_name}; ${object.phone_number})`;
  };
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${this._getAccountSid()}/IncomingPhoneNumbers/${this.sid}.json`;
}

export class TwilioMessagingService extends TwilioResource<
  twilio_messaging_v1_components["schemas"]["messaging.v1.service"]
> {
  getName = () => `Messaging service: ${this.sid}`;
  getRelatedResources = async () => {
    const results: TwilioResource<unknown>[] = [];
    const response = await twilioGet<
      twilio_messaging_v1_operations["ListUsAppToPerson"]["responses"]["200"]["content"]["application/json"]
    >(`https://messaging.twilio.com/v1/Services/${this.sid}/Compliance/Usa2p`);
    const campaigns = response.compliance.map(
      (campaign) => new TwllioA2pCampaign(campaign.sid, this.sid),
    );
    results.push(...campaigns);

    for await (const response of twilioGetPaged<
      twilio_messaging_v1_operations["ListPhoneNumber"]["responses"]["200"]["content"]["application/json"]
    >(`https://messaging.twilio.com/v1/Services/${this.sid}/PhoneNumbers`)) {
      const phones = response.phone_numbers.map(
        (phone) => new TwilioIncomingNumber(phone.sid),
      );
      results.push(...phones);
    }

    return results;
  };
  getApiUrl = () => `https://messaging.twilio.com/v1/Services/${this.sid}`;
}

export class TwllioA2pCampaign extends TwilioResource<
  twilio_messaging_v1_components["schemas"]["messaging.v1.service.us_app_to_person"]
> {
  messagingServiceSid: string;
  constructor(sid: string, messagingServiceSid: string) {
    super(sid);
    this.messagingServiceSid = messagingServiceSid;
  }
  getName = () => `A2p campaign: ${this.sid}`;
  getRelatedResources = async () => {
    const object = await this.getObject();
    return [new TwilioA2pBrand(object.brand_registration_sid)];
  };
  getApiUrl = () =>
    `https://messaging.twilio.com/v1/Services/${this.messagingServiceSid}/Compliance/Usa2p/${this.sid}`;
}

export class TwilioA2pBrand extends TwilioResource<
  twilio_messaging_v1_components["schemas"]["messaging.v1.brand_registrations"]
> {
  getName = () => `A2p brand: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://messaging.twilio.com/v1/a2p/BrandRegistrations/${this.sid}`;
}
