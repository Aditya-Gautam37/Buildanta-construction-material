"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { MAX_VISIBLE_OPTIONS } from "./guided-wizard";

export type WizardGridOption = {
  id: string;
  name: string;
  href: string;
  description?: string | null;
  imageUrl?: string | null;
  imageScale?: number;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const hidden = Math.max(0, options.length - MAX_VISIBLE_OPTIONS);
  const visible = showAll ? options : options.slice(0, MAX_VISIBLE_OPTIONS);

  return <section className={`child-category-section wizard-option-section ${variant === "brand" ? "brand-choice-section" : ""}`}>
    <div className="section-heading-row">
      <div>
        <p>Continue</p>
        <h2>{heading}</h2>
        {subheading && <span>{subheading}</span>}
      </div>
      <span className="wizard-choice-count" aria-label={`${options.length} choices available`}>
        <b>{options.length}</b>
        <small>choices</small>
      </span>
    </div>

    <div className={`child-category-grid ${variant === "brand" ? "brand-choice-grid" : ""}`}>
      {visible.map((option, index) => (
        <a
          href={option.href}
          key={option.id}
          className={selectedId === option.id ? "is-selected" : undefined}
          aria-current={selectedId === option.id ? "step" : undefined}
          onClick={() => setSelectedId(option.id)}
          style={{ "--wizard-option-index": index } as CSSProperties}
        >
          <span className="wizard-option-visual">
            {option.imageUrl ? (
              <span className="wizard-image-motion">
                <Image
                  src={option.imageUrl}
                  alt={variant === "brand" ? `${option.name} logo` : ""}
                  fill
                  sizes="(max-width: 760px) 46vw, (max-width: 1120px) 30vw, 220px"
                  loading="lazy"
                  unoptimized
                  style={option.imageScale ? { transform: `scale(${option.imageScale})` } : undefined}
                />
              </span>
            ) : <b>{option.name.slice(0, 1)}</b>}
            <i className="wizard-option-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
          </span>
          <div className="wizard-option-copy">
            <h3>{option.name}</h3>
            <p>{option.description || "Browse published products."}</p>
            <small>{option.productCount} {option.productCount === 1 ? "product" : "products"}</small>
          </div>
          <span className="wizard-option-status" aria-hidden="true">
            <i>✓</i><b>→</b>
          </span>
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
