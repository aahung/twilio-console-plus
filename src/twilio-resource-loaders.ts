import {
  TwilioA2pBrand,
  TwilioAddress,
  TwilioIncomingNumber,
  TwilioMessagingService,
  TwilioRegulatoryBundle,
  TwilioResource,
} from "./twilio-resources";

type ResearchCreator = (match: string[]) => TwilioResource;
export interface Loader {
  resourceUrl: RegExp;
  resourceCreator: ResearchCreator;
}

export const LOADERS: Loader[] = [
  {
    resourceUrl: /.+\/regulatory-compliance\/bundles\/(BU\w+)$/,
    resourceCreator: (match: string[]) => new TwilioRegulatoryBundle(match[1]),
  },
  {
    resourceUrl: /.+\/phone-numbers\/manage\/incoming\/(\w+)\/configure$/,
    resourceCreator: (match: string[]) => new TwilioIncomingNumber(match[1]),
  },
  {
    resourceUrl: /.+\/phone-numbers\/regulatory-compliance\/addresses\/(\w+)$/,
    resourceCreator: (match: string[]) => new TwilioAddress(match[1]),
  },
  {
    resourceUrl: /.+\/sms\/(\w+)\/messaging-service-properties(\?.*)$/,
    resourceCreator: (match: string[]) => new TwilioMessagingService(match[1]),
  },
  {
    resourceUrl: /.+\/sms\/services\/(\w+)\/[^/]+(\?.*)$/,
    resourceCreator: (match: string[]) => new TwilioMessagingService(match[1]),
  },
  {
    resourceUrl: /.+\/sms\/regulatory-compliance\/brands\/(\w+)$/,
    resourceCreator: (match: string[]) => new TwilioA2pBrand(match[1]),
  },
];

export const createTwilioResourceFromUrl = (
  resourceUrl: string,
): TwilioResource | null => {
  for (const loader of LOADERS) {
    const match = loader.resourceUrl.exec(resourceUrl);
    if (match) {
      return loader.resourceCreator(match);
    }
  }
  return null;
};
