import Planner from "./planner";

const steps = [
  { number: "01", title: "Begin with a favourite", detail: "Choose music, films or shows the person already enjoys. Confirm the exact match before exploring." },
  { number: "02", title: "Consider a few possibilities", detail: "See the source behind a related suggestion, review content notes, and decide what belongs." },
  { number: "03", title: "Make the session yours", detail: "Keep a small accepted session in order. Follow the person’s lead and change course whenever needed." },
];

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <a href="/" className="wordmark" aria-label="Reminiscence Companion home">
          <span className="brand-mark" aria-hidden="true">r.</span>
          <span>Reminiscence<br /><strong>Companion</strong></span>
        </a>
        <span className="preview-label">Caregiver-guided activities</span>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Familiar favourites. Your final say.</p>
          <h1 id="hero-title">Start with what<br />they <em>love.</em></h1>
          <p className="hero-copy">A little music. A familiar face. Something to talk about. Prepare a small activity session around the person you know.</p>
          <a className="primary-link" href="#planner">Prepare a session <span aria-hidden="true">↗</span></a>
          <p className="preview-note">An activity aid for caregivers. Not medical advice or therapy. Follow the person&apos;s lead.</p>
        </section>
        <Planner />
        <section id="how-it-works" className="steps-section" aria-labelledby="steps-title">
          <div className="section-heading">
            <p className="eyebrow">A gentle starting point</p>
            <h2 id="steps-title">You know the person.<br />The suggestions are possibilities.</h2>
          </div>
          <ol className="steps-grid">
            {steps.map((step) => (
              <li className="step-card" key={step.number}>
                <span className="step-number" aria-hidden="true">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>
        <aside className="care-note" aria-label="Activity aid disclaimer">
          <strong>Follow the person’s lead.</strong>
          <p>An activity aid for caregivers. Not medical advice or therapy. Follow the person&apos;s lead.</p>
          <p className="care-detail">A cultural connection does not establish a personal memory or predict enjoyment. Every activity stays your choice.</p>
        </aside>
      </main>
      <footer className="site-footer"><span>Reminiscence Companion · hackathon preview</span><span>An activity aid for caregivers. Not medical advice or therapy. Follow the person&apos;s lead.</span></footer>
    </>
  );
}
