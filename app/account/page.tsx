import { redirect } from "next/navigation";
import { CustomerLogoutButton } from "../customer-logout-button";
import { availabilityLabel, getCatalogSnapshot } from "../live-catalog";
import { getCustomerUser } from "../customer-auth";

export default async function CustomerAccountPage() {
  const [customer, catalog] = await Promise.all([getCustomerUser(), getCatalogSnapshot()]);
  if (!customer) redirect("/login?redirect=/account");
  const recommendations = [...catalog.products].sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image))).slice(0, 3);

  return <main className="account-dashboard">
    <section className="account-hero">
      <div className="account-hero-copy"><p>CUSTOMER WORKSPACE</p><h1>Welcome back, {customer.firstName ?? customer.displayName}.</h1><span>Explore materials, shortlist requirements and request current project pricing from one connected catalogue.</span><div className="account-hero-actions"><a className="button orange" href="/categories">Browse materials <span>→</span></a><a className="button account-outline" href="/bulk-quotes">Start a quotation</a></div><small><i /> Live catalogue connected to Buildanta Inventory</small></div>
      <div className="account-hero-visual"><img src={recommendations[0]?.image ?? "/demo/hero/project-planning.png"} alt="Construction materials selected for a building project" /><div><span>Signed in as</span><strong>{customer.email}</strong></div></div>
    </section>

    <section className="account-quick-actions"><a href="/categories"><span>01</span><div><strong>Find materials</strong><small>Browse by category, room or construction stage.</small></div><b>→</b></a><a href="/bulk-quotes"><span>02</span><div><strong>Request project pricing</strong><small>Share products, quantities and delivery PIN code.</small></div><b>→</b></a><a href="/professionals"><span>03</span><div><strong>Find professionals</strong><small>Discover contractors, designers and architects.</small></div><b>→</b></a></section>

    <section className="account-recommendations"><div className="section-heading-row"><div><p>From the live catalogue</p><h2>Materials to continue exploring</h2><span>These recommendations update when products and images change in Inventory.</span></div><a className="view-all" href="/categories">View complete catalogue <span>→</span></a></div>
      <div className="account-product-grid">{recommendations.map((product) => <a href={`/products/${product.slug}`} className="account-product" key={product.id}><div>{product.image ? <img src={product.image} alt={product.imageAlt} /> : <img src={fallbackProductImage(product.category)} alt={`${product.category} material`} />}<span>{availabilityLabel(product)}</span></div><small>{product.brand} · {product.category}</small><h3>{product.name}</h3><p>{product.price > 0 ? `Indicative ₹${product.price.toLocaleString("en-IN")} / ${product.unit}` : "Request latest project price"}</p><b>View product <span>→</span></b></a>)}</div>
    </section>

    <section className="account-profile-panel"><div><p>ACCOUNT DETAILS</p><h2>Your Buildanta account</h2><span>Use this identity when submitting project quotation requests.</span></div><div className="customer-account-card"><span>Email address</span><strong>{customer.email}</strong></div><CustomerLogoutButton /></section>
  </main>;
}

function fallbackProductImage(category: string) {
  const name = category.toLowerCase();
  if (name.includes("steel") || name.includes("tmt")) return "/demo/products/tmt-steel.png";
  if (name.includes("tile") || name.includes("floor")) return "/demo/products/porcelain-tile.png";
  if (name.includes("electric")) return "/demo/products/copper-wire.png";
  if (name.includes("bath") || name.includes("sanitary") || name.includes("plumbing")) return "/demo/products/basin-faucet.png";
  return "/demo/products/cement.png";
}
