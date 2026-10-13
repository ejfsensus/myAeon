"use client";
import type { ThemeMode } from "./types";
export default function WelcomeScreen({
  theme,
  onToggleTheme,
  onStart,
  onExplore,
  onZeus,
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onStart: (mode: "today" | "full") => void;
  onExplore: () => void;
  onZeus: () => void;
}) {
  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <header className="welcome-header">
        <img
          src="/brand/my-aeon-wordmark.png"
          alt="myAeon"
          width={1456}
          height={449}
        />
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? "☼" : "☾"}
        </button>
      </header>
      <div className="welcome-orbit" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="welcome-copy">
        <p className="eyebrow">A little perspective. A wider sky.</p>
        <h1 id="welcome-title">Meet this moment.</h1>
        <p className="welcome-intro">
          Explore your sky, understand your patterns, and find a thoughtful way
          into the day.
        </p>
        <button className="welcome-today" onClick={() => onStart("today")}>
          <span className="eyebrow">TODAY · QUICK READING</span>
          <strong>
            Your day, in focus <span aria-hidden>↗</span>
          </strong>
          <span>
            A concise reflection, spoken over quiet music.
            <br />
            Your reading and PDF, ready to keep.
          </span>
        </button>
        <div className="welcome-secondary">
          <button onClick={() => onStart("full")}>
            Take the longer journey{" "}
            <span>Four horizons · under 10 minutes of audio</span>
          </button>
          <button onClick={onExplore}>
            Explore the planets <span>Move through the solar system</span>
          </button>
        </div>
        <button className="welcome-zeus" onClick={onZeus}>
          <img src={`/zeus/${theme}.png`} alt="" width={64} height={64} />
          <span>
            <strong>A conversation with Zeus</strong>
            <small>A wise companion for the questions you bring.</small>
          </span>
          <span aria-hidden>↗</span>
        </button>
        <p className="welcome-footnote">
          Astrology as reflection. The choices remain yours.
        </p>
      </div>
    </section>
  );
}
