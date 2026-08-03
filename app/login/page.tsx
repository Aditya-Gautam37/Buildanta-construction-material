import { CustomerAuthForm } from "../customer-auth-form";
import { getCustomerUser } from "../customer-auth";

export default async function LoginPage() {
  const customer = await getCustomerUser();
  return <main className="auth-page"><section><a className="wordmark auth-logo" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a>{customer ? <><p className="form-kicker">SIGNED IN</p><h1>Welcome back.</h1><p>You are signed in as <strong>{customer.displayName}</strong>.</p><a className="button navy wide" href="/account">Open customer account <span>→</span></a></> : <><p className="form-kicker">BUILDANTA CUSTOMER</p><h1>Welcome back.</h1><p>Sign in with your email and password to manage your customer account and project enquiries.</p><CustomerAuthForm mode="login" /><p className="auth-switch">New to Buildanta? <a href="/signup">Create a customer account</a></p></>}</section><div className="auth-image"><img src="/homepage_img.png" alt="Modern home under renovation" /><div><p>ONE CATALOGUE. ONE WORKSPACE.</p><h2>Source every build detail with confidence.</h2></div></div></main>;
}
