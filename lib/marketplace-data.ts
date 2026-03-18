import {
  BriefcaseBusiness,
  CarFront,
  GraduationCap,
  HeartHandshake,
  House,
  PawPrint,
  ShoppingBag,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type CategoryDefinition = {
  slug: string;
  name: string;
  description: string;
  examples: string[];
  icon: LucideIcon;
  tone: string;
  restrictionLabel?: string;
};

export type Category = CategoryDefinition & {
  count: number;
};

type CategorizedItem = {
  categorySlug: string;
};

export const categoryDefinitions: CategoryDefinition[] = [
  {
    slug: "vehicles",
    name: "Vehicles",
    description: "Cars, bikes, spares, audio, tyres, commercial and farm vehicles.",
    examples: [
      "Cars",
      "Spare Parts - Accessories",
      "Audio and Video for Cars",
      "Motorcycles - Scooters",
    ],
    icon: CarFront,
    tone: "from-[#ffd486] via-[#f5a249] to-[#de6f1c]",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description: "Rooms, houses, apartments, student housing and vacation rentals.",
    examples: ["Rooms", "Houses", "Vacation Rentals", "Apartments"],
    icon: House,
    tone: "from-[#8cd7a8] via-[#58af79] to-[#2f7f52]",
  },
  {
    slug: "for-sale",
    name: "For Sale",
    description: "Furniture, baby gear, appliances, books, bags and second-hand finds.",
    examples: [
      "Antiques - Handicrafts",
      "Baby - Infant Products",
      "Bags - Luggage",
      "Books - Magazines",
    ],
    icon: ShoppingBag,
    tone: "from-[#e7d88d] via-[#b7b65d] to-[#7e8e33]",
  },
  {
    slug: "pets",
    name: "Pets",
    description: "Adoptions, rehoming, breeders, food, accessories and pet services.",
    examples: ["Pets Adoption", "Cats", "Dogs", "Birds"],
    icon: PawPrint,
    tone: "from-[#ffcd8d] via-[#f39a4d] to-[#c96c27]",
  },
  {
    slug: "personals",
    name: "Personals",
    description: "Profiles, companionship, dating and social introductions by preference.",
    examples: [
      "Women looking for Men",
      "Men looking for Women",
      "Casual Encounters",
      "Men looking for Men",
    ],
    icon: HeartHandshake,
    tone: "from-[#ffd28f] via-[#f59b45] to-[#d56f1d]",
    restrictionLabel: "18+ locked",
  },
  {
    slug: "jobs",
    name: "Jobs",
    description: "Office work, trade roles, creative jobs and regional hiring boards.",
    examples: [
      "Accounting - Tax - Audit",
      "Administrative - Secretarial",
      "Acting - Modelling",
      "Advertising - Media - PR",
    ],
    icon: BriefcaseBusiness,
    tone: "from-[#9be0ae] via-[#63bc7e] to-[#2d7f49]",
  },
  {
    slug: "education-learning",
    name: "Education - Learning",
    description: "Tutoring, language lessons, music classes and practical training.",
    examples: [
      "Computer - Multimedia Classes",
      "Language Classes",
      "Music - Theatre - Dance",
      "Tutoring - Private Lessons",
    ],
    icon: GraduationCap,
    tone: "from-[#b8e2b8] via-[#78b471] to-[#3f8146]",
  },
  {
    slug: "services",
    name: "Services",
    description: "Repairs, transport, design, catering, rentals and business help.",
    examples: [
      "Art - Design - Writers",
      "Business Offers",
      "Car Rentals - Taxi Services",
      "Motor Service - Repair",
    ],
    icon: Wrench,
    tone: "from-[#84d39b] via-[#3faa6d] to-[#21724a]",
  },
  {
    slug: "community",
    name: "Community",
    description: "Events, carpooling, local activities, artists and neighbourhood groups.",
    examples: [
      "Carpool",
      "Community Activities",
      "Events",
      "Musicians - Artists - Bands",
    ],
    icon: Users,
    tone: "from-[#d7de8f] via-[#9caf58] to-[#5f7a2f]",
  },
];

export function buildCategories<T extends CategorizedItem>(items: T[]): Category[] {
  return categoryDefinitions.map((definition) => ({
    ...definition,
    count: items.filter((item) => item.categorySlug === definition.slug).length,
  }));
}

export function getCategoryBySlug<T extends CategorizedItem>(
  slug: string,
  items: T[],
): Category | undefined {
  return buildCategories(items).find((category) => category.slug === slug);
}

export const topCities = [
  "Johannesburg",
  "Cape Town",
  "Durban",
  "Pretoria",
  "Polokwane",
  "Port Elizabeth",
  "Tembisa",
  "Soweto",
  "Bloemfontein",
  "Pietermaritzburg",
  "Midrand",
  "East London",
  "Rustenburg",
  "Alberton",
  "Witbank",
];

export const provinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export const trustSignals = [
  "Verified profiles before posting",
  "Fraud reports tied to listings and users",
  "Seller trust levels visible on every ad",
  "South Africa-first moderation workflow",
];
