import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import LoadingState from '../components/common/LoadingState';
import Panel from '../components/common/Panel';
import StatusBadge from '../components/common/StatusBadge';
import BarChartCard from '../components/charts/BarChartCard';
import DonutChartCard from '../components/charts/DonutChartCard';
import LineChartCard from '../components/charts/LineChartCard';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuth } from '../features/auth/useAuth';
import { fetchAdminDashboard, fetchStudentRequests, fetchUsers } from '../services/adminService';
import { fetchTeacherAssignments, fetchTeacherCourses, fetchTeacherDashboard } from '../services/teacherService';
import { fetchStudentFullDashboard, fetchStudentInsights } from '../services/studentService';
import { buildStudentInsightFallback, getRiskTone, normalizeRiskLevel } from '../utils/studentInsights';

async function loadDashboard(role, token) {
  if (role === 'admin') {
    const [dashboard, usersResult, requestsResult] = await Promise.all([
      fetchAdminDashboard(token),
      fetchUsers(token),
      fetchStudentRequests(token),
    ]);

    return {
      mode: 'admin',
      stats: [
        { label: 'Users', value: dashboard.summary.totalUsers, tone: 'accent' },
        { label: 'Departments', value: dashboard.summary.departments },
        { label: 'Pending requests', value: dashboard.summary.pendingRequests, tone: 'warning' },
        { label: 'Pending leaves', value: dashboard.summary.pendingLeaves },
      ],
      charts: {
        userBreakdown: Object.entries(dashboard.charts.userBreakdown).map(([label, value]) => ({
          label,
          value,
        })),
        sectionEnrollment: dashboard.charts.sectionEnrollment,
      },
      highlights: [
        ...requestsResult.requests.slice(0, 3).map((request) => ({
          title: request.student?.fullName,
          meta: request.student?.email,
          badge: request.status,
          tone: 'warning',
        })),
        ...usersResult.users.slice(0, 3).map((user) => ({
          title: user.fullName,
          meta: user.email,
          badge: user.role,
          tone: user.isActive ? 'success' : 'danger',
        })),
      ],
    };
  }

  if (role === 'teacher') {
    const [dashboard, coursesResult, assignmentsResult] = await Promise.all([
      fetchTeacherDashboard(token),
      fetchTeacherCourses(token),
      fetchTeacherAssignments(token),
    ]);

    return {
      mode: 'teacher',
      stats: [
        { label: 'Sections', value: dashboard.summary.sections, tone: 'accent' },
        { label: 'Courses', value: dashboard.summary.courses },
        { label: 'Students', value: dashboard.summary.students },
        { label: 'Assignments', value: assignmentsResult.assignments.length, tone: 'warning' },
      ],
      charts: {
        sectionStats: dashboard.sectionStats,
        courseHours: coursesResult.courses.map((course) => ({
          label: course.name,
          value: course.creditHours,
        })),
      },
      highlights: assignmentsResult.assignments.slice(0, 4).map((assignment) => ({
        title: assignment.title,
        meta: `${assignment.section?.name || 'Section'} • Due ${String(assignment.dueDate).slice(0, 10)}`,
        badge: `${assignment.totalMarks} marks`,
        tone: 'accent',
      })),
    };
  }

  const [dashboard, insightResponse] = await Promise.all([
    fetchStudentFullDashboard(token),
    fetchStudentInsights(token).catch(() => null),
  ]);

  return {
    mode: 'student',
    stats: [
      {
        label: 'Average marks',
        value: dashboard.summary.averageMarks,
        tone: 'accent',
      },
      {
        label: 'Attendance',
        value: `${dashboard.summary.attendancePercent}%`,
      },
      {
        label: 'Pending assignments',
        value: dashboard.summary.pendingAssignments,
        tone: 'warning',
      },
      {
        label: 'Unread notifications',
        value: dashboard.summary.unreadNotifications,
      },
    ],
    charts: dashboard.charts,
    insights: insightResponse?.dashboard || buildStudentInsightFallback(dashboard),
    insightsFallback: Boolean(insightResponse?.fallback || !insightResponse?.dashboard),
    overview: dashboard.overview,
    highlights: dashboard.assignments.slice(0, 4).map((assignment) => ({
      title: assignment.title,
      meta: `${assignment.createdBy?.fullName || 'Teacher'} • Due ${String(assignment.dueDate).slice(0, 10)}`,
      badge: assignment.status,
      tone: assignment.status === 'submitted' ? 'success' : 'warning',
    })),
  };
}

