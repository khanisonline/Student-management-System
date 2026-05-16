import { NavLink, Outlet } from 'react-router-dom';
import { ROLE_LABELS } from '../../utils/constants';
import { useAuth, useAuthActions } from '../../features/auth/useAuth';

function AppShell() {
  const { user } = useAuth();
  const { logoutUser } = useAuthActions();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">Student Management</p>
          <h1>Campus Flow</h1>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/management" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            {user?.role === 'admin' ? 'Management' : user?.role === 'teacher' ? 'Workspace' : 'Portal'}
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            Notifications
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link nav-link-active' : 'nav-link'}>
            Profile
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div>
            <p className="eyebrow">Signed in</p>
            <strong>{user?.fullName}</strong>
            <p className="muted">{ROLE_LABELS[user?.role] || 'User'}</p>
          </div>
          <button type="button" className="ghost-button" onClick={logoutUser}>
            Log out
          </button>
        </div>
      </aside>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
