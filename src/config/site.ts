// Operator details shown on the legal pages. Set these in the Vercel environment (and .env locally);
// nothing here is invented. Until the three required values are set, Privacy, Terms and Contact are
// marked noindex so placeholder wording is never indexed.
const env = import.meta.env;

export const SITE = {
  name: "Data Center Pulse",
  // Legal entity or individual that operates the site, e.g. "Example Media FZ-LLC".
  legalName: (env.VITE_LEGAL_NAME as string | undefined)?.trim() || "",
  // Public contact address for corrections, privacy requests and general enquiries.
  contactEmail: (env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || "",
  // Governing law and venue, e.g. "the laws of the United Arab Emirates as applied in the Emirate of Dubai".
  governingLaw: (env.VITE_GOVERNING_LAW as string | undefined)?.trim() || "",
  lastUpdated: "1 October 2026",
};

export const isLegalConfigured = Boolean(SITE.legalName && SITE.contactEmail && SITE.governingLaw);
export const operatorName = SITE.legalName || SITE.name;

// Premium plan presentation. Checkout is off until billing is really configured, so the pricing page
// never offers a button that fails. To switch it on: set the Stripe secrets on the edge functions
// (see .env.example), then set VITE_PREMIUM_CHECKOUT=true and VITE_PREMIUM_PRICE (e.g. "$29 / month").
export const PREMIUM = {
  checkoutEnabled: env.VITE_PREMIUM_CHECKOUT === "true",
  priceLabel: (env.VITE_PREMIUM_PRICE as string | undefined)?.trim() || "",
};

// Update VITE_SITE_URL once the production domain is purchased/finalized.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://data-center-insights-fawn.vercel.app").replace(/\/$/, "");
