import {
  TwilioA2pBrand,
  TwilioAddress,
  TwilioIncomingNumber,
  TwilioMessagingService,
  TwilioRegulatoryBundle,
  TwilioRegulatoryEndUser,
  TwilioRegulatorySupportingDocument,
  TwilioResource,
} from "./twilio-resources";

type UrlMatchResearchCreator = (match: string[]) => TwilioResource;
export interface UrlLoader {
  resourceUrl: RegExp;
  resourceCreator: UrlMatchResearchCreator;
}

export const URL_LOADERS: UrlLoader[] = [
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
  for (const loader of URL_LOADERS) {
    const match = loader.resourceUrl.exec(resourceUrl);
    if (match) {
      return loader.resourceCreator(match);
    }
  }
  return undefined;
};

type SidResourceCreator = (sid: string) => Promise<TwilioResource>;

export interface SidLoader {
  resourceSid: RegExp;
  resourceCreator: SidResourceCreator;
}

export const SID_LOADERS: SidLoader[] = [
  {
    resourceSid: /^PN\w+$/,
    resourceCreator: async (sid: string) => new TwilioIncomingNumber(sid),
  },
  {
    resourceSid: /^MG\w+$/,
    resourceCreator: async (sid: string) => new TwilioMessagingService(sid),
  },
  {
    resourceSid: /^BN\w+$/,
    resourceCreator: async (sid: string) => new TwilioA2pBrand(sid),
  },
  {
    resourceSid: /^RD\w+$/,
    resourceCreator: async (sid: string) =>
      new TwilioRegulatorySupportingDocument(sid),
  },
  {
    resourceSid: /^IT\w+$/,
    resourceCreator: async (sid: string) => new TwilioRegulatoryEndUser(sid),
  },
  {
    resourceSid: /^BU\w+$/,
    resourceCreator: async (sid: string) => new TwilioRegulatoryBundle(sid),
  },
  {
    resourceSid: /^AD\w+$/,
    resourceCreator: async (sid: string) => new TwilioAddress(sid),
  },
];

export const createTwilioResourceFromSid = async (
  sid: string,
): Promise<TwilioResource | undefined> => {
  for (const loader of SID_LOADERS) {
    const match = loader.resourceSid.exec(sid);
    if (match) {
      const candidate = await loader.resourceCreator(sid);
      const object = await candidate.getObject();
      if (object.sid === sid) {
        return candidate;
      }
    }
  }
  return undefined;
};
