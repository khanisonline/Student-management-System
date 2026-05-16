import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/routing/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import LoadingState from './components/common/LoadingState';
import ToastViewport from './components/common/ToastViewport';
import { useBootstrap } from './store/useBootstrap';
import { useAuth } from './features/auth/useAuth';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const { ready } = useBootstrap();
  const { isAuthenticated, user } = useAuth();

  if (!ready) {
    return <LoadingState fullScreen label="Connecting your student management workspace..." />;
  }

  if (isAuthenticated && !user) {
    return <LoadingState fullScreen label="Restoring your profile..." />;
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/reset-password/:token"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="management" element={<ManagementPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
      <ToastViewport />
    </>
  );
}

export default App;
