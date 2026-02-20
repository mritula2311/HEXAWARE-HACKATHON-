'use client';

import Link from 'next/link';
import { Playfair_Display } from 'next/font/google';
import { ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'] });

const logos = ['Aurora', 'Lumen', 'Northwind', 'Helios', 'Vertex', 'Omni'] as const;

export default function LandingPage() {
  return (
    <div className="lp-wrapper">
      {/* Ambient hero blob */}
      <div className="lp-hero-blob" aria-hidden />

      {/* Announcement bar */}
      <div className="lp-announcement">
        <span className="lp-pill">New</span>
        <span>AI-led onboarding playbook just shipped.</span>
        <Link href="/login" className="lp-link">Read now</Link>
      </div>

      {/* Navbar */}
      <header className="lp-nav">
        <div className="lp-logo">MaverickAI</div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#benefits">Why us</a>
          <a href="#logos">Customers</a>
          <a href="#cta">Pricing</a>
        </nav>
        <div className="lp-actions">
          <Link href="/login" className="lp-btn-secondary">Sign in</Link>
          <Link href="/login" className="lp-btn-primary">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="lp-hero" id="top">
          <div className="lp-hero-content">
            <p className="lp-kicker">Intelligent onboarding • AI-native</p>
            <h1 className={`lp-heading ${playfair.className}`}>
              Bring clarity to onboarding with an elegant AI-first workspace.
            </h1>
            <p className="lp-body">
              A serene, autonomous platform that schedules, assesses, and guides every new joiner.
              Crafted with precision, powered by multi-agent AI, and wrapped in a calm, intentional experience.
            </p>
            <div className="lp-cta-row" id="cta">
              <Link href="/login" className="lp-btn-primary">
                Start in minutes <ArrowRight className="lp-icon" />
              </Link>
              <button className="lp-btn-secondary">Book a walkthrough</button>
            </div>
            <div className="lp-hero-meta">
              <div className="lp-meta-item">
                <ShieldCheck className="lp-icon" /> SOC2-ready confidence
              </div>
              <div className="lp-meta-item">
                <Star className="lp-icon" /> 4.9/5 from onboarding leaders
              </div>
            </div>
          </div>
          <div className="lp-hero-card" aria-label="Product preview">
            <div className="lp-card-head">
              <div className="lp-badge">Live cohort</div>
              <span className="lp-muted">Week 4 pulse</span>
            </div>
            <div className="lp-metric-grid">
              <div className="lp-metric">
                <span className="lp-metric-value">52%</span>
                <span className="lp-metric-label">Avg progress</span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-value">7</span>
                <span className="lp-metric-label">At risk</span>
              </div>
              <div className="lp-metric">
                <span className="lp-metric-value">3</span>
                <span className="lp-metric-label">Completed</span>
              </div>
            </div>
            <div className="lp-divider" />
            <div className="lp-list">
              {['Adaptive schedules', 'AI assessments', 'Risk alerts'].map((item) => (
                <div key={item} className="lp-list-row">
                  <Sparkles className="lp-icon" />
                  <div>
                    <p className="lp-list-title">{item}</p>
                    <p className="lp-list-copy">Calibrated daily with live data and intent signals.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Logos */}
        <section className="lp-logos" id="logos">
          <p className="lp-muted">Trusted by modern onboarding teams</p>
          <div className="lp-logo-row">
            {logos.map((name) => (
              <div key={name} className="lp-logo-pill">{name}</div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="lp-grid" id="features">
          <div className="lp-section-head">
            <p className="lp-kicker">Everything you need</p>
            <h2 className={`lp-heading-sm ${playfair.className}`}>Minimal surface, maximal clarity.</h2>
            <p className="lp-body">Purpose-built flows for managers, admins, and freshers—each view trimmed to essentials.</p>
          </div>
          <div className="lp-cards">
            {[{
              title: 'Manager view',
              copy: 'Real-time risk, AI assessment generator, and cohort pulse in a calm command center.',
            }, {
              title: 'Admin console',
              copy: 'Provision users, seed data, and audit access with near-black primary controls.',
            }, {
              title: 'Fresher journey',
              copy: 'Guided tasks, clean assessments, and focused progress with zero clutter.',
            }].map((card) => (
              <div key={card.title} className="lp-card">
                <h3 className={`lp-card-title ${playfair.className}`}>{card.title}</h3>
                <p className="lp-card-copy">{card.copy}</p>
                <button className="lp-link">Explore</button>
              </div>
            ))}
          </div>
        </section>

        {/* Secondary CTA */}
        <section className="lp-cta" id="benefits">
          <div>
            <p className="lp-kicker">Calm ops</p>
            <h2 className={`lp-heading-sm ${playfair.className}`}>A quieter, more intentional onboarding.</h2>
            <p className="lp-body">Ambient gradients, warm amber cues, and balanced whitespace keep teams focused.</p>
          </div>
          <div className="lp-cta-actions">
            <Link href="/login" className="lp-btn-primary">Launch now</Link>
            <button className="lp-btn-secondary">Talk to us</button>
          </div>
        </section>
      </main>

      {/* Page-scoped styles */}
      <style jsx global>{`
        .lp-wrapper {
          min-height: 100vh;
          background: radial-gradient(circle at 20% 20%, rgba(232,168,87,0.08), transparent 35%),
                      linear-gradient(180deg, var(--lp-bg-start), var(--lp-bg-end));
          color: var(--lp-body);
          position: relative;
          overflow-x: hidden;
        }
        .lp-hero-blob {
          position: absolute;
          inset: 0;
          background: radial-gradient(60% 50% at 70% 0%, rgba(232,168,87,0.45), rgba(201,125,58,0));
          filter: blur(60px);
          pointer-events: none;
        }
        .lp-announcement {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          background: linear-gradient(90deg, var(--lp-announcement-start), var(--lp-announcement-end));
          color: #fff;
          font-weight: 600;
          font-size: 14px;
        }
        .lp-pill {
          background: rgba(0,0,0,0.15);
          padding: 6px 10px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-size: 12px;
        }
        .lp-link {
          color: #fff;
          text-decoration: underline;
          text-underline-offset: 3px;
          font-weight: 600;
        }
        .lp-nav {
          position: sticky;
          top: 42px;
          z-index: 40;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 18px 40px;
          backdrop-filter: blur(16px);
        }
        .lp-logo {
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--lp-heading);
          font-size: 20px;
        }
        .lp-nav-links {
          display: flex;
          gap: 18px;
          justify-content: center;
          color: var(--lp-heading);
          font-weight: 600;
        }
        .lp-nav-links a { color: var(--lp-heading); text-decoration: none; }
        .lp-actions { justify-self: end; display: flex; gap: 12px; }
        .lp-btn-primary {
          background: var(--lp-primary);
          color: var(--lp-primary-foreground);
          border: 1px solid var(--lp-primary);
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 12px 30px rgba(28,28,30,0.2);
        }
        .lp-btn-secondary {
          background: #fff;
          color: var(--lp-primary);
          border: 1px solid var(--lp-secondary-border);
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .lp-hero {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 40px;
          padding: 80px 40px 60px;
          align-items: center;
        }
        .lp-hero-content { position: relative; z-index: 1; max-width: 720px; }
        .lp-kicker {
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 700;
          color: var(--lp-accent);
          font-size: 12px;
        }
        .lp-heading {
          color: var(--lp-heading);
          font-size: clamp(36px, 6vw, 60px);
          line-height: 1.05;
          margin: 12px 0 18px;
        }
        .lp-heading-sm {
          color: var(--lp-heading);
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.15;
          margin: 10px 0 12px;
        }
        .lp-body {
          color: var(--lp-body);
          font-size: 18px;
          line-height: 1.6;
          max-width: 640px;
        }
        .lp-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0 14px; }
        .lp-icon { width: 18px; height: 18px; }
        .lp-hero-meta { display: flex; flex-wrap: wrap; gap: 18px; color: var(--lp-body); font-weight: 600; }
        .lp-meta-item { display: inline-flex; align-items: center; gap: 8px; }

        .lp-hero-card {
          background: var(--lp-card);
          border-radius: 18px;
          padding: 22px;
          box-shadow: var(--lp-shadow);
          border: 1px solid rgba(0,0,0,0.04);
        }
        .lp-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .lp-badge {
          background: rgba(107,107,204,0.12);
          color: var(--lp-accent);
          padding: 8px 12px;
          border-radius: 12px;
          font-weight: 700;
        }
        .lp-muted { color: #6b7280; font-weight: 600; }
        .lp-metric-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; }
        .lp-metric { background: #fafafa; padding: 12px; border-radius: 12px; text-align: center; }
        .lp-metric-value { display: block; font-size: 26px; font-weight: 800; color: var(--lp-heading); }
        .lp-metric-label { color: var(--lp-body); font-weight: 600; font-size: 14px; }
        .lp-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 16px 0; }
        .lp-list { display: grid; gap: 14px; }
        .lp-list-row { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
        .lp-list-title { font-weight: 700; color: var(--lp-heading); }
        .lp-list-copy { color: var(--lp-body); font-size: 14px; }

        .lp-logos {
          padding: 20px 40px 0;
          text-align: center;
        }
        .lp-logo-row {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          filter: grayscale(1);
        }
        .lp-logo-pill {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          color: var(--lp-heading);
          box-shadow: var(--lp-shadow);
        }

        .lp-grid { padding: 70px 40px 30px; display: grid; gap: 28px; }
        .lp-section-head { max-width: 640px; }
        .lp-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; }
        .lp-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: var(--lp-shadow);
          border: 1px solid rgba(0,0,0,0.04);
        }
        .lp-card-title { color: var(--lp-heading); font-size: 20px; margin-bottom: 10px; }
        .lp-card-copy { color: var(--lp-body); margin-bottom: 12px; line-height: 1.5; }

        .lp-cta {
          margin: 20px 40px 80px;
          padding: 28px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(232,168,87,0.18), rgba(107,107,204,0.15));
          box-shadow: var(--lp-shadow);
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
        }
        .lp-cta-actions { display: flex; gap: 12px; }

        @media (max-width: 900px) {
          .lp-nav { grid-template-columns: 1fr 1fr; row-gap: 12px; }
          .lp-nav-links { display: none; }
          .lp-actions { justify-self: start; }
          .lp-hero { padding-top: 60px; grid-template-columns: 1fr; }
          .lp-announcement { position: relative; }
          .lp-nav { top: 0; }
        }
      `}</style>
    </div>
  );
}
