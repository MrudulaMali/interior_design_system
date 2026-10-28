import Link from "next/link";
export default function Login() {
  return (
    <section className="auth-layout">
      <div className="auth-image login-image">
        <span className="eyebrow">WELCOME HOME</span>
        <h1>Welcome Back!</h1>
        <p>
          Continue exploring inspiring spaces and talented interior designers.
        </p>
        <div className="feature-pills">
          <span>⌂ Find Designers</span>
          <span>♡ Save Your Favourites</span>
          <span>▤ Manage Your Projects</span>
        </div>
      </div>
      <form className="form-card">
        <span className="eyebrow">GOOD TO SEE YOU</span>
        <h2>Login to InteriorFinder</h2>
        <p>Enter your details to access your account.</p>
        <label>
          Email address
          <input required type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input required type="password" placeholder="Enter your password" />
        </label>
        <div className="form-row">
          <label className="check-label">
            <input type="checkbox" /> Remember me
          </label>
          <Link href="/login">Forgot password?</Link>
        </div>
        <button className="btn full" type="submit">
          Login
        </button>
        <div className="or">
          <span /> or continue with <span />
        </div>
        <div className="social-row">
          <button type="button" className="outline-btn">
            G&nbsp; Google
          </button>
          <button type="button" className="outline-btn">
            f&nbsp; Facebook
          </button>
        </div>
        <p className="center">
          Don't have an account? <Link href="/register">Register</Link>
        </p>
      </form>
    </section>
  );
}
