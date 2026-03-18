"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BuddiesLogo } from "@/components/buddies-logo";

type SiteHeaderProps = {
  viewer: {
    name: string | null;
    isSignedIn: boolean;
    isAdmin: boolean;
  };
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ viewer }: SiteHeaderProps) {
  const pathname = usePathname();
  const navigationItems = [
    {
      href: "/listings",
      label: "Listings",
    },
    {
      href: "/how-it-works",
      label: "How It Works",
    },
    {
      href: "/paxi",
      label: "PAXI",
    },
    {
      href: "/terms",
      label: "Terms",
    },
    ...(viewer.isAdmin
      ? [
          {
            href: "/admin/reviews",
            label: "Review Queue",
          },
        ]
      : []),
  ];
  const authLink = viewer.isSignedIn
    ? {
        href: `/api/auth/logout?next=${encodeURIComponent(pathname || "/")}`,
        label: "Sign Out",
      }
    : {
        href: `/api/auth/login?next=${encodeURIComponent(pathname || "/")}`,
        label: "Sign In",
      };
  const primaryCta = viewer.isSignedIn
    ? {
        href: "/listings/new-service",
        label: "Post Free Ad",
      }
    : {
        href: `/signup?next=${encodeURIComponent("/listings/new-service")}`,
        label: "Sign Up",
      };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[rgba(233,243,232,0.88)] backdrop-blur-xl">
      <div className="page-shell">
        <div className="flex items-center gap-3 py-3">
          <Link
            href="/"
            className="shrink-0"
            aria-label="Buddies Worldwide home"
          >
            <BuddiesLogo mode="light" layout="inline" showTagline={false} />
          </Link>

          <Link
            href="/"
            className="shrink-0 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(7,32,23,0.22)]"
          >
            Home
          </Link>

          <nav aria-label="Primary" className="min-w-0 flex-1 overflow-x-auto">
            <div className="flex min-w-max items-center gap-2">
              {navigationItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "rounded-full border border-[rgba(46,139,87,0.22)] bg-[rgba(46,139,87,0.1)] px-4 py-3 text-sm font-semibold text-[var(--accent-2)]"
                        : "rounded-full border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[rgba(242,140,40,0.25)] hover:bg-white"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {viewer.isSignedIn ? (
              <span className="hidden rounded-full border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)] md:inline-flex">
                {viewer.name ?? "Signed in"}
              </span>
            ) : null}
            <Link
              href={authLink.href}
              className="rounded-full border border-[var(--line)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[rgba(242,140,40,0.25)] hover:bg-white"
            >
              {authLink.label}
            </Link>
            <Link
              href={primaryCta.href}
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(7,32,23,0.22)]"
            >
              {primaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
