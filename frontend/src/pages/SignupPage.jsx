import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthActions } from '../features/auth/useAuth';

function SignupPage() {
  const navigate = useNavigate();
  const { signupStudent } = useAuthActions();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    const result = await signupStudent(form);
    setLoading(false);

    if (result.ok) {
      navigate('/login');
    }
  }

  return (
    <div className="auth-layout auth-layout-compact">
      <section className="auth-card">
        <div className="stack">
          <p className="eyebrow">Student onboarding</p>
          <h2>Create account</h2>
          <p className="muted">The backend only allows self-signup for students.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Full name</span>
            <input
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
            />
          </label>

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
              minLength="6"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </section>
    </div>
  );
}

export default SignupPage;
