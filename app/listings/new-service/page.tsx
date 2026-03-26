import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ServiceListingBuilder } from "@/components/service-listing-builder";
import { TurnstileScript } from "@/components/turnstile-script";
import { getBotProtectionPublicConfig } from "@/lib/bot-protection";
import { getMarketplaceUserById } from "@/lib/users-store";
import { readUserSession, userSessionCookieName } from "@/lib/user-auth";
import { canMarketplaceUserTrade } from "@/lib/user-verification";

export default async function NewServiceListingPage() {
  const cookieStore = await cookies();
  const userSession = await readUserSession(cookieStore.get(userSessionCookieName)?.value);

  if (!userSession) {
    redirect("/signup?next=/listings/new-service");
  }

  const marketplaceUser = await getMarketplaceUserById(userSession.marketplaceUserId);
  const botProtection = getBotProtectionPublicConfig();

  if (!marketplaceUser) {
    redirect("/signup?next=/listings/new-service");
  }

  if (!canMarketplaceUserTrade(marketplaceUser.verificationStatus)) {
    return (
      <main className="pb-16 pt-4">
        <section className="page-shell">
          <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
            >
              <ChevronLeft size={16} />
              Back to all listings
            </Link>

            <div className="mt-6 max-w-3xl">
              <p className="section-kicker">Verification Required</p>
              <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
                Submit your docs before posting ads.
              </h1>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
                Buddies lets people sign up quickly, but seller actions stay locked until identity
                verification is reviewed. Submit your ID and proof of address, then come back here
                once a moderator approves the account.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/verify?next=/listings/new-service"
                className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-bold text-white"
              >
                Submit verification docs
              </Link>
              <Link
                href="/how-it-works"
                className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold"
              >
                Review the trust flow
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pb-16 pt-4">
      {botProtection.enabled ? <TurnstileScript /> : null}
      <section className="page-shell">
        <div className="glass-panel rounded-[2.4rem] px-5 py-6 md:px-8 md:py-8">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-soft)]"
          >
            <ChevronLeft size={16} />
            Back to all listings
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="section-kicker">New Service Listing</p>
            <h1 className="mt-3 font-serif text-4xl leading-none md:text-5xl">
              Guided service listing creation
            </h1>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">
              Signed in as {marketplaceUser.displayName ?? userSession.name ?? userSession.preferredUsername ?? userSession.email}.
              This flow now creates a real user-owned listing, includes the Buddies safety
              guidance, offers PAXI where nationwide delivery makes sense, and sends the result to
              moderation before publishing.
            </p>
          </div>

          <div className="mt-8">
            <ServiceListingBuilder botProtection={botProtection} />
          </div>
        </div>
      </section>
    </main>
  );
}
