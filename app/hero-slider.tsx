"use client";

import { useEffect, useState } from "react";
import type { HomepageSlide } from "./homepage-content";

export function HeroSlider({ slides }: { slides: HomepageSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const move = (direction: number) => setActive((current) => (current + direction + slides.length) % slides.length);

  return (
    <section className="home-hero home-hero-slider" aria-roledescription="carousel" aria-label="Buildanta highlights" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      {slides.map((slide, index) => (
        <article className={`hero-slide ${index === active ? "active" : ""}`} aria-hidden={index !== active} key={slide.id}>
          <img src={slide.imageUrl} alt={index === active ? slide.altText : ""} />
          <div className="hero-shade" />
          <div className="home-hero-copy">
            <p className="live-catalog-pill"><span /> Live catalogue powered by Buildanta Inventory</p>
            <h1>{slide.title}</h1>
            {slide.subtitle && <p>{slide.subtitle}</p>}
            <div>
              {slide.ctaLabel && slide.ctaHref && <a className="button orange" href={slide.ctaHref} tabIndex={index === active ? 0 : -1}>{slide.ctaLabel}</a>}
              <a className="button navy" href="/bulk-quotes" tabIndex={index === active ? 0 : -1}>Get project pricing</a>
            </div>
          </div>
        </article>
      ))}
      {slides.length > 1 && <><button className="hero-arrow previous" type="button" onClick={() => move(-1)} aria-label="Previous slide">‹</button><button className="hero-arrow next" type="button" onClick={() => move(1)} aria-label="Next slide">›</button><div className="hero-dots" aria-label="Choose a slide">{slides.map((slide, index) => <button className={index === active ? "active" : ""} type="button" onClick={() => setActive(index)} aria-label={`Show slide ${index + 1}: ${slide.title}`} aria-current={index === active ? "true" : undefined} key={slide.id} />)}</div></>}
    </section>
  );
}
