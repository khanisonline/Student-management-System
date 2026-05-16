import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthActions } from '../features/auth/useAuth';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuthActions();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const result = await loginUser(form);
    setLoading(false);

    if (result.ok) {
      navigate(location.state?.from || '/dashboard');
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <p className="eyebrow">Campus Flow</p>
        <h1>Student management built for daily use.</h1>
      </section>

      <section className="auth-card">
        <div className="stack">
          <p className="eyebrow">Welcome back</p>
          <h2>Sign in</h2>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/signup">Student signup</Link>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
