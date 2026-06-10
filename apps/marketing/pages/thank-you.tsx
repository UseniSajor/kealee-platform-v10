import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

const serviceLabels: Record<string, string> = {
  design_concept: 'design concept',
  cost_estimate: 'construction estimate',
  permit_path_only: 'permit plan',
  full_preconstruction: 'preconstruction plan',
};

export default function ThankYou() {
  const router = useRouter();
  const name = typeof router.query.name === 'string' ? router.query.name : '';
  const service = typeof router.query.service === 'string' ? router.query.service : 'full_preconstruction';

  return (
    <>
      <Head>
        <title>Request received | Kealee</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="thankYouPage">
        <header className="siteHeader thankYouHeader">
          <Image src="/kealee-logo.png" alt="Kealee" width={166} height={48} priority />
        </header>
        <section className="thankYouCard">
          <span className="successMark">✓</span>
          <p className="eyebrow dark">Request received</p>
          <h1>{name ? `${name}, your` : 'Your'} project is in the right place.</h1>
          <p>We received your request for a {serviceLabels[service] || 'preconstruction plan'}. The next review will focus on scope, available inputs, and the most useful next step.</p>
          <div className="nextSteps">
            <h2>What happens next</h2>
            <ol>
              <li><span>1</span> We review the project details and location.</li>
              <li><span>2</span> We identify missing inputs and the appropriate service path.</li>
              <li><span>3</span> You receive a response with clear next actions.</li>
            </ol>
          </div>
          <a className="button buttonPrimary" href="/campaigns/preconstruction">Return to preconstruction services</a>
        </section>
      </main>
    </>
  );
}
