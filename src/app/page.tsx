import Reveal from "../components/Reveal";
import {
  about,
  awards,
  contact,
  interlude,
  intro,
  projects,
  publication,
  researchInterests,
  site,
} from "../content";

function Placeholder({ text }: { text: string }) {
  return (
    <p className="placeholder">
      <strong>To add:</strong> {text.replace(/^To add:\s*/, "")}
    </p>
  );
}

function isPlaceholder(text: string) {
  return text.startsWith("To add:");
}

export default function Home() {
  return (
    <main>
      {/* Intro */}
      <section aria-label="Introduction">
        <div className="column">
          <p className="section-label">{site.availability}</p>
          <h1>{intro.headline}</h1>
          <p className="lede">{intro.subhead}</p>
          {isPlaceholder(intro.tagline) ? (
            <Placeholder text={intro.tagline} />
          ) : (
            <p className="lede">{intro.tagline}</p>
          )}
          {isPlaceholder(intro.headshot) ? (
            <Placeholder text={intro.headshot} />
          ) : (
            <p>{intro.headshot}</p>
          )}
          <div className="vessel-field" aria-hidden="true" />
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a> ·{" "}
            <a href={site.linkedin}>LinkedIn</a> · <a href={site.github}>GitHub</a>
          </p>
        </div>
      </section>

      {/* About */}
      <section id="about" aria-label="About">
        <Reveal>
          <div className="column">
            <p className="section-label">01 / About</p>
            <h2>{about.heading}</h2>
            {about.paragraphs.map((p, i) =>
              isPlaceholder(p) ? <Placeholder key={i} text={p} /> : <p key={i}>{p}</p>
            )}
            <dl className="fact-grid">
              {about.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
            {isPlaceholder(about.lookingFor) ? (
              <Placeholder text={about.lookingFor} />
            ) : (
              <p>{about.lookingFor}</p>
            )}
          </div>
        </Reveal>
      </section>

      {/* Awards as a graphic collage */}
      <section id="awards" aria-label="Awards">
        <Reveal>
          <div className="column">
            <p className="section-label">02 / Recognition</p>
            <h2>Awards, treated as proof, not a list.</h2>
          </div>
          <div className="award-collage">
            {awards.map((a) => (
              <article key={a.title} className={`award-cell ${a.size}`}>
                <p className="award-title">{a.title}</p>
                <p className="award-detail">{a.detail}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Work and research as a scroll sequence */}
      <section id="work" aria-label="Work">
        <div className="column">
          <p className="section-label">03 / Work, in sequence</p>
          <h2>Scroll through the work, one project at a time.</h2>
        </div>
      </section>

      {projects.map((p) => (
        <section key={p.id} className="project-section" aria-label={p.org}>
          <div className="giant-word" aria-hidden="true">
            {p.giantWord}
          </div>
          <Reveal>
            <div className="column">
              <p className="project-meta">
                {p.role} · {p.org} · {p.period}
              </p>
              <h2>{p.org}</h2>
              <p className="lede">{p.summary}</p>
              <ul>
                {p.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="tag-row">
                {p.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
              {p.links.length > 0 && (
                <p className="project-links">
                  {p.links.map((l) =>
                    isPlaceholder(l.label) ? (
                      <span key={l.label} className="placeholder">
                        <strong>To add:</strong> {l.label.replace(/^To add:\s*/, "")}
                      </span>
                    ) : (
                      <a key={l.label} href={l.href}>
                        {l.label}
                      </a>
                    )
                  )}
                </p>
              )}
            </div>
          </Reveal>
        </section>
      ))}

      {/* Research */}
      <section id="research" aria-label="Research">
        <Reveal>
          <div className="column">
            <p className="section-label">04 / Research</p>
            <h2>What I am trying to learn, and why.</h2>
            <ul>
              {researchInterests.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <h3>Publication</h3>
            <p>
              {publication.citation}{" "}
              <a href={publication.link}>Read it</a>
            </p>
          </div>
        </Reveal>
      </section>

      {/* Personal interlude */}
      <section aria-label="Interlude">
        <Reveal>
          <div className="column">
            <p className="section-label">05 / Interlude</p>
            <h2>{interlude.heading}</h2>
            {isPlaceholder(interlude.text) ? (
              <Placeholder text={interlude.text} />
            ) : (
              <p>{interlude.text}</p>
            )}
          </div>
        </Reveal>
      </section>

      {/* Contact close */}
      <section id="contact" className="contact-close" aria-label="Contact">
        <Reveal>
          <div className="column">
            <p className="section-label">06 / Contact</p>
            <h2>{contact.heading}</h2>
            <p className="lede">{contact.text}</p>
            <a className="contact-circle" href={`mailto:${site.email}`}>
              Email Arush
            </a>
            <p>
              <a href={site.linkedin}>LinkedIn</a> · <a href={site.github}>GitHub</a>
            </p>
            {isPlaceholder(contact.preferences) ? (
              <Placeholder text={contact.preferences} />
            ) : (
              <p>{contact.preferences}</p>
            )}
            {isPlaceholder(contact.resumeDownload) ? (
              <Placeholder text={contact.resumeDownload} />
            ) : (
              <p>
                <a href={contact.resumeDownload}>Download resume (PDF)</a>
              </p>
            )}
          </div>
        </Reveal>
      </section>

      <p className="footer-note">
        Built with Next.js and React. Content lives in src/content.ts, so copy can be edited without touching layout code.
      </p>
    </main>
  );
}
