import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import { useAuthActions } from '../features/auth/useAuth';

function ForgotPasswordPage() {
  const { pushToast } = useAuthActions();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await forgotPassword({ email });
      pushToast(result.message || 'Reset link sent.', 'success');
    } catch (error) {
      pushToast(error.message, 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout auth-layout-compact">
      <section className="auth-card">
        <div className="stack">
          <p className="eyebrow">Password help</p>
          <h2>Forgot password</h2>
          <p className="muted">We’ll use the backend email workflow to send a reset link.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </section>
    </div>
  );
}

export default ForgotPasswordPage;
