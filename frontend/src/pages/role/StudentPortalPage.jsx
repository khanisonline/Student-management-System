import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth, useAuthActions } from '../../features/auth/useAuth';
import {
  analyzeStudentInsights,
  applyLeave,
  fetchStudentAttendance,
  fetchStudentFullDashboard,
  fetchStudentInsights,
  fetchStudentLeaves,
  submitStudentAssignment,
} from '../../services/studentService';
import { formatDate } from '../../utils/formatters';
import { buildStudentInsightFallback, getRiskTone, normalizeRiskLevel } from '../../utils/studentInsights';

const AI_FOCUS_OPTIONS = [
  { value: 'overall performance', label: 'Overall performance' },
  { value: 'attendance improvement', label: 'Attendance improvement' },
  { value: 'marks improvement', label: 'Marks improvement' },
  { value: 'assignment planning', label: 'Assignment planning' },
  { value: 'exam readiness', label: 'Exam readiness' },
];

async function loadStudentData(token) {
  const [dashboard, attendance, leaves, insightResponse] = await Promise.all([
    fetchStudentFullDashboard(token),
    fetchStudentAttendance(token),
    fetchStudentLeaves(token),
    fetchStudentInsights(token).catch(() => null),
  ]);

  return {
    dashboard,
    attendance: attendance.attendance || [],
    leaves: leaves.leaves || [],
    insights: insightResponse?.dashboard || buildStudentInsightFallback(dashboard),
    insightsFallback: Boolean(insightResponse?.fallback || !insightResponse?.dashboard),
  };
}

