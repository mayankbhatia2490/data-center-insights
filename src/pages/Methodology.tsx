import { Link } from "react-router-dom";
import LegalPage from "@/components/LegalPage";

const Methodology = () => (
  <LegalPage
    title="Methodology"
    description="How Data Center Pulse selects sources, uses AI, verifies people and facility data, and handles corrections."
    path="/about/methodology"
    updated="1 October 2026"
  >
    <p>
      This page describes what we do today. Where something is a goal and not yet in place, we say so.
    </p>

    <h2>Where stories come from</h2>
    <ul>
      <li>
        <strong>Specialist media.</strong> Stories are published automatically only from an approved list of specialist
        publications, including Data Center Dynamics, Data Center Knowledge, Capacity Media, The Register, Blocks &amp; Files
        and ServeTheHome. Stories from specialist media are labelled as reported by those outlets. They are not treated as
        proof of capacity, investment value or completion.
      </li>
      <li>
        <strong>Official sources.</strong> Announcements from governments, regulators, utilities, cloud providers and
        operators are treated as official statements, not independent journalism.
      </li>
      <li>
        <strong>Discovery only.</strong> News aggregators, search feeds, social platforms and press-release wires can help us
        find a candidate story, but they cannot publish one. A story appears only if its original article is on an approved
        domain.
      </li>
    </ul>
    <p>
      Every story links to the original article. We do not reproduce the article; we summarise it in our own words and send
      you to the source.
    </p>

    <h2>How we use AI</h2>
    <p>
      Summaries, “why it matters” notes, the daily briefing and the market signals are generated with large language models
      from third-party providers, working from the source text. They can be wrong or miss context. They are labelled, and the
      source link is always next to them. Please check the source before acting on anything important.
    </p>

    <h2>Pulse Index and market signals</h2>
    <p>
      The weekly Pulse Index summarises the sentiment and direction of recent coverage. It indicates what the coverage says.
      It is not a forecast and not a price or valuation. Signals and regional outlook are indicators for further research.
    </p>

    <h2>Facility data</h2>
    <ul>
      <li>We show a capacity figure only when a source has published one. Otherwise the record says “not disclosed”. A missing value is never read as zero.</li>
      <li>We show how precise a location is. Some locations are approximate (for example, a city centre) when an exact one is not public.</li>
      <li>Our inventory is a growing index. It is not a claim that every facility in the region is listed.</li>
      <li>Records are checked against their sources. Uncertain or conflicting records go to a person for review.</li>
    </ul>

    <h2>People</h2>
    <p>
      Profiles are built from published articles. Names, titles and organizations are extracted automatically and checked
      against the source text. Strong matches are marked as evidence-checked; uncertain ones are reviewed by a person. Evidence
      checking does not mean the person has confirmed the profile. People can ask us to correct or remove a profile through the{" "}
      <Link to="/contact">contact page</Link>.
    </p>

    <h2>Corrections</h2>
    <p>
      We correct errors when we find them or when they are reported. Send us the page and the source that shows the problem
      through the <Link to="/contact">contact page</Link>.
    </p>

    <h2>Limits</h2>
    <ul>
      <li>Coverage depends on what sources publish. Quiet periods or gaps can reflect the sources, not the market.</li>
      <li>We cannot independently verify every claim in a source article.</li>
      <li>Stock prices and other market data, where shown, may be delayed and are not advice.</li>
    </ul>
  </LegalPage>
);

export default Methodology;
