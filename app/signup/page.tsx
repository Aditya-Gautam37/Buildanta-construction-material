import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Signup() {
  const user = await getChatGPTUser();
  return <main className="auth-page"><section><a className="wordmark auth-logo" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a><p className="form-kicker">PROFESSIONAL ACCESS</p><h1>{user ? "Your account is ready." : "Join Buildanta."}</h1><p>{user ? `Continue as ${user.displayName} to access your workspace.` : "Create secure access for your construction business, supplier team or project."}</p><div className="account-types"><span>✓ Browse the verified catalogue</span><span>✓ Submit and track bulk requirements</span><span>✓ Manage supplier product inventory</span></div><a className="button navy wide" href={user ? "/inventory" : chatGPTSignInPath("/inventory")}>{user ? "Open inventory portal" : "Continue with ChatGPT"} <span>→</span></a><small>Your identity is handled by the hosting platform; no separate password is created.</small><p className="auth-switch">Already have access? <a href="/login">Log in</a></p></section><div className="auth-image supplier"><img src="/forprofessionalsbanner.png" alt="Construction professionals" /><div><p>BUILT FOR PROFESSIONALS</p><h2>One reliable source for project materials.</h2></div></div></main>;
}
