import { ProfessionalCard } from "../professional-card";
import {
  getProfessionals,
  splitCategoriesByAvailability,
  type ProfessionalCategory,
  type PublicProfessional,
} from "../professional-directory";
import { SERVICE_CITY } from "./location";

const RESULTS_ID = "professionals-results";

function Hero() {
  return (
    <section className="professional-hero">
      <img
        src="/images/buildanta-v2/professionals-network-v2.webp"
        alt=""
        fetchPriority="high"
      />
      <div>
        <p>BUILDANTA PROFESSIONAL NETWORK</p>
        <h1>Find construction professionals in {SERVICE_CITY}</h1>
        <span>
          Discover local contractors, architects, designers and building
          specialists serving projects across {SERVICE_CITY}.
        </span>
        <a className="button orange professional-hero-action" href={`#${RESULTS_ID}`}>
          Explore available professionals <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

function TrustStrip() {
  const points = [
    ["Local professionals", `Every listing serves projects in ${SERVICE_CITY}.`],
    ["Clear service information", "See experience and services before you get in touch."],
    ["Direct profile enquiries", "Send your requirement to Buildanta and we connect you."],
  ];
  return (
    <section className="professional-trust-strip" aria-label="How Buildanta lists professionals">
      <ul>
        {points.map(([title, detail]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AvailableCategories({ available }: { available: Array<{ category: ProfessionalCategory; count: number }> }) {
  if (!available.length) return null;
  return (
    <div className="professional-category-available">
      <h2>Available now in {SERVICE_CITY}</h2>
      <div className="professional-category-cards">
        {available.map(({ category, count }) => (
          <a href={`/professionals/${category.slug}`} key={category.type}>
            <i aria-hidden="true">{category.short}</i>
            <div>
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <span>
                {count} {count === 1 ? "profile" : "profiles"} <b aria-hidden="true">→</b>
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Empty categories stay visible so customers know the network is growing, but
// they are listed as plain text rather than as five identical cards each
// reading "0 professionals".
function ComingSoonCategories({ comingSoon }: { comingSoon: ProfessionalCategory[] }) {
  if (!comingSoon.length) return null;
  return (
    <div className="professional-category-soon">
      <h2>Coming soon in {SERVICE_CITY}</h2>
      <ul>
        {comingSoon.map((category) => <li key={category.type}>{category.title}</li>)}
      </ul>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    ["Choose a professional", `Review professionals serving ${SERVICE_CITY}.`],
    ["Check their experience", "Explore services, experience and profile information."],
    ["Contact the professional", "Send your requirement and Buildanta connects you."],
  ];
  return (
    <section className="professional-how" aria-labelledby="professional-how-title">
      <h2 id="professional-how-title">How it works</h2>
      <ol>
        {steps.map(([title, detail], index) => (
          <li key={title}>
            <span aria-hidden="true">{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function EmptyDirectory() {
  return (
    <div className="professional-empty">
      <h3>{SERVICE_CITY} profiles are being prepared</h3>
      <p>
        Buildanta is adding local construction professionals. You can still
        share your project requirement with our team.
      </p>
      <a className="button orange" href="/bulk-quotes">
        Share your requirement <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

function Results({ professionals }: { professionals: PublicProfessional[] }) {
  // A lone card in a three-column grid reads as a mistake. One result gets a
  // wide layout instead; two or more fall back to the responsive grid.
  const single = professionals.length === 1;
  const firstProfessional = professionals[0];

  return (
    <section className="professional-results" id={RESULTS_ID} aria-labelledby="professional-results-title">
      <div className="professional-results-head">
        <div>
          <p>PROFESSIONAL DIRECTORY</p>
          <h2 id="professional-results-title">Professionals serving {SERVICE_CITY}</h2>
          <span className="professional-results-note">
            Review each professional&rsquo;s services and experience, then open their
            profile to send an enquiry through Buildanta.
          </span>
        </div>
        {professionals.length ? (
          <span className="professional-results-count">
            {professionals.length} {professionals.length === 1 ? "profile" : "profiles"}
          </span>
        ) : null}
      </div>

      {!professionals.length ? <EmptyDirectory /> : null}

      {single && firstProfessional ? (
        <div className="professional-single">
          <ProfessionalCard professional={firstProfessional} layout="wide" />
        </div>
      ) : null}

      {professionals.length > 1 ? (
        <div className="professional-grid">
          {professionals.map((professional) => (
            <ProfessionalCard professional={professional} key={professional.id} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default async function ProfessionalsDirectoryPage() {
  const professionals = await getProfessionals();
  const { available, comingSoon } = splitCategoriesByAvailability(professionals);

  return (
    <main className="professionals-page">
      <Hero />
      <TrustStrip />
      <section className="professional-category-section" aria-label="Professional categories">
        <AvailableCategories available={available} />
        <ComingSoonCategories comingSoon={comingSoon} />
      </section>
      <Results professionals={professionals} />
      <HowItWorks />
    </main>
  );
}
