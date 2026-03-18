export const deliveryMethods = [
  "contact_only",
  "local_meetup",
  "paxi_nationwide",
] as const;

export type DeliveryMethod = (typeof deliveryMethods)[number];

export const paxiServiceWindows = [
  "3-5 business days",
  "7-9 business days",
] as const;

export type PaxiServiceWindow = (typeof paxiServiceWindows)[number];

export const paxiOfficialLinks = {
  home: "https://www.paxi.co.za/",
  pointLocator: "https://www.paxi.co.za/paxi-points",
  business: "https://www.paxi.co.za/business",
};

export const paxiPointLocatorEmbedUrl =
  "https://map.paxi.co.za?size=l,m,s&status=1,3,4&maxordervalue=1000&output=nc";

export const paxiCoverageFacts = [
  "2800+ PAXI points across South Africa.",
  "Drop off and pick up parcels 7 days a week.",
  "Available through PEP, PEPhome, PEPcell, Tekkie Town and Shoe City stores.",
] as const;

export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return deliveryMethods.includes(value as DeliveryMethod);
}

export function isPaxiServiceWindow(value: string): value is PaxiServiceWindow {
  return paxiServiceWindows.includes(value as PaxiServiceWindow);
}

export function buildDeliveryLabel(
  method: DeliveryMethod,
  paxiServiceWindow?: PaxiServiceWindow | null,
) {
  if (method === "paxi_nationwide") {
    return paxiServiceWindow
      ? `Nationwide via PAXI (${paxiServiceWindow})`
      : "Nationwide via PAXI";
  }

  if (method === "local_meetup") {
    return "Local meetup or collection";
  }

  return "Arrange directly with seller";
}

export const paxiMarketplaceNote =
  "PAXI can be offered as a nationwide delivery option, while the exact pickup point can be confirmed after the order is agreed.";
