export default function More() {
  const cards = [
    ["Get Bulk Quotes", "Competitive project pricing for builders, contractors and procurement teams.", "/bulk-quotes", "→"],
    ["List your Products", "Put your construction products in front of high-intent buyers.", "/list-product", "→"],
    ["Material Calculators", "Estimate cement, steel, tiles, paint and full-project material quantities.", "/calculators", "→"],
    ["Inventory Portal", "Manage catalogue stock and review quote requests in one protected workspace.", "/inventory", "→"],
  ];
  return <main className="more-page"><div className="page-intro"><p>MORE FROM BUILDANTA</p><h1>Tools for better building</h1><span>Professional sourcing, supplier onboarding and practical project support—all connected.</span></div><div className="more-grid">{cards.map(([title, text, href, action]) => <a className={href === "#" ? "disabled" : ""} href={href} key={title}><span>{title.slice(0, 1)}</span><h2>{title}</h2><p>{text}</p><strong>{action}</strong></a>)}</div></main>;
}
