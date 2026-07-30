import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Login() {
  const user = await getChatGPTUser();
  return <main className="auth-page"><section><a className="wordmark auth-logo" href="/"><img src="/logo.png" alt="" /><strong>Buildanta</strong></a>{user ? <><p className="form-kicker">SIGNED IN</p><h1>Welcome back.</h1><p>You are signed in as <strong>{user.displayName}</strong>.</p><a className="button navy wide" href="/inventory">Open inventory portal <span>→</span></a><a className="auth-secondary" href={chatGPTSignOutPath("/")}>Sign out</a></> : <><p className="form-kicker">BUILDANTA ACCOUNT</p><h1>Welcome back.</h1><p>Sign in securely to manage products, inventory and quote requests.</p><a className="button navy wide" href={chatGPTSignInPath("/inventory")}>Sign in with ChatGPT <span>→</span></a><small>Authentication is securely handled by the hosting platform. Buildanta never stores your password.</small><p className="auth-switch">New to Buildanta? <a href="/signup">Create access</a></p></>}</section><div className="auth-image"><img src="/homepage_img.png" alt="Modern home under renovation" /><div><p>ONE CATALOGUE. ONE WORKSPACE.</p><h2>Source and manage every build detail.</h2></div></div></main>;
}
