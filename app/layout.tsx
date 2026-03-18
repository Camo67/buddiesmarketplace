import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import {
  adminSessionCookieName,
  hasRequiredAdminRole,
  readAdminSession,
} from "@/lib/admin-auth";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
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
  const viewer = {
    name: userSession?.name ?? userSession?.preferredUsername ?? userSession?.email ?? null,
    isSignedIn: Boolean(userSession),
    isAdmin: hasRequiredAdminRole(adminSession),
  };

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${fraunces.variable}`}>
        <SiteHeader viewer={viewer} />
        {children}
      </body>
    </html>
  );
}