function DashboardPage() {
  const { token, user } = useAuth();
  const { data, loading, error } = useAsyncData(() => loadDashboard(user.role, token), [token, user.role]);

  if (loading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader eyebrow="Dashboard" title="Overview" description={error} />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard"
        title="Operational overview"
      />

      <div className="stats-grid">
        {data.stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} hint={item.hint} tone={item.tone} />
        ))}
      </div>

      {data.mode === 'admin' ? (
        <div className="content-grid">
          <DonutChartCard eyebrow="Admin insights" title="User distribution" data={data.charts.userBreakdown} />
          <BarChartCard eyebrow="Capacity" title="Students per section" data={data.charts.sectionEnrollment} />
        </div>
      ) : null}

      {data.mode === 'teacher' ? (
        <div className="content-grid">
          <BarChartCard eyebrow="Sections" title="Students by section" data={data.charts.sectionStats} />
          <LineChartCard eyebrow="Courses" title="Credit hour spread" data={data.charts.courseHours} />
        </div>
      ) : null}

      {data.mode === 'student' ? (
        <>
          <div className="content-grid">
            <BarChartCard eyebrow="Performance" title="Marks by course" data={data.charts.marksByCourse} />
            <DonutChartCard eyebrow="Attendance" title="Attendance mix" data={data.charts.attendanceBreakdown} />
          </div>
          <div className="content-grid">
            <BarChartCard eyebrow="Assignments" title="Submission status" data={data.charts.assignmentsByStatus} />
            <Panel eyebrow="Student insights" title="AI and fallback recommendations">
              <div className="stack">
                <div className="list-card">
                  <strong>{data.insights.overview.performance}</strong>
                  <p className="muted">{data.insights.overview.summary}</p>
                </div>
                <div className="button-row">
                  <StatusBadge tone="accent">Trend: {data.insights.trend}</StatusBadge>
                  <StatusBadge tone={getRiskTone(data.insights.overview.riskLevel)}>
                    Risk: {normalizeRiskLevel(data.insights.overview.riskLevel)}
                  </StatusBadge>
                  {data.insightsFallback ? <StatusBadge tone="neutral">Calculated view</StatusBadge> : null}
                </div>
                <div className="list-grid compact-list">
                  {data.insights.recommendations.map((item, index) => (
                    <div key={`${item}-${index}`} className="list-card">
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
          {data.overview?.enrollment ? (
            <Panel eyebrow="Enrollment" title="Student profile snapshot">
              <div className="list-grid compact-list">
                <div className="list-card"><strong>Department</strong><p className="muted">{data.overview.enrollment.department}</p></div>
                <div className="list-card"><strong>Section</strong><p className="muted">{data.overview.enrollment.section}</p></div>
                <div className="list-card"><strong>Semester</strong><p className="muted">{data.overview.enrollment.semester}</p></div>
                <div className="list-card"><strong>Roll number</strong><p className="muted">{data.overview.enrollment.rollNumber}</p></div>
              </div>
            </Panel>
          ) : null}
        </>
      ) : null}

      <Panel eyebrow="Recent activity" title="What needs attention">
        <div className="list-grid">
          {data.highlights.map((item) => (
            <div key={`${item.title}-${item.meta}`} className="list-card">
              <div>
                <strong>{item.title}</strong>
                <p className="muted">{item.meta}</p>
              </div>
              <StatusBadge tone={item.tone}>{item.badge}</StatusBadge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default DashboardPage;
