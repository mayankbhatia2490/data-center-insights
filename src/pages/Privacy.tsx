import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";
import { SITE, isLegalConfigured, operatorName } from "@/config/site";

const Privacy = () => (
  <LegalPage
    title="Privacy policy"
    description="What personal data Data Center Pulse collects, why, who processes it, and how to exercise your rights."
    path="/privacy"
    updated={SITE.lastUpdated}
    noindex={!isLegalConfigured}
  >
    <p>
      This policy explains what personal data {operatorName} (“we”) handles when you use Data Center Pulse, and your choices.
    </p>

    <h2>What we collect</h2>
    <ul>
      <li><strong>Newsletter.</strong> Your email address, and your name if you give it, when you subscribe. We email a confirmation link first and only send the briefing once you confirm.</li>
      <li><strong>Account.</strong> Your email address when you sign in with an email link, and your plan and subscription status if you subscribe to Premium.</li>
      <li><strong>Payments.</strong> Premium payments are handled by Stripe. We do not receive or store your card number. We keep Stripe’s customer and subscription identifiers so we can link a payment to your account.</li>
      <li><strong>Profile claims.</strong> If you claim a leader profile, your account email, the profile and the status of the claim.</li>
      <li><strong>Chat.</strong> Messages you type into the Pulse AI assistant are sent to our server and to a third-party AI provider to produce an answer. We do not save chat history in our database.</li>
      <li><strong>Usage.</strong> Page views and basic technical information through Vercel Web Analytics and our hosting provider’s logs.</li>
      <li><strong>On your device.</strong> Your sign-in session, your theme choice and any articles you save are stored in your browser. Saved articles stay in your browser and are not sent to us.</li>
    </ul>

    <h2>Why we use it</h2>
    <ul>
      <li>To send the briefing you asked for and to manage your subscription.</li>
      <li>To sign you in, provide Premium features and process payments.</li>
      <li>To review profile claims and prevent abuse.</li>
      <li>To understand how the site is used and to keep it secure and working.</li>
    </ul>
    <p>
      Where the law requires a legal basis, we rely on your consent (newsletter), performance of a contract (accounts and
      Premium), and our legitimate interests (security and understanding usage).
    </p>

    <h2>Who processes your data</h2>
    <p>We use these service providers to run the site:</p>
    <ul>
      <li><strong>Supabase</strong> for our database, sign-in and server functions. Our database is currently hosted in Singapore.</li>
      <li><strong>Vercel</strong> for hosting and web analytics.</li>
      <li><strong>Resend</strong> to deliver emails.</li>
      <li><strong>Stripe</strong> for Premium payments.</li>
      <li><strong>Google and Groq</strong> as AI providers, for generating summaries and for the Pulse AI assistant.</li>
      <li><strong>Google Fonts and OpenStreetMap</strong> serve fonts and map tiles. Your browser contacts them directly, so they see your IP address.</li>
    </ul>
    <p>
      These providers may process data in other countries. We do not sell your personal data.
    </p>

    <h2>Information about people in the news</h2>
    <p>
      The leaders directory is built from published articles. It contains names, job titles and organizations that appear in
      those articles, with the source. If you appear in it and want a profile corrected or removed, contact us. See the{" "}
      <Link to="/about/methodology">methodology</Link>.
    </p>

    <h2>How long we keep data</h2>
    <p>
      We keep subscriber and account data while your subscription or account is active. You can ask us to delete it at any time.
      We may keep limited records where the law requires it, such as payment records.
    </p>

    <h2>Your rights</h2>
    <p>
      Depending on where you live, you may have the right to access, correct or delete your data, to object to or restrict how
      we use it, to withdraw consent, and to complain to your data-protection authority. Every newsletter has an unsubscribe
      link. For anything else,{" "}
      {SITE.contactEmail ? <a href={`mailto:${SITE.contactEmail}`}>email {SITE.contactEmail}</a> : <Link to="/contact">use the contact page</Link>}.
    </p>

    <h2>Children</h2>
    <p>The site is for professional audiences and is not directed at children.</p>

    <h2>Changes</h2>
    <p>We will update this page when our practices change and show the date above.</p>
  </LegalPage>
);

export default Privacy;
