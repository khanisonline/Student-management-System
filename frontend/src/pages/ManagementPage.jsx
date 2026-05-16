import { useAuth } from '../features/auth/useAuth';
import AdminManagePage from './role/AdminManagePage';
import TeacherWorkspacePage from './role/TeacherWorkspacePage';
import StudentPortalPage from './role/StudentPortalPage';

function ManagementPage() {
  const { user } = useAuth();

  if (user.role === 'admin') {
    return <AdminManagePage />;
  }

  if (user.role === 'teacher') {
    return <TeacherWorkspacePage />;
  }

  return <StudentPortalPage />;
}

export default ManagementPage;
