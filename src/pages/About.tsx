import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";

const About = () => (
  <LegalPage
    title="About Data Center Pulse"
    description="Data Center Pulse tracks the Middle East data center market: news, a facility tracker and market signals for operators and investors."
    path="/about"
  >
    <p>
      Data Center Pulse is an independent intelligence service on data centers in the Middle East and North Africa, with a
      global lens. It is written for the people who build, run and finance this infrastructure.
    </p>

    <h2>What we do</h2>
    <ul>
      <li><strong>Daily briefing.</strong> A short read on what changed and why it matters, drawn from specialist and official sources.</li>
      <li><strong>Facility tracker.</strong> A map and inventory of Gulf data centers with operator, stage and capacity where it has been published.</li>
      <li><strong>Market signals.</strong> Direction and risk indicators generated from recent coverage.</li>
      <li><strong>Leaders directory.</strong> The executives, regulators and investors who appear in the coverage.</li>
    </ul>

    <h2>How we treat the facts</h2>
    <p>
      Every story links to its original source. Summaries and “why it matters” notes are written by AI from the source
      article, so they can contain mistakes, and we label them as AI-generated. Where a figure has not been published, such as
      a facility’s capacity, we say it is not disclosed instead of estimating it. Our sources, checks and limits are set out in
      the <Link to="/about/methodology">methodology</Link>.
    </p>

    <h2>Corrections</h2>
    <p>
      If something is wrong, tell us through the <Link to="/contact">contact page</Link>. Operators can send a published source
      to update a facility record, and people can ask for their profile to be corrected or removed.
    </p>

    <h2>Not advice</h2>
    <p>
      Our content is for information. It is not investment, legal or technical advice. See the <Link to="/terms">terms</Link>.
    </p>
  </LegalPage>
);

export default About;
