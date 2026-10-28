import Link from "next/link";
export default function Register() {
  return (
    <section className="auth-layout">
      <div className="auth-image">
        <span className="eyebrow">MAKE ROOM FOR INSPIRATION</span>
        <h1>Create Your Dream Space with the Right Designer</h1>
        <p>Join a community of homeowners and talented design professionals.</p>
        <div className="feature-pills">
          <span>✦ Verified Designers</span>
          <span>⌂ Inspiring Portfolios</span>
          <span>♡ Personalised Matches</span>
        </div>
      </div>
      <form className="form-card">
        <span className="eyebrow">GET STARTED</span>
        <h2>Create your account</h2>
        <p>It only takes a minute to get started.</p>
        <label>
          Full name
          <input required placeholder="Enter your full name" />
        </label>
        <label>
          Email address
          <input required type="email" placeholder="you@example.com" />
        </label>
        <label>
          Phone number
          <input required type="tel" placeholder="Enter phone number" />
        </label>
        <label>
          Password
          <input required type="password" placeholder="Create a password" />
        </label>
        <label>
          I am a
          <select defaultValue="customer">
            <option value="customer">Customer looking for a designer</option>
            <option value="designer">Interior designer</option>
          </select>
        </label>
        <button className="btn full" type="submit">
          Create Account
        </button>
        <p className="form-note">
          By registering, you agree to our Terms and Privacy Policy.
        </p>
        <p className="center">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
