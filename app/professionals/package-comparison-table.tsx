import { buildComparison, buildExclusionRow, type ComparisonRow } from "./package-comparison";
import { formatRupees, type ContractorPackage } from "./package-estimate";
import styles from "./package-comparison-table.module.css";

function Cell({ items }: { items: string[] }) {
  if (!items.length) {
    return <td className={styles.emptyCell}><span aria-label="Not included in this package">—</span></td>;
  }
  return (
    <td>
      <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>
    </td>
  );
}

function Row({ row, highlight = false }: { row: ComparisonRow; highlight?: boolean }) {
  return (
    <tr className={highlight ? styles.exclusionRow : undefined}>
      <th scope="row">{row.label}</th>
      {row.cells.map((cell) => <Cell key={cell.packageId} items={cell.items} />)}
    </tr>
  );
}

export function PackageComparison({ packages }: { packages: ContractorPackage[] }) {
  const rows = buildComparison(packages);
  const exclusionRow = buildExclusionRow(packages);

  // Nothing to compare against, or nothing structured to compare on.
  if (!rows.length && !exclusionRow) return null;

  return (
    <section className={styles.comparison} aria-labelledby="package-comparison-title">
      <h3 id="package-comparison-title">Compare packages</h3>
      <p className={styles.intro}>
        What each package covers, side by side. A dash means that work is not part
        of the package.
      </p>

      {/* Deliberately scrollable on narrow screens rather than collapsed into
          cards: a comparison you cannot see side by side is not a comparison. */}
      <div className={styles.scroller} tabIndex={0} role="region" aria-label="Package comparison table">
        <table className={styles.table}>
          <caption className="sr-only">
            Included works for each of this contractor&rsquo;s published packages
          </caption>
          <thead>
            <tr>
              <th scope="col">Work</th>
              {packages.map((pkg) => (
                <th scope="col" key={pkg.id}>
                  {pkg.name}
                  <span className={styles.headRate}>{formatRupees(Number(pkg.ratePerSqFt))} / sq ft</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => <Row row={row} key={row.category} />)}
            {exclusionRow ? <Row row={exclusionRow} highlight /> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
