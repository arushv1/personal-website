import Reveal from "../components/Reveal";
import TileGrid from "../components/TileGrid";
import VesselTrace from "../components/VesselTrace";
import {
  awards,
  contact,
  courses,
  education,
  experiences,
  intro,
  projects,
  publications,
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
          <TileGrid label="A grid of whole slide tiles, zooming in as it scrolls into view" />
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a> ·{" "}
            <a href={site.linkedin}>LinkedIn</a> · <a href={site.github}>GitHub</a>
          </p>
        </div>
      </section>

      {/* Education */}
      <section id="education" aria-label="Education">
        <Reveal>
          <div className="column">
            <p className="section-label">01 / Education</p>
            <h2>{education.school}</h2>
            <p className="lede">
              {education.degree}, {education.period}. GPA {education.gpa}.
            </p>
            <dl className="fact-grid">
              {education.facts.map((f) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </section>

      {/* Experiences */}
      <section id="experiences" aria-label="Experiences">
        <Reveal>
          <div className="column">
            <p className="section-label">02 / Experiences</p>
            <h2>Where the work happened.</h2>
            <VesselTrace label="A vessel line tracing itself across the experiences section" />
            <div className="experience-list">
              {experiences.map((e) => (
                <article key={e.org} className="experience-card">
                  <p className="project-meta">
                    {e.role} · {e.org} · {e.period}
                  </p>
                  <h3>{e.org}</h3>
                  <p>{e.summary}</p>
                  <ul>
                    {e.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Projects as a scroll sequence */}
      <section id="projects" aria-label="Projects">
        <div className="column">
          <p className="section-label">03 / Projects</p>
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

      {/* Awards as a graphic collage */}
      <section id="awards" aria-label="Awards">
        <Reveal>
          <div className="column">
            <p className="section-label">04 / Awards</p>
            <h2>Recognition, treated as proof, not a list.</h2>
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

      {/* Publications */}
      <section id="publications" aria-label="Publications">
        <Reveal>
          <div className="column">
            <p className="section-label">05 / Publications</p>
            <h2>Published work, and what is coming next.</h2>
            {publications.published.map((pub) => (
              <article key={pub.link} className="publication-card">
                <p>
                  {pub.citation} <a href={pub.link}>Read it</a>
                </p>
              </article>
            ))}
            <h3>Manuscript in progress</h3>
            {publications.planned.map((p) =>
              isPlaceholder(p) ? <Placeholder key={p} text={p} /> : <p key={p}>{p}</p>
            )}
            <h3>Research direction</h3>
            <ul>
              {researchInterests.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Courses: entirely placeholders, nothing on record */}
      <section id="courses" aria-label="Courses">
        <Reveal>
          <div className="column">
            <p className="section-label">06 / Courses</p>
            <h2>Coursework worth showing.</h2>
            <p className="lede">{courses.note}</p>
            <div className="course-grid">
              {courses.placeholders.map((c) => (
                <p key={c} className="placeholder course-slot">
                  <strong>To add:</strong> {c.replace(/^To add:\s*/, "")}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Contact close */}
      <section id="contact" className="contact-close" aria-label="Contact">
        <Reveal>
          <div className="column">
            <p className="section-label">07 / Contact</p>
            <h2>{contact.heading}</h2>
            <p className="lede">{contact.text}</p>
            <a className="contact-circle" href={`mailto:${site.email}`}>
              Email Arush
            </a>
            <p>
              <a href={site.linkedin}>LinkedIn</a> · <a href={site.github}>GitHub</a> ·{" "}
              {site.location}
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
