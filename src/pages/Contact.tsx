import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";
import { SITE, isLegalConfigured } from "@/config/site";

const Contact = () => (
  <LegalPage
    title="Contact"
    description="Contact Data Center Pulse for corrections, operator updates, profile requests, privacy requests and enquiries."
    path="/contact"
    noindex={!isLegalConfigured}
  >
    {SITE.contactEmail ? (
      <p>
        Email us at <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>. Please say which page you are writing
        about and, for corrections, include a link to the source.
      </p>
    ) : (
      <p>Our contact address will be published here shortly.</p>
    )}

    <h2>What to write to us about</h2>
    <ul>
      <li><strong>Corrections.</strong> A fact, figure or summary that is wrong. Include the page and a source.</li>
      <li><strong>Operators.</strong> A published source for a facility’s capacity, stage or other details.</li>
      <li><strong>People.</strong> To claim, correct or remove a profile.</li>
      <li><strong>Privacy requests.</strong> Access, correction or deletion of your data. See the <Link to="/privacy">privacy policy</Link>.</li>
      <li><strong>Everything else.</strong> Partnerships, press and general questions.</li>
    </ul>
  </LegalPage>
);

export default Contact;
