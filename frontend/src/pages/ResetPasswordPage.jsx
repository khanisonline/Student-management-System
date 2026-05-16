import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import { useAuthActions } from '../features/auth/useAuth';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useAuthActions();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await resetPassword(token, { password });
      pushToast(result.message || 'Password reset successful.', 'success');
      navigate('/login');
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
          <p className="eyebrow">New password</p>
          <h2>Reset password</h2>
          <p className="muted">Choose a new password with at least 6 characters.</p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              minLength="6"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Updating...' : 'Reset password'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Back to login</Link>
        </div>
      </section>
    </div>
  );
}

export default ResetPasswordPage;
