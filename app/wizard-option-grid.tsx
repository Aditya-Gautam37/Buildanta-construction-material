"use client";

import { useState } from "react";
import { MAX_VISIBLE_OPTIONS } from "./guided-wizard";

export type WizardGridOption = {
  id: string;
  name: string;
  href: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount: number;
};

/**
 * One decision per screen, six options at a time. The cap is the whole point:
 * Paints already has eleven children and will grow, and a shopper asked to
 * scan eleven tiles is back to the flat grid this replaces.
 */
export function WizardOptionGrid({
  heading,
  subheading,
  options,
  variant = "category",
}: {
  heading: string;
  subheading?: string;
  options: WizardGridOption[];
  variant?: "category" | "brand";
}) {
  const [showAll, setShowAll] = useState(false);
  const hidden = Math.max(0, options.length - MAX_VISIBLE_OPTIONS);
  const visible = showAll ? options : options.slice(0, MAX_VISIBLE_OPTIONS);

  return <section className={`child-category-section ${variant === "brand" ? "brand-choice-section" : ""}`}>
    <div className="section-heading-row">
      <div>
        <p>Continue</p>
        <h2>{heading}</h2>
        {subheading && <span>{subheading}</span>}
      </div>
    </div>

    <div className={`child-category-grid ${variant === "brand" ? "brand-choice-grid" : ""}`}>
      {visible.map((option) => (
        <a href={option.href} key={option.id}>
          <span>
            {option.imageUrl ? <img src={option.imageUrl} alt="" loading="lazy" /> : <b>{option.name.slice(0, 1)}</b>}
          </span>
          <div>
            <h3>{option.name}</h3>
            <p>{option.description || "Browse published products."}</p>
            <small>{option.productCount} {option.productCount === 1 ? "product" : "products"} →</small>
          </div>
        </a>
      ))}
    </div>

    {hidden > 0 && !showAll && (
      <button type="button" className="wizard-see-all" onClick={() => setShowAll(true)}>
        See all {options.length} options <span aria-hidden="true">▾</span>
      </button>
    )}
  </section>;
}
