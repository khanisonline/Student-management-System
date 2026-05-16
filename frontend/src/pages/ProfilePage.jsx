import { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { useAuth, useAuthActions } from '../features/auth/useAuth';

function ProfilePage() {
  const { user, token } = useAuth();
  const { updatePassword } = useAuthActions();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    await updatePassword(token, form);
    setLoading(false);
    setForm({ currentPassword: '', newPassword: '' });
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Profile"
        title="Account and password"
        description="This profile comes from your authenticated backend session."
      />

      <div className="content-grid">
        <Panel eyebrow="Account" title="Current user">
          <div className="list-grid">
            <div className="list-card"><strong>Name</strong><p className="muted">{user.fullName}</p></div>
            <div className="list-card"><strong>Email</strong><p className="muted">{user.email}</p></div>
            <div className="list-card"><strong>Role</strong><p className="muted">{user.role}</p></div>
            <div className="list-card"><strong>User ID</strong><p className="muted">{user._id}</p></div>
          </div>
        </Panel>

        <Panel eyebrow="Security" title="Change password">
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                minLength="6"
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

export default ProfilePage;
