"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookCheck,
  Grid2X2,
  House,
  LayoutGrid,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldEllipsis,
  UserRound,
} from "lucide-react";
import { BuddiesLogo } from "@/components/buddies-logo";
import { StatusPill } from "@/components/status-pill";
import type { VerificationStatus } from "@/lib/user-verification";

type SiteHeaderProps = {
  viewer: {
    name: string | null;
    isSignedIn: boolean;
    isAdmin: boolean;
    verificationStatus: VerificationStatus | null;
  };
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildPrimaryCta(viewer: SiteHeaderProps["viewer"]) {
  if (!viewer.isSignedIn) {
    return {
      href: "/signup?next=%2Flistings%2Fnew-service",
      label: "Create Account",
    };
  }

  if (viewer.verificationStatus === "verified") {
    return {
      href: "/listings/new-service",
      label: "Post Listing",
    };
  }

  return {
    href: "/verify?next=%2Flistings%2Fnew-service",
    label: "Verify to Sell",
  };
}

function getViewerTrustState(viewer: SiteHeaderProps["viewer"]) {
  if (!viewer.isSignedIn) {
    return {
      label: "Guest browsing",
      tone: "info" as const,
      icon: <ShieldEllipsis size={14} />,
    };
  }

  if (viewer.verificationStatus === "verified") {
    return {
      label: "Verified trader",
      tone: "success" as const,
      icon: <ShieldCheck size={14} />,
    };
  }

  return {
    label: "Verification needed",
    tone: "accent" as const,
    icon: <BookCheck size={14} />,
  };
}

export function SiteHeader({ viewer }: SiteHeaderProps) {
  const pathname = usePathname();
  const primaryCta = buildPrimaryCta(viewer);
  const trustState = getViewerTrustState(viewer);
  const authLink = viewer.isSignedIn
    ? {
        href: `/api/auth/logout?next=${encodeURIComponent(pathname || "/")}`,
        label: "Sign Out",
        icon: <LogOut size={16} />,
      }
    : {
        href: `/api/auth/login?next=${encodeURIComponent(pathname || "/")}`,
        label: "Sign In",
        icon: <LogIn size={16} />,
      };
  const accountHref = viewer.isSignedIn
    ? "/verify"
    : `/signup?next=${encodeURIComponent(pathname || "/")}`;
  const desktopLinks = [
    { href: "/listings", label: "Browse" },
    { href: "/#trust-system", label: "Trust" },
    { href: "/paxi", label: "Logistics" },
    ...(viewer.isAdmin ? [{ href: "/admin/reviews", label: "Moderation" }] : []),
  ];
  const mobileLinks = [
    { href: "/", label: "Home", icon: House },
    { href: "/listings", label: "Browse", icon: LayoutGrid },
    { href: primaryCta.href, label: "Sell", icon: Grid2X2 },
    { href: "/#trust-system", label: "Trust", icon: ShieldCheck },
    { href: accountHref, label: "Account", icon: UserRound },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(248,251,255,0.84)] backdrop-blur-xl">
        <div className="page-shell">
          <div className="flex items-center gap-3 py-3">
            <Link href="/" className="min-w-0 shrink-0" aria-label="Buddies Worldwide home">
              <BuddiesLogo mode="light" layout="inline" showTagline={false} />
            </Link>

            <div className="ml-auto flex items-center gap-2 md:hidden">
              {viewer.isAdmin ? (
                <Link
                  href="/admin/reviews"
                  className="touch-target inline-flex items-center rounded-full border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--foreground)]"
                >
                  Review
                </Link>
              ) : null}
              <a
                href={authLink.href}
                className="touch-target inline-flex items-center rounded-full border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--foreground)]"
              >
                {authLink.label}
              </a>
            </div>

            <nav aria-label="Primary" className="ml-6 hidden min-w-0 flex-1 md:block">
              <div className="flex flex-wrap items-center gap-2">
                {desktopLinks.map((item) => {
                  const active = item.href.startsWith("/#")
                    ? pathname === "/"
                    : isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "touch-target inline-flex items-center rounded-full border border-[rgba(0,127,255,0.18)] bg-[rgba(0,127,255,0.08)] px-4 text-sm font-semibold text-[var(--trust)]"
                          : "touch-target inline-flex items-center rounded-full border border-[var(--line)] bg-white/76 px-4 text-sm font-medium text-[var(--foreground)] transition hover:border-[rgba(0,127,255,0.18)] hover:bg-white"
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="ml-auto hidden items-center gap-2 md:flex">
              <StatusPill tone={trustState.tone} icon={trustState.icon}>
                {trustState.label}
              </StatusPill>
              {viewer.isSignedIn ? (
                <span className="touch-target inline-flex items-center rounded-full border border-[var(--line)] bg-white px-4 text-sm font-medium text-[var(--foreground)]">
                  {viewer.name ?? "Marketplace member"}
                </span>
              ) : null}
              <a
                href={authLink.href}
                className="touch-target inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[rgba(0,127,255,0.18)] hover:bg-white"
              >
                {authLink.icon}
                {authLink.label}
              </a>
              <Link
                href={primaryCta.href}
                className="touch-target inline-flex items-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,127,80,0.22)]"
              >
                {primaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[rgba(248,251,255,0.96)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2">
          {mobileLinks.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                  ? pathname === "/"
                  : isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "touch-target inline-flex flex-col items-center justify-center gap-1 rounded-[1rem] bg-[rgba(0,127,255,0.08)] px-1 py-2 text-[0.68rem] font-semibold text-[var(--trust)]"
                    : "touch-target inline-flex flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-[0.68rem] font-medium text-[var(--muted)]"
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
