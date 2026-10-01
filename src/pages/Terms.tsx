import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";
import { SITE, isLegalConfigured, operatorName } from "@/config/site";

const Terms = () => (
  <LegalPage
    title="Terms of use"
    description="The terms for using Data Center Pulse: informational content, AI-generated material, accounts, acceptable use and liability."
    path="/terms"
    updated={SITE.lastUpdated}
    noindex={!isLegalConfigured}
  >
    <p>
      These terms apply when you use Data Center Pulse, operated by {operatorName} (“we”). By using the site you agree to them.
    </p>

    <h2>Information, not advice</h2>
    <p>
      Everything on the site is for general information. It is not investment, financial, legal, engineering or other
      professional advice, and nothing is an offer or a recommendation to buy or sell any security. Market indicators, signals
      and any share prices are indicative and may be delayed or wrong. Do your own research and take professional advice before
      you act.
    </p>

    <h2>AI-generated content and accuracy</h2>
    <p>
      Summaries, notes, briefings and signals are generated with AI from third-party sources and may contain errors or omissions.
      We work to be accurate (see the <Link to="/about/methodology">methodology</Link>) but give no warranty that content is
      complete, current or error-free.
    </p>

    <h2>Third-party content and links</h2>
    <p>
      Stories link to articles owned by their publishers. We are not responsible for third-party content or sites. Their terms
      and rights apply to their material.
    </p>

    <h2>Accounts and Premium</h2>
    <p>
      Keep your sign-in secure and give us accurate information. Premium prices, billing period and cancellation terms are shown
      at checkout and handled by our payment provider.
    </p>

    <h2>Acceptable use</h2>
    <ul>
      <li>Do not copy, scrape or bulk-download the site, its data or its database, or use it to build a competing dataset, without our written permission.</li>
      <li>Do not interfere with the site, try to break its security, or use automated tools to overload it.</li>
      <li>Do not submit false claims, false corrections or content that infringes anyone’s rights.</li>
      <li>Personal, non-commercial and internal business reading, and short quotations with a link back to us, are fine.</li>
    </ul>

    <h2>Our content</h2>
    <p>
      We own, or are licensed to use, the site’s design, text, compilations and data we create. We grant you a limited,
      non-exclusive licence to view it for your own use. Nothing in these terms transfers ownership.
    </p>

    <h2>What you send us</h2>
    <p>
      If you send us a correction, source or other material, you allow us to use it to run and improve the site. Do not send
      anything you do not have the right to share.
    </p>

    <h2>Corrections and takedowns</h2>
    <p>
      If you believe content is wrong or infringes your rights, tell us through the <Link to="/contact">contact page</Link>
      and we will review it.
    </p>

    <h2>Limits on our liability</h2>
    <p>
      The site is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential loss, or for
      loss from relying on the content. Nothing here limits liability that cannot be limited by law.
    </p>

    {SITE.governingLaw && (
      <>
        <h2>Governing law</h2>
        <p>These terms are governed by {SITE.governingLaw}.</p>
      </>
    )}

    <h2>Changes</h2>
    <p>
      We may update these terms. Continued use after an update means you accept it. The date above shows the latest version.
    </p>
  </LegalPage>
);

export default Terms;
