import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  readAdminSession,
} from "@/lib/admin-auth";
import { getMarketplaceUserById } from "@/lib/users-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Buddies Worldwide | Secure Marketplace for South Africa",
  description:
    "Browse vehicles, real estate, services, jobs and more across South Africa with stronger trust and scam prevention.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);
  const adminSession = await readAdminSession(cookieStore.get(adminSessionCookieName)?.value);
  const currentUser = userSession
    ? await getMarketplaceUserById(userSession.marketplaceUserId)
    : null;
  const viewer = {
    name:
      currentUser?.displayName ??
      userSession?.name ??
      userSession?.preferredUsername ??
      userSession?.email ??
      null,
    isSignedIn: Boolean(userSession),
    isAdmin: hasRequiredAdminRole(adminSession),
    verificationStatus: currentUser?.verificationStatus ?? null,
  };

  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable}`}>
        <SiteHeader viewer={viewer} />
        {children}
      </body>
    </html>
  );
}
