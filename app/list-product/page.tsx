import { SupplierForm } from "./supplier-form";

export default function ListProduct() {
  return <main className="workflow-page supplier-page"><div className="workflow-intro"><p>FOR MANUFACTURERS & SUPPLIERS</p><h1>List your Products</h1><span>Reach builders, contractors and homeowners actively sourcing construction materials through Buildanta.</span><div className="supplier-benefits"><article><b>01</b><strong>Qualified demand</strong><p>Get discovered by buyers planning real projects.</p></article><article><b>02</b><strong>Verified catalogue</strong><p>Clear product data builds confidence and reduces back-and-forth.</p></article><article><b>03</b><strong>Managed enquiries</strong><p>Respond to organised requirements from one place.</p></article></div></div><div className="form-card"><p className="form-kicker">SUPPLIER ONBOARDING</p><h2>Add a product</h2><p>Listings are reviewed before appearing in the catalogue.</p><SupplierForm /></div></main>;
}
