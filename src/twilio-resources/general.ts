import { components as twilio_api_v2010_components } from "../generated-twilio-api-models/twilio_api_v2010.schema";
import { TwilioResource } from "./base";

export class TwilioAddress extends TwilioResource<
  twilio_api_v2010_components["schemas"]["api.v2010.account.address"]
> {
  getName = () => `Address: ${this.sid}`;
  getRelatedResources = () => Promise.resolve([]);
  getApiUrl = () =>
    `https://api.twilio.com/2010-04-01/Accounts/${this._getAccountSid()}/Addresses/${this.sid}.json`;
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
