import { twilioGet, twilioGetPaged } from "../twilio-request";

import {
  components as twilio_messaging_v1_components,
  operations as twilio_messaging_v1_operations,
} from "../generated-twilio-api-models/twilio_messaging_v1.schema";
import { TwilioResource } from "./base";
import { TwilioIncomingNumber } from "./general";

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
