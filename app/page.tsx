import Link from "next/link";
import { SiteHeader, SiteFooter } from "./components/site-chrome";

const steps = [
  { number: "01", title: "Start with a favourite", detail: "Enter a singer, film or TV show the person already enjoys. Confirm the right match, then explore related possibilities." },
  { number: "02", title: "Review together, your way", detail: "See why something was suggested and read its content notes. Keep what feels right; reject or skip what doesn’t." },
  { number: "03", title: "Make a small session", detail: "Choose two or three activities, put them in order, and set a little time to listen, look or talk. You decide what to include." },
  { number: "04", title: "Save it for another day", detail: "With an account, save your session privately and reopen it on another device. Record what worked and adjust next time." },
];

export default function HomePage() {
  return <>
    <SiteHeader />
    <main id="main">
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="hero-text">
          <p className="eyebrow audience-label">For caregivers of people living with dementia</p>
          <h1 id="hero-title">A familiar song.<br />A little time.<br /><em>Something to share.</em></h1>
          <p className="hero-copy">Prepare a short session of music, films and conversation around the things your loved one enjoys. A practical starting point for family caregivers, with every choice in your hands.</p>
          <div className="hero-actions"><Link className="primary-link" href="/sign-up" prefetch={false}>Create your account <span aria-hidden="true">↗</span></Link><Link className="secondary-link" href="/demo" prefetch={false}>Try without an account <span aria-hidden="true">→</span></Link></div>
          <p className="preview-note">An activity aid for caregivers. Not medical advice or therapy. Follow the person&apos;s lead.</p>
        </div>
        <div className="session-preview" aria-label="Illustrative example of a short activity session">
          <div className="preview-heading"><span className="eyebrow">A little time together</span><span className="preview-sun" aria-hidden="true">✳</span></div>
          <p className="preview-script">Start with something<br />they already love.</p>
          <div className="sample-activity"><span className="activity-art record-art" aria-hidden="true"><span /></span><div><span className="sample-kind">01 · Listen</span><h2>A favourite singer</h2><p>Play a familiar recording together.</p></div><span className="sample-time">5 min</span></div>
          <div className="sample-activity"><span className="activity-art film-art" aria-hidden="true">▤</span><div><span className="sample-kind">02 · Look</span><h2>A well-loved film</h2><p>A clip, a face, a place to begin.</p></div><span className="sample-time">5 min</span></div>
          <div className="sample-activity"><span className="activity-art talk-art" aria-hidden="true">❞</span><div><span className="sample-kind">03 · Talk</span><h2>Follow their lead</h2><p>“Would you like to hear that again?”</p></div><span className="sample-time">3 min</span></div>
          <p className="sample-caption">Illustrative session · activity times are your choice.<br />There’s no need to remember, answer, or finish.</p>
        </div>
      </section>
      <section className="purpose-strip" aria-label="What the app helps you do"><p><strong>Made for the person doing the caring.</strong><span>Plan something to share, with familiar favourites as your starting point.</span></p><a href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a></section>
      <section className="audience-section" id="who-it-is-for" aria-labelledby="audience-title"><div><p className="eyebrow">Who it’s for</p><h2 id="audience-title">You know the person.<br />We help with the starting point.</h2></div><div><p>If you care for a partner, parent, relative or friend living with dementia, choosing an activity can take time. Reminiscence Companion helps you put a few possibilities in one place.</p><p>Bring a favourite singer, film or show. Explore related ideas, check whether they suit the person today, and build a short session at their pace.</p><p className="small-note">Designed for a caregiver to use alongside the person they support. It does not assess memory, diagnose dementia or provide treatment.</p></div></section>
      <section id="how-it-works" className="steps-section landing-steps" aria-labelledby="steps-title"><div className="section-heading"><p className="eyebrow">From a favourite to time together</p><h2 id="steps-title">A few simple steps.<br />Your judgement, throughout.</h2></div><ol className="steps-grid">{steps.map(step => <li className="step-card" key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.detail}</p></li>)}</ol></section>
      <section className="trust-section" aria-labelledby="trust-title"><div><p className="eyebrow">Suggestions with context</p><h2 id="trust-title">A connection to explore.<br />Never a promise.</h2><p>Qloo finds connections between cultural tastes across groups. Gemini helps select a small set and flags themes in the returned descriptions. You can inspect the source, reject suggestions and refresh the list.</p></div><ul><li><strong>You make the final choice.</strong> Nothing enters your session until you accept it.</li><li><strong>Content notes need your review.</strong> Ratings and automated checks can miss things; they do not establish suitability.</li><li><strong>Preferences are personal.</strong> A cultural connection cannot predict enjoyment or establish a personal memory.</li></ul></section>
      <section className="landing-invitation" aria-labelledby="invitation-title"><span className="eyebrow">Begin with one thing they enjoy</span><h2 id="invitation-title">Make room for a little<br /><em>time together.</em></h2><Link className="primary-link" href="/sign-up" prefetch={false}>Create your account <span aria-hidden="true">↗</span></Link><p><Link href="/demo" prefetch={false}>Or explore the live demo — no account needed</Link></p></section>
    </main>
    <SiteFooter />
  </>;
}
