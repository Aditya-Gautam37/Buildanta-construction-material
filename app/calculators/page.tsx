import type { Metadata } from "next";
import { getPublicCalculators, type PublicCalculator } from "./calculator-data";
import styles from "./calculator.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Construction Material Calculators",
  description: "Plan a complete project or estimate concrete, masonry, tiles and paint, then request one connected Buildanta quotation.",
};

const symbols: Record<string, string> = {
  BUILDING_BUDGET: "BOQ",
  CEMENT_CONCRETE: "M3",
  BRICKS_BLOCKS: "BRK",
  TILES_FLOORING: "TILE",
  PAINT: "CLR",
  WATERPROOFING: "WP",
  TMT_REBAR: "TMT",
};

const groups = [
  { title: "Structure", description: "Plan concrete, masonry and structural material quantities.", types: ["CEMENT_CONCRETE", "BRICKS_BLOCKS", "TMT_REBAR"] },
  { title: "Finishing", description: "Estimate surface materials using managed coverage and wastage.", types: ["TILES_FLOORING", "PAINT", "WATERPROOFING"] },
];

function CalculatorCard({ calculator }: { calculator: PublicCalculator }) {
  return <a className={styles.card} href={`/calculators/${calculator.slug}`}>
    <span className={styles.icon}>{symbols[calculator.type] || "CALC"}</span>
    <h3>{calculator.name}</h3>
    <p>{calculator.description}</p>
    <small>Start calculation -&gt;</small>
  </a>;
}

export default async function CalculatorsPage() {
  const calculators = await getPublicCalculators();
  const planner = calculators.find((calculator) => calculator.type === "BUILDING_BUDGET");

  return <main className={styles.page}>
    <section className={styles.hero}>
      <span className={styles.eyebrow}>Buildanta project planning</span>
      <h1>Plan quantities before requesting prices.</h1>
      <p>Choose a full-project scope or use a specialist calculator. Every result uses a managed formula version, published Inventory products, PIN-code serviceability and the existing quotation workflow.</p>
      <div className={styles.trust}><span>Square feet and metric inputs</span><span>Managed formula versions</span><span>Live catalogue mappings</span><span>One multi-item quotation</span></div>
    </section>

    <section className={styles.content}>
      {planner && <a className={styles.featuredPlanner} href={`/calculators/${planner.slug}`}>
        <div><span className={styles.eyebrow}>Complete project planner</span><h2>Get full construction material info</h2><p>Enter the project name, site area, built-up area, floors, rooms and required construction scope. Receive a stage-wise preliminary material schedule with Inventory products and indicative values.</p><div className={styles.plannerChips}><span>Foundation only</span><span>Structural shell</span><span>Full finished plan</span></div></div>
        <span className={styles.plannerAction}><b>BOQ</b>Start complete plan -&gt;</span>
      </a>}

      <div className={styles.intro}><div><span className={styles.eyebrow}>Specialist calculators</span><h2>Calculate one part of the project</h2></div><p>Use the focused tools when you already know the dimensions for a concrete component, wall, tiled surface or room.</p></div>
      {calculators.length ? groups.map((group) => {
        const entries = calculators.filter((calculator) => group.types.includes(calculator.type));
        return entries.length ? <section className={styles.calculatorGroup} key={group.title}><header><h3>{group.title}</h3><p>{group.description}</p></header><div className={styles.grid}>{entries.map((calculator) => <CalculatorCard calculator={calculator} key={calculator.id} />)}</div></section> : null;
      }) : <div className={styles.empty}><h2>Calculators are temporarily unavailable</h2><p>Please try again after the Inventory API is running.</p></div>}
    </section>
  </main>;
}
