import { CustomerAuthForm } from "../customer-auth-form";
import { getCustomerUser } from "../customer-auth";

export default async function SignupPage() {
  const customer = await getCustomerUser();
  return <main className="auth-page"><section><a className="wordmark auth-logo" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a><p className="form-kicker">CUSTOMER ACCESS</p><h1>{customer ? "Your account is ready." : "Join Buildanta."}</h1><p>{customer ? `Continue as ${customer.displayName} to access your customer account.` : "Create an account for product discovery, project requirements and quote requests."}</p>{customer ? <a className="button navy wide" href="/account">Open customer account <span>→</span></a> : <CustomerAuthForm mode="signup" />}<p className="auth-switch">Already have an account? <a href="/login">Customer login</a></p></section><div className="auth-image supplier"><img src="/images/buildanta-v2/professionals-network-v2.webp" alt="Indian construction professionals reviewing building plans" fetchPriority="high" /><div><p>BUILT FOR EVERY PROJECT</p><h2>One reliable source for construction materials.</h2></div></div></main>;
}
