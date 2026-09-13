const features = [
  {
    number: "01",
    eyebrow: "LEARN",
    title: "Learn with clarity.",
    body: "Turn difficult topics into structured explanations, guided practice, and focused review.",
  },
  {
    number: "02",
    eyebrow: "CODE",
    title: "Build with intelligence.",
    body: "Plan, generate, understand, and improve code inside a focused AI workspace.",
  },
  {
    number: "03",
    eyebrow: "CREATE",
    title: "Ideas into projects.",
    body: "Move from a rough concept to a polished project with AI-assisted planning and iteration.",
  },
  {
    number: "04",
    eyebrow: "PROJECTS",
    title: "Keep progress connected.",
    body: "Organize learning, code, notes, and projects in one calm, consistent system.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="nav-shell">
        <a className="brand" href="#top" aria-label="AVENIDY home">
          <span className="brand-word">
            <span className="andy">A</span>VE<span className="andy">N</span>I
            <span className="andy">D</span><span className="andy">Y</span>
          </span>
          <span className="brand-dot" />
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#learn">Learn</a>
          <a href="#code">Code</a>
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
        </nav>

        <a className="nav-cta" href="/workspace">
          Enter workspace
          <span>↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />
        <div className="grid-overlay" />

        <div className="hero-copy">
          <p className="kicker">A more intelligent way to learn and create</p>
          <h1>
            Think.
            <span>Learn.</span>
            Build.
          </h1>
          <p className="hero-body">
            AVENIDY brings learning, coding, and project creation into one
            focused AI workspace — designed to help ideas become progress.
          </p>

          <div className="hero-actions" id="start">
            <a className="primary-btn" href="/workspace">
              Start exploring <span>→</span>
            </a>
            <a className="secondary-btn" href="#about">
              Discover AVENIDY
            </a>
          </div>

          <div className="hero-note">
            <span className="note-line" />
            <p>
              Hidden in the name: <b>A</b>VE<b>N</b>I<b>D</b><b>Y</b>.
            </p>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="orb orb-main">
            <div className="orb-core" />
            <div className="orb-ring ring-one" />
            <div className="orb-ring ring-two" />
          </div>

          <div className="signal-card card-a">
            <span>LEARNING</span>
            <strong>Adaptive guidance</strong>
          </div>
          <div className="signal-card card-b">
            <span>CODE</span>
            <strong>Build with AI</strong>
          </div>
          <div className="signal-card card-c">
            <span>PROJECTS</span>
            <strong>Ideas in motion</strong>
          </div>
        </div>
      </section>

      <section className="manifesto" id="about">
        <p>AVENIDY / 2026</p>
        <h2>
          Built for focused thinking,
          <br />
          not digital noise.
        </h2>
        <div className="manifesto-text">
          <p>
            We are shaping AVENIDY as a calm digital environment for learning,
            building, and exploring ideas with AI.
          </p>
          <p>
            The visual language uses deep midnight blue, mineral gray, warm
            copper, and ice-white — intentionally distinct from airline
            branding.
          </p>
        </div>
      </section>

      <section className="features" id="learn">
        <div className="section-head">
          <p>CORE EXPERIENCE</p>
          <h2>Learn. Create. Grow. With AI.</h2>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <article
              className="feature-card"
              id={index === 1 ? "code" : index === 3 ? "projects" : undefined}
              key={feature.number}
            >
              <div className="feature-top">
                <span>{feature.number}</span>
                <span className="feature-arrow">↗</span>
              </div>
              <p className="feature-eyebrow">{feature.eyebrow}</p>
              <h3>{feature.title}</h3>
              <p className="feature-body">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace">
        <div className="workspace-copy">
          <p className="kicker">ONE WORKSPACE</p>
          <h2>From question to project.</h2>
          <p>
            Start with a topic, an idea, or a problem. AVENIDY is designed to
            help you understand it, work through it, and turn it into something
            real.
          </p>
          <a className="text-link" href="#top">
            Preview the experience <span>→</span>
          </a>
        </div>

        <div className="workspace-ui">
          <div className="workspace-toolbar">
            <span className="mini-brand">AVENIDY</span>
            <div className="toolbar-tabs">
              <span className="active">Think</span>
              <span>Learn</span>
              <span>Build</span>
            </div>
          </div>
          <div className="workspace-content">
            <aside>
              <p>PROJECT</p>
              <strong>Biology Review</strong>
              <span>Overview</span>
              <span>Notes</span>
              <span>Questions</span>
              <span>Study plan</span>
            </aside>
            <div className="workspace-main">
              <div className="workspace-prompt">
                <p>Ask AVENIDY</p>
                <strong>
                  Explain the relationship between respiration and circulation,
                  then turn it into a study plan.
                </strong>
              </div>
              <div className="workspace-response">
                <span>01 / UNDERSTAND</span>
                <h3>Connect the systems first.</h3>
                <p>
                  Start with oxygen exchange, then trace how circulation moves
                  oxygen to cells and returns carbon dioxide to the lungs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div>
          <span className="footer-brand">AVENIDY</span>
          <p>Think. Learn. Build.</p>
        </div>
        <p>© 2026 AVENIDY. Concept v1.</p>
      </footer>
    </main>
  );
}
