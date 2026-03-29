import { Link } from 'react-router-dom';
import type { ActivePackId } from '../types/packs';
import { getPackArt } from '../data/packAssets';
import './LandingHero.css';

/**
 * Decorative fan only (L→R): L3 Planning, L2 Crunchyroll, L1 HIDIVE | AniRec | R1 Prime, R2 Netflix, R3 Hulu.
 * Prime Video = `amazon` id in app data.
 */
const FAN_ORDER: ActivePackId[] = [
  'planning',
  'crunchyroll',
  'hidive',
  'anirec',
  'amazon',
  'netflix',
  'hulu',
];

function StorefrontStrokeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeLinejoin="round" />
      <path d="M3 9V7a2 2 0 012-2h14a2 2 0 012 2v2" />
      <path d="M9 14h.01M15 14h.01" strokeLinecap="round" />
    </svg>
  );
}

export function LandingHero() {
  return (
    <main className="landing-hero">
      <div className="landing-hero-bg" aria-hidden />

      <div className="landing-hero-inner">
        <h1 className="landing-headline">
          Rip open your next
          <span className="landing-headline-accent"> obsession</span>
        </h1>

        <p className="landing-lede">
          Walk the booster counter, pick a pack, and pull a personalised title from your taste profile—like finding a holo in the wild.
        </p>

        <div className="landing-cta-row">
          <Link to="/card-shop" className="landing-cta-primary">
            <span className="landing-cta-market-icon" aria-hidden>
              <StorefrontStrokeIcon size={22} />
            </span>
            Open the shop
          </Link>
        </div>
      </div>

      <div className="landing-fan-bleed" aria-hidden="true">
        <div className="landing-fan-wrap">
          <ul className="landing-fan">
            {FAN_ORDER.map((id, i) => {
              const art = getPackArt(id);
              const isCenter = id === 'anirec';
              const centerIdx = FAN_ORDER.indexOf('anirec');
              const offset = i - centerIdx;
              const baseRotate = offset * 10;
              const z = 5 - Math.abs(offset) + (isCenter ? 3 : 0);
              return (
                <li key={id} className="landing-fan-item">
                  <div
                    className={`landing-fan-card ${isCenter ? 'landing-fan-card--center' : ''}`}
                    style={{
                      zIndex: z,
                      transform: `rotate(${baseRotate}deg)`,
                    }}
                  >
                    <img
                      className="landing-fan-card-img"
                      src={art.front}
                      alt=""
                      draggable={false}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="landing-hero-inner">
        <section className="landing-mission" aria-labelledby="landing-mission-title">
          <div className="landing-mission-divider" aria-hidden />
          <p className="landing-mission-eyebrow">What we&apos;re building</p>
          <h2 id="landing-mission-title" className="landing-mission-headline">
            Serious discovery, wrapped in the joy of the rip
          </h2>
          <p className="landing-mission-lede">
            AniRec isn&apos;t another endless scroll. We treat recommendations like trading cards: one active pack,
            one pull at a time, grounded in your real AniList history—so every title feels earned, not algorithmic
            noise.
          </p>
          <ul className="landing-mission-grid">
            <li className="landing-mission-card">
              <span className="landing-mission-icon landing-mission-icon--blue" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
                  <path d="M4 20a8 8 0 0 1 16 0" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="landing-mission-card-title">Your list, your rules</h3>
              <p className="landing-mission-card-body">
                We read your AniList profile—completed, watching, and plan-to-watch—so pulls stay personal, not
                generic.
              </p>
            </li>
            <li className="landing-mission-card">
              <span className="landing-mission-icon landing-mission-icon--purple" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" />
                  <rect x="13" y="4" width="7" height="7" rx="1.5" />
                  <rect x="4" y="13" width="7" height="7" rx="1.5" />
                  <rect x="13" y="13" width="7" height="7" rx="1.5" />
                </svg>
              </span>
              <h3 className="landing-mission-card-title">Packs that match the moment</h3>
              <p className="landing-mission-card-body">
                Master pool, planning queue, or a streaming SKU—pick the shelf before you pull, then swap anytime in
                the shop.
              </p>
            </li>
            <li className="landing-mission-card">
              <span className="landing-mission-icon landing-mission-icon--pink" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 3v2M12 19v2M3 12h2M19 12h2" strokeLinecap="round" />
                  <path d="M7 7l1.5 1.5M15.5 15.5 17 17M7 17l1.5-1.5M15.5 8.5 17 7" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
              </span>
              <h3 className="landing-mission-card-title">Curated randomness</h3>
              <p className="landing-mission-card-body">
                Surprise without chaos: each rip is filtered through your taste so discovery feels exciting—not
                random spam.
              </p>
            </li>
            <li className="landing-mission-card">
              <span className="landing-mission-icon landing-mission-icon--cyan" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="landing-mission-card-title">Crafted like a product</h3>
              <p className="landing-mission-card-body">
                Polished UI, thoughtful motion, and a clear loop: search, pack, pull, repeat. Built for fans who
                care how things feel.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
