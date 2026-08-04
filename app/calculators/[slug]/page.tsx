import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCalculator } from "../calculator-data";
import styles from "../calculator.module.css";
import { CalculatorWizard } from "./calculator-wizard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const calculator = await getPublicCalculator(slug);
  return calculator ? { title: calculator.name, description: calculator.description } : { title: "Calculator not found" };
}

export default async function CalculatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const calculator = await getPublicCalculator(slug);
  if (!calculator) notFound();
  return <main className={styles.page}>
    <section className={styles.calculatorHero}>
      <a href="/calculators">&lt;- All material calculators</a>
      <span className={styles.eyebrow} style={{ display: "block", marginTop: "1.5rem" }}>Inventory formula version {calculator.currentVersion.version}</span>
      <h1>{calculator.name}</h1>
      <p>{calculator.description}</p>
    </section>
    <CalculatorWizard calculator={calculator} />
  </main>;
}
