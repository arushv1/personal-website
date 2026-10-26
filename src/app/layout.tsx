import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";
import { site } from "../content";

export const metadata: Metadata = {
  title: `${site.name} | Medical Imaging AI`,
  description:
    "Arush Vyas: medical imaging AI, foundation models, segmentation, and evaluation. Boston University biomedical engineering, class of 2027.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="frame" aria-hidden="true" />
        <header className="site-header">
          <div className="header-cell">
            <span className="monogram">{site.monogram}</span>
            <span>{site.name}</span>
          </div>
          <div className="header-cell status">{site.status}</div>
          <div className="header-cell location">{site.location}</div>
          <nav aria-label="Sections">
            <a href="#about">About</a>
            <a href="#awards">Awards</a>
            <a href="#work">Work</a>
            <a href="#research">Research</a>
          </nav>
          <div className="header-cell">
            <ThemeToggle />
            <a className="contact-action" href="#contact">
              Contact
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
