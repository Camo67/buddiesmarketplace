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
    tone: "from-[#0b4db6] via-[#007fff] to-[#35a5ff]",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description: "Rooms, houses, apartments, student housing and vacation rentals.",
    examples: ["Rooms", "Houses", "Vacation Rentals", "Apartments"],
    icon: House,
    tone: "from-[#dbe9ff] via-[#8cb8ff] to-[#0b4db6]",
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
    tone: "from-[#ffd8cb] via-[#ffae90] to-[#ff7f50]",
  },
  {
    slug: "pets",
    name: "Pets",
    description: "Adoptions, rehoming, breeders, food, accessories and pet services.",
    examples: ["Pets Adoption", "Cats", "Dogs", "Birds"],
    icon: PawPrint,
    tone: "from-[#cfe4ff] via-[#7fb9ff] to-[#007fff]",
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
    tone: "from-[#ffe2d8] via-[#ffb799] to-[#ff7f50]",
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
    tone: "from-[#d6efe2] via-[#7dc7a2] to-[#2e8b57]",
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
    tone: "from-[#e1ebff] via-[#98bfff] to-[#335fb0]",
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
    tone: "from-[#cbe7ff] via-[#69b3ff] to-[#007fff]",
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
    tone: "from-[#dbeee4] via-[#8dcfb0] to-[#2e8b57]",
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
  "Verified seller workflows before trading actions unlock",
  "Moderator review trails tied to listings and user records",
  "Visible trust cues designed for higher-risk marketplace categories",
  "South Africa-first logistics and support flows",
];
