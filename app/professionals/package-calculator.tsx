"use client";

import { useMemo, useState } from "react";
import {
  areaLabel,
  estimatePackages,
  formatRange,
  formatRupees,
  MIN_AREA_SQ_FT,
  type ContractorPackage,
  type PackageMaterial,
} from "./package-estimate";
import { PackageEnquiryForm } from "./package-enquiry-form";
import styles from "./package-calculator.module.css";

const QUICK_AREAS = [500, 900, 1200, 1800];
const DEFAULT_AREA = "900";

function InclusionList({ title, items, tone }: { title: string; items: string[]; tone?: "exclusion" }) {
  if (!items.length) return null;
  return (
    <div className={tone === "exclusion" ? `${styles.block} ${styles.exclusionBlock}` : styles.block}>
      <h5>{title}</h5>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function MaterialList({ materials }: { materials: PackageMaterial[] }) {
  if (!materials.length) return null;
  return (
    <div className={styles.block}>
      <h5>Materials used</h5>
      <dl className={styles.materials}>
        {materials.map((material) => (
          <div key={`${material.category}-${material.specification}`}>
            <dt>{material.category}</dt>
            <dd>{material.specification}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function PackageCalculator({ packages, professionalName, slug }: {
  packages: ContractorPackage[];
  professionalName: string;
  slug: string;
}) {
  const [areaText, setAreaText] = useState(DEFAULT_AREA);
  const [enquiringAbout, setEnquiringAbout] = useState<string | null>(null);
  const area = Number(areaText);
  const result = useMemo(() => estimatePackages(packages, area), [packages, area]);

  // Nothing published: never render an empty calculator or a zero cost.
  if (result.status === "unavailable") return null;

  const byId = new Map(packages.map((item) => [item.id, item]));

  return (
    <section className={styles.calculator} aria-labelledby="package-calculator-title">
      <header className={styles.head}>
        <p className="profile-kicker">COST ESTIMATE</p>
        <h2 id="package-calculator-title">What would {professionalName} charge?</h2>
        <p className={styles.intro}>
          Enter your plot area to see this contractor&rsquo;s published packages.
          Figures update as you type.
        </p>
      </header>

      <div className={styles.controls}>
        <label className={styles.areaField} htmlFor="plot-area">
          <span>{areaLabel(packages[0]?.rateBasis ?? "PLOT_AREA")}</span>
          <input
            id="plot-area"
            type="number"
            inputMode="numeric"
            min={MIN_AREA_SQ_FT}
            step="10"
            value={areaText}
            onChange={(event) => setAreaText(event.target.value)}
            className={styles.areaInput}
          />
        </label>
        <div className={styles.quickPicks} role="group" aria-label="Common plot sizes">
          {QUICK_AREAS.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setAreaText(String(value))}
              className={area === value ? `${styles.chip} ${styles.chipActive}` : styles.chip}
              aria-pressed={area === value}
            >
              {value} sq ft
            </button>
          ))}
        </div>
      </div>

      {result.status === "invalid" ? (
        <p className={styles.invalid} role="alert">{result.reason}</p>
      ) : (
        <>
          <p className={styles.range}>
            <strong>{formatRange(result.lowest, result.highest)}</strong>
            <span>estimated for {result.area.toLocaleString("en-IN")} sq ft</span>
          </p>

          <div className={styles.packages}>
            {result.estimates.map((estimate) => {
              const source = byId.get(estimate.packageId);
              if (!source) return null;
              return (
                <article className={styles.package} key={estimate.packageId}>
                  <header>
                    <h3>{source.name}</h3>
                    {source.tagline ? <p className={styles.tagline}>{source.tagline}</p> : null}
                    <p className={styles.rate}>
                      {formatRupees(estimate.ratePerSqFt)} <span>per sq ft</span>
                    </p>
                  </header>

                  <p className={styles.total}>
                    <span>Estimated cost</span>
                    <strong>{formatRupees(estimate.totalCost)}</strong>
                  </p>

                  <InclusionList title="Included works" items={source.inclusionItems.map((item) => item.label)} />
                  <MaterialList materials={source.materials} />
                  <InclusionList title="Best for" items={source.bestFor} />
                  {/* Never hidden behind a toggle: what a rate excludes is the
                      part a customer is most likely to be surprised by. */}
                  <InclusionList title="Not included" items={source.exclusions} tone="exclusion" />
                  {source.terms ? (
                    <div className={styles.block}>
                      <h5>Terms</h5>
                      <p className={styles.terms}>{source.terms}</p>
                    </div>
                  ) : null}

                  {/* Opens the form in place rather than linking away. The old
                      link carried the area and package as query parameters that
                      the destination silently discarded, so the context was
                      lost exactly when it mattered. */}
                  <button
                    type="button"
                    className={styles.enquire}
                    onClick={() => setEnquiringAbout(estimate.packageId)}
                    aria-expanded={enquiringAbout === estimate.packageId}
                  >
                    Request a detailed quotation <span aria-hidden="true">→</span>
                  </button>

                  {enquiringAbout === estimate.packageId ? (
                    <PackageEnquiryForm
                      professionalSlug={slug}
                      professionalName={professionalName}
                      selected={source}
                      area={result.area}
                      estimate={estimate.totalCost}
                      onClose={() => setEnquiringAbout(null)}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* An estimate is not a quote. A figure on a public page that looks like a
          fixed price is a promise the contractor would have to honour. */}
      <p className={styles.disclaimer}>
        These are estimates based on rates {professionalName} has published, calculated
        as rate × plot area. The final cost depends on your site, design and material
        choices, and is confirmed by the contractor. It is not a quotation.
      </p>
    </section>
  );
}
