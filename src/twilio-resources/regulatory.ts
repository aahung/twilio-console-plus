import { twilioGet } from "../twilio-request";

import {
  components as twilio_numbers_v2_components,
  operations as twilio_numbers_v2_operations,
} from "../generated-twilio-api-models/twilio_numbers_v2.schema";
import { TwilioResource } from "./base";
import { TwilioAddress } from "./general";

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