function StudentPortalPage() {
  const { token, user } = useAuth();
  const { pushToast } = useAuthActions();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncData(() => loadStudentData(token), [token, refreshKey]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (data?.leaves) {
      setLeaves(data.leaves);
    }
  }, [data]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;

    async function syncLeaves() {
      try {
        const response = await fetchStudentLeaves(token);
        if (!cancelled) {
          setLeaves(response.leaves || []);
        }
      } catch (syncError) {
        if (!cancelled) {
          console.error(syncError);
        }
      }
    }

    const intervalId = window.setInterval(syncLeaves, 15000);
    const handleFocus = () => {
      syncLeaves();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [token]);

  async function runAction(task, message) {
    try {
      await task();
      pushToast(message, 'success');
      setRefreshKey((value) => value + 1);
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  const overview = data?.dashboard?.overview?.enrollment;
  const attendanceEntries = useMemo(
    () =>
      (data?.attendance || [])
        .map((session) => {
          const currentRecord = (session.records || []).find(
            (record) => String(record.student) === String(user?._id),
          );

          if (!currentRecord) {
            return null;
          }

          return {
            id: `${session._id}-${currentRecord.status}`,
            course: session.course?.name || 'Course',
            date: session.date,
            status: currentRecord.status,
          };
        })
        .filter(Boolean)
        .sort((left, right) => new Date(right.date) - new Date(left.date)),
    [data?.attendance, user?._id],
  );
  const attendanceSummary = useMemo(
    () =>
      attendanceEntries.reduce(
        (summary, entry) => ({
          ...summary,
          [entry.status]: summary[entry.status] + 1,
        }),
        { present: 0, absent: 0, leave: 0 },
      ),
    [attendanceEntries],
  );

  if (loading) {
    return <LoadingState label="Loading student portal..." />;
  }

  if (error) {
    return <PageHeader eyebrow="Student" title="Portal" description={error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Student portal" title="Manage your day-to-day academic work" />

      <div className="stats-grid stats-grid-tight">
        <article className="stat-card">
          <p className="stat-label">Courses</p>
          <strong className="stat-value">{data.dashboard.summary.courses}</strong>
        </article>
        <article className="stat-card stat-card-warning">
          <p className="stat-label">Pending assignments</p>
          <strong className="stat-value">{data.dashboard.summary.pendingAssignments}</strong>
        </article>
        <article className="stat-card stat-card-accent">
          <p className="stat-label">Published marks</p>
          <strong className="stat-value">{data.dashboard.summary.marksPublished}</strong>
        </article>
      </div>

      <div className="content-grid">
        <Panel eyebrow="Profile snapshot" title="Enrollment overview">
          {overview ? (
            <div className="list-grid compact-list">
              <div className="list-card"><strong>Department</strong><p className="muted">{overview.department}</p></div>
              <div className="list-card"><strong>Section</strong><p className="muted">{overview.section}</p></div>
              <div className="list-card"><strong>Semester</strong><p className="muted">{overview.semester}</p></div>
              <div className="list-card"><strong>Roll number</strong><p className="muted">{overview.rollNumber}</p></div>
            </div>
          ) : (
            <EmptyState title="Enrollment pending" message="Admin approval is still needed before section data appears." />
          )}
        </Panel>

        <Panel eyebrow="Leave" title="Apply for leave">
          <StudentLeaveForm onSubmit={(values) => runAction(() => applyLeave(token, values), 'Leave request submitted.')} />
        </Panel>
      </div>

      <StudentAiMentorPanel
        token={token}
        summaryInsights={data.insights}
        insightsFallback={data.insightsFallback}
        pushToast={pushToast}
      />

      <Panel eyebrow="Assignments" title="Your assignments">
        {!data.dashboard.assignments.length ? (
          <EmptyState title="No assignments yet" message="Assignments for your section will appear here." />
        ) : (
          <div className="list-grid">
            {data.dashboard.assignments.map((assignment) => (
              <div key={assignment._id} className="list-card stack">
                <div>
                  <strong>{assignment.title}</strong>
                  <p className="muted">
                    {assignment.createdBy?.fullName || 'Teacher'} - Due {formatDate(assignment.dueDate)}
                  </p>
                </div>
                <StatusBadge tone={assignment.status === 'submitted' ? 'success' : 'warning'}>
                  {assignment.status}
                </StatusBadge>
                {assignment.status !== 'submitted' ? (
                  <StudentSubmissionForm
                    assignmentId={assignment._id}
                    onSubmit={(payload) => runAction(() => submitStudentAssignment(token, payload), 'Assignment submitted successfully.')}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="content-grid">
        <Panel eyebrow="Courses" title="Current course list">
          {!data.dashboard.sectionCourses.length ? (
            <EmptyState title="No courses assigned" message="Course data will appear once your section is fully configured." />
          ) : (
            <div className="list-grid compact-list">
              {data.dashboard.sectionCourses.map((course) => (
                <div key={course._id} className="list-card">
                  <strong>{course.name}</strong>
                  <p className="muted">{course.teacher?.fullName || 'Teacher pending'} - {course.creditHours} credit hours</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel eyebrow="Exams" title="Upcoming datesheet">
          {!data.dashboard.exams.length ? (
            <EmptyState title="No exams scheduled" message="Upcoming exams will show here." />
          ) : (
            <div className="list-grid compact-list">
              {data.dashboard.exams.map((exam) => (
                <div key={exam._id} className="list-card">
                  <strong>{exam.course?.name}</strong>
                  <p className="muted">{exam.type} - {formatDate(exam.date)} - {exam.time}</p>
                  <StatusBadge tone="accent">{exam.venue}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Notifications" title="Recent student updates">
        {!data.dashboard.notifications.length ? (
          <EmptyState title="No notifications" message="Updates from the system will appear here." />
        ) : (
          <div className="list-grid compact-list">
            {data.dashboard.notifications.map((notification) => (
              <div key={notification._id} className="list-card">
                <strong>{notification.message}</strong>
                <p className="muted">{notification.type}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel eyebrow="Leave history" title="My leave requests">
        {!leaves.length ? (
          <EmptyState title="No leave history" message="Submitted leave requests will appear here." />
        ) : (
          <div className="list-grid compact-list">
            {leaves.map((leave) => (
              <div key={leave._id} className="list-card">
                <div>
                  <strong>{leave.reason || 'Leave request'}</strong>
                  <p className="muted">{leave.fromDate?.slice(0, 10)} to {leave.toDate?.slice(0, 10)}</p>
                </div>
                <StatusBadge tone={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}>
                  {leave.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel eyebrow="Attendance feed" title="Attendance records">
        {!attendanceEntries.length ? (
          <EmptyState title="No attendance records" message="Teacher-marked attendance will show here." />
        ) : (
          <div className="stack">
            <div className="list-grid compact-list">
              <div className="list-card">
                <strong>Present</strong>
                <p className="muted">{attendanceSummary.present}</p>
              </div>
              <div className="list-card">
                <strong>Absent</strong>
                <p className="muted">{attendanceSummary.absent}</p>
              </div>
              <div className="list-card">
                <strong>Leave</strong>
                <p className="muted">{attendanceSummary.leave}</p>
              </div>
              <div className="list-card">
                <strong>Total sessions</strong>
                <p className="muted">{attendanceEntries.length}</p>
              </div>
            </div>

            <div className="list-grid compact-list">
              {attendanceEntries.map((entry) => (
                <div key={entry.id} className="list-card">
                  <div className="stack">
                    <strong>{entry.course}</strong>
                    <p className="muted">{formatDate(entry.date)}</p>
                    <StatusBadge tone={entry.status === 'present' ? 'success' : entry.status === 'absent' ? 'danger' : 'warning'}>
                      {entry.status}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StudentAiMentorPanel({ token, summaryInsights, insightsFallback, pushToast }) {
  const [formValues, setFormValues] = useState({
    focusArea: AI_FOCUS_OPTIONS[0].value,
    question: '',
  });
  const [analysis, setAnalysis] = useState(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function runInitialAnalysis() {
      setLoading(true);
      setError('');

      try {
        const response = await analyzeStudentInsights(token, {
          focusArea: AI_FOCUS_OPTIONS[0].value,
          question: '',
        });

        if (!cancelled) {
          setAnalysis(response.analysis || null);
          setGeneratedAt(response.generatedAt || '');
        }
      } catch (analysisError) {
        if (!cancelled) {
          setError(analysisError.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (token) {
      runInitialAnalysis();
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await analyzeStudentInsights(token, formValues);
      setAnalysis(response.analysis || null);
      setGeneratedAt(response.generatedAt || '');
      pushToast('AI analysis refreshed.', 'success');
    } catch (analysisError) {
      setError(analysisError.message);
      pushToast(analysisError.message, 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel eyebrow="AI mentor" title="Dedicated academic analysis">
      <div className="stack">
        <div className="list-card stack">
          <div className="button-row">
            <StatusBadge tone={getRiskTone(summaryInsights?.overview?.riskLevel)}>
              Snapshot risk: {normalizeRiskLevel(summaryInsights?.overview?.riskLevel)}
            </StatusBadge>
            <StatusBadge tone="accent">Trend: {summaryInsights?.trend || 'Stable'}</StatusBadge>
            {insightsFallback ? <StatusBadge tone="neutral">Snapshot fallback</StatusBadge> : null}
          </div>
          <strong>{summaryInsights?.overview?.performance || 'Stable'}</strong>
          <p className="muted">
            {summaryInsights?.overview?.summary || 'Quick academic insight will appear here.'}
          </p>
        </div>

        <form className="form-grid form-card" onSubmit={handleSubmit}>
          <strong>Ask the AI mentor</strong>
          <label className="field">
            <span>Focus area</span>
            <select
              value={formValues.focusArea}
              onChange={(event) => setFormValues((current) => ({ ...current, focusArea: event.target.value }))}
            >
              {AI_FOCUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Optional question</span>
            <textarea
              value={formValues.question}
              onChange={(event) => setFormValues((current) => ({ ...current, question: event.target.value }))}
              rows="3"
              placeholder="Example: Tell me why my attendance is hurting my overall performance."
            />
          </label>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Analyzing...' : 'Run AI analysis'}
          </button>
        </form>

        {loading && !analysis ? <LoadingState label="Generating AI mentor response..." /> : null}
        {error && !analysis ? <EmptyState title="Analysis unavailable" message={error} /> : null}

        {analysis ? (
          <div className="stack">
            <div className="list-card stack">
              <div className="button-row">
                <StatusBadge tone={analysis.mode === 'ai' ? 'accent' : 'neutral'}>
                  {analysis.mode === 'ai' ? 'Live AI' : 'Fallback analysis'}
                </StatusBadge>
                <StatusBadge tone={getRiskTone(analysis.riskLevel)}>
                  Risk: {normalizeRiskLevel(analysis.riskLevel)}
                </StatusBadge>
                <StatusBadge tone="neutral">Confidence: {analysis.confidence || 'Medium'}</StatusBadge>
              </div>
              <strong>{analysis.headline}</strong>
              <p className="muted">{analysis.summary}</p>
              <p>{analysis.mentorMessage}</p>
              <p className="muted">
                Focus area: {analysis.focusArea || formValues.focusArea}
                {generatedAt ? ` | Generated ${new Date(generatedAt).toLocaleString()}` : ''}
              </p>
            </div>

            <div className="list-grid compact-list">
              <InsightListCard title="Strengths" items={analysis.strengths} emptyText="No strengths were returned yet." />
              <InsightListCard title="Concerns" items={analysis.concerns} emptyText="No concerns were returned yet." />
            </div>

            <InsightListCard title="Action plan" items={analysis.actionPlan} emptyText="No action plan was returned yet." />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function InsightListCard({ title, items, emptyText }) {
  return (
    <div className="list-card stack">
      <strong>{title}</strong>
      {items?.length ? (
        <div className="stack">
          {items.map((item, index) => (
            <p key={`${title}-${index}`} className="muted">{item}</p>
          ))}
        </div>
      ) : (
        <p className="muted">{emptyText}</p>
      )}
    </div>
  );
}

function StudentSubmissionForm({ assignmentId, onSubmit }) {
  const [fileUrl, setFileUrl] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ assignmentId, fileUrl });
    setFileUrl('');
  }

  return (
    <form className="inline-form compact-inline-form" onSubmit={handleSubmit}>
      <input
        className="inline-input"
        placeholder="Paste file path or URL"
        value={fileUrl}
        onChange={(event) => setFileUrl(event.target.value)}
        required
      />
      <button type="submit" className="primary-button">Submit</button>
    </form>
  );
}

function StudentLeaveForm({ onSubmit }) {
  const [values, setValues] = useState({
    fromDate: '',
    toDate: '',
    reason: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(values);
    setValues({ fromDate: '', toDate: '', reason: '' });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>From</span>
        <input type="date" value={values.fromDate} onChange={(event) => setValues((current) => ({ ...current, fromDate: event.target.value }))} required />
      </label>
      <label className="field">
        <span>To</span>
        <input type="date" value={values.toDate} onChange={(event) => setValues((current) => ({ ...current, toDate: event.target.value }))} required />
      </label>
      <label className="field">
        <span>Reason</span>
        <textarea value={values.reason} onChange={(event) => setValues((current) => ({ ...current, reason: event.target.value }))} rows="3" />
      </label>
      <button type="submit" className="primary-button">Apply leave</button>
    </form>
  );
}

export default StudentPortalPage;
