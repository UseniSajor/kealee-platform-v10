import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FormEvent, useMemo, useState } from 'react';
import type { GetServerSideProps } from 'next';

type ServiceKey = 'design_concept' | 'cost_estimate' | 'permit_path_only' | 'full_preconstruction';

interface Campaign {
  slug: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
}

interface Props {
  campaign: Campaign;
}

const services = [
  {
    key: 'design_concept',
    number: '01',
    title: 'Design Concepts',
    image: '/media/generated/preconstruction-design.jpg',
    description: 'Turn goals, site information, and reference ideas into a clear project direction before drawings multiply.',
    deliverables: ['Concept direction', 'Scope definition', 'Decision-ready visuals'],
  },
  {
    key: 'cost_estimate',
    number: '02',
    title: 'Catalogue-Based Estimating',
    image: '/media/generated/preconstruction-estimate.jpg',
    description: 'Build a transparent estimate from defined quantities, labor, materials, equipment, and documented assumptions.',
    deliverables: ['Division-level detail', 'Labor and material basis', 'Traceable assumptions'],
  },
  {
    key: 'permit_path_only',
    number: '03',
    title: 'Permit Planning',
    image: '/media/generated/preconstruction-permit.jpg',
    description: 'Identify jurisdiction requirements, submission needs, dependencies, and the next documents your project requires.',
    deliverables: ['Permit path', 'Requirements checklist', 'Submission readiness'],
  },
] as const;

const outcomes = [
  ['A clearer scope', 'Align the project around what is actually being designed, priced, and submitted.'],
  ['A defensible budget', 'See the quantities and assumptions behind the estimate instead of relying on a generic cost-per-square-foot guess.'],
  ['A practical permit path', 'Know the likely jurisdiction workflow and required documentation before filing.'],
  ['One connected record', 'Keep concept, estimate, and permitting information together as the project develops.'],
];

const steps = [
  ['Tell us about the project', 'Share the project type, location, current stage, and the preconstruction decision you need to make.'],
  ['We define the work', 'Kealee organizes the scope, known quantities, missing information, and service path.'],
  ['You receive an actionable plan', 'Review the concept, estimate basis, permit path, and recommended next action in one workflow.'],
];

export default function CampaignPage({ campaign }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'full_preconstruction' as ServiceKey,
    projectType: '',
    location: '',
    projectStage: '',
    timeline: '',
    message: '',
  });

  const attribution = useMemo(() => {
    const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
    return {
      utm_source: first(router.query.utm_source),
      utm_medium: first(router.query.utm_medium),
      utm_campaign: first(router.query.utm_campaign),
      utm_content: first(router.query.utm_content),
    };
  }, [router.query]);

  const chooseService = (service: ServiceKey) => {
    setFormData((current) => ({ ...current, service }));
    document.getElementById('scope-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...attribution,
          source: campaign.slug,
          landingPath: router.asPath,
          referrer: document.referrer || undefined,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || 'We could not submit your request.');
      }

      const dataLayer = (window as typeof window & { dataLayer?: Record<string, unknown>[] }).dataLayer;
      dataLayer?.push({
        event: 'lead_submitted',
        service: formData.service,
        campaign: campaign.slug,
      });

      const query = new URLSearchParams({
        service: formData.service,
        name: formData.name.split(' ')[0],
      });
      window.location.assign(`/thank-you?${query.toString()}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Preconstruction Services | Kealee</title>
        <meta
          name="description"
          content="Connect design concepts, catalogue-based construction estimating, and permit planning before construction begins."
        />
      </Head>

      <main>
        <header className="siteHeader">
          <a className="brand" href="#top" aria-label="Kealee preconstruction home">
            <Image src="/kealee-logo.png" alt="Kealee" width={166} height={48} priority />
          </a>
          <nav aria-label="Primary navigation">
            <a href="#services">Services</a>
            <a href="#process">Process</a>
            <a href="#scope-review">Start</a>
          </nav>
        </header>

        <section className="hero" id="top">
          <video className="heroVideo" autoPlay muted loop playsInline poster="/media/generated/preconstruction-design.jpg">
            <source src="/media/generated/preconstruction-hero.mp4" type="video/mp4" />
          </video>
          <div className="heroScrim" />
          <div className="heroGlow heroGlowOne" />
          <div className="heroGlow heroGlowTwo" />
          <div className="heroContent">
            <div className="heroCopy">
              <p className="eyebrow">{campaign.eyebrow}</p>
              <h1>{campaign.headline}</h1>
              <p className="heroLead">{campaign.subheadline}</p>
              <div className="heroActions">
                <a className="button buttonPrimary" href="#scope-review">Start a scope review</a>
                <a className="button buttonSecondary" href="#services">Explore services</a>
              </div>
              <p className="heroNote">Designed for owners, developers, and project teams making early construction decisions.</p>
            </div>

            <div className="heroPanel" aria-label="Preconstruction workflow summary">
              <p className="panelLabel">Your preconstruction record</p>
              {services.map((service, index) => (
                <div className="workflowRow" key={service.key}>
                  <span>{service.number}</span>
                  <div>
                    <strong>{service.title}</strong>
                    <small>{index === 0 ? 'Define' : index === 1 ? 'Validate' : 'Prepare'}</small>
                  </div>
                  <b aria-hidden="true">→</b>
                </div>
              ))}
              <div className="workflowResult">
                <span>Ready for the next decision</span>
                <strong>Scope + Cost + Path</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="proofStrip" aria-label="Platform principles">
          <span>Catalogue-referenced pricing</span>
          <span>Documented assumptions</span>
          <span>Project-specific scope</span>
          <span>Connected workflow</span>
        </section>

        <section className="section" id="services">
          <div className="sectionHeading">
            <p className="eyebrow dark">Preconstruction services</p>
            <h2>Resolve the expensive questions early.</h2>
            <p>Use one service or connect all three. Each step creates better inputs for the next.</p>
          </div>
          <div className="serviceGrid">
            {services.map((service) => (
              <article className="serviceCard" key={service.key}>
                <div className="serviceImage">
                  <Image src={service.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
                  <span>{service.number}</span>
                </div>
                <div className="serviceBody">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <ul>
                    {service.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}
                  </ul>
                  <button className="textButton" type="button" onClick={() => chooseService(service.key)}>
                    Select this service <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="outcomesSection">
          <div className="sectionHeading light">
            <p className="eyebrow">Why Kealee</p>
            <h2>More certainty without false precision.</h2>
            <p>Early estimates should be transparent about what is known, assumed, and still unresolved.</p>
          </div>
          <div className="outcomeGrid">
            {outcomes.map(([title, description], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section processSection" id="process">
          <div className="sectionHeading">
            <p className="eyebrow dark">How it works</p>
            <h2>From rough idea to an organized preconstruction plan.</h2>
          </div>
          <div className="processGrid">
            {steps.map(([title, description], index) => (
              <article key={title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="formSection" id="scope-review">
          <div className="formIntro">
            <p className="eyebrow">Start here</p>
            <h2>What decision does your project need next?</h2>
            <p>Share the essentials. Kealee will route the request to the right preconstruction workflow and identify the inputs needed for a useful result.</p>
            <div className="formPromise">
              <strong>No generic square-foot pricing.</strong>
              <span>Estimate outputs are based on project assumptions, defined quantities, and the construction catalogue workflow.</span>
            </div>
          </div>

          <form className="leadForm" onSubmit={handleSubmit}>
            <div className="fieldRow">
              <label>
                Full name
                <input required autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </label>
              <label>
                Work email
                <input required type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </label>
            </div>
            <div className="fieldRow">
              <label>
                Phone
                <input type="tel" autoComplete="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </label>
              <label>
                Project location
                <input required placeholder="City, state or jurisdiction" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </label>
            </div>
            <div className="fieldRow">
              <label>
                Service needed
                <select value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value as ServiceKey })}>
                  <option value="full_preconstruction">Connected preconstruction plan</option>
                  <option value="design_concept">Design concepts</option>
                  <option value="cost_estimate">Construction estimate</option>
                  <option value="permit_path_only">Permit planning</option>
                </select>
              </label>
              <label>
                Project type
                <select required value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}>
                  <option value="">Select project type</option>
                  <option value="renovation">Renovation or addition</option>
                  <option value="new_residential">New residential construction</option>
                  <option value="multifamily">Multifamily development</option>
                  <option value="commercial">Commercial or tenant improvement</option>
                  <option value="mixed_use">Mixed-use development</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <div className="fieldRow">
              <label>
                Current stage
                <select required value={formData.projectStage} onChange={(e) => setFormData({ ...formData, projectStage: e.target.value })}>
                  <option value="">Select current stage</option>
                  <option value="idea">Early idea or feasibility</option>
                  <option value="concept">Concept is forming</option>
                  <option value="drawings">Drawings are underway</option>
                  <option value="pricing">Ready for pricing</option>
                  <option value="permit">Preparing for permits</option>
                </select>
              </label>
              <label>
                Desired start
                <select value={formData.timeline} onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}>
                  <option value="">Select timeline</option>
                  <option value="0_3_months">Within 3 months</option>
                  <option value="3_6_months">3 to 6 months</option>
                  <option value="6_12_months">6 to 12 months</option>
                  <option value="planning">Still planning</option>
                </select>
              </label>
            </div>
            <label>
              What are you trying to resolve?
              <textarea rows={4} placeholder="Briefly describe the project, known size or unit count, and the decision you need to make." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
            </label>
            {error && <p className="formError" role="alert">{error}</p>}
            <button className="button buttonPrimary submitButton" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting request...' : 'Request a scope review'}
            </button>
            <p className="privacyNote">By submitting, you agree that Kealee may contact you about this project. Your details are not sold.</p>
          </form>
        </section>

        <footer>
          <Image src="/kealee-logo.png" alt="Kealee" width={132} height={38} />
          <p>Preconstruction clarity for better building decisions.</p>
          <span>© {new Date().getFullYear()} Kealee</span>
        </footer>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || 'preconstruction');
  const campaign: Campaign = {
    slug,
    eyebrow: 'Kealee preconstruction services',
    headline: 'Know what you are building before construction begins.',
    subheadline: 'Connect design concepts, catalogue-based estimating, and permit planning in one project workflow.',
  };

  return { props: { campaign } };
};
