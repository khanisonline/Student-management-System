import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth, useAuthActions } from '../../features/auth/useAuth';
import {
  approveStudent,
  assignStudentToSection,
  assignTeacherToDepartment,
  assignTeacherToSection,
  createCourse,
  createDepartment,
  createExam,
  createSection,
  createUser,
  deleteUser,
  fetchCourses,
  fetchDepartments,
  fetchExams,
  fetchLeaves,
  fetchSections,
  fetchStudentRequests,
  fetchUsers,
  rejectStudentRequest,
  reviewLeave,
  toggleUser,
} from '../../services/adminService';
import { formatDateTime } from '../../utils/formatters';

async function loadAdminData(token) {
  const [usersResult, requestsResult, leavesResult, departmentsResult, sectionsResult, coursesResult, examsResult] =
    await Promise.all([
      fetchUsers(token),
      fetchStudentRequests(token, 'pending'),
      fetchLeaves(token, 'pending'),
      fetchDepartments(token),
      fetchSections(token),
      fetchCourses(token),
      fetchExams(token),
    ]);

  return {
    users: usersResult.users || [],
    requests: requestsResult.requests || [],
    leaves: leavesResult.leaves || [],
    departments: departmentsResult.departments || [],
    sections: sectionsResult.sections || [],
    courses: coursesResult.courses || [],
    exams: examsResult.exams || [],
  };
}

function AdminManagePage() {
  const { token } = useAuth();
  const { pushToast } = useAuthActions();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncData(() => loadAdminData(token), [token, refreshKey]);
  const [viewData, setViewData] = useState(null);

  useEffect(() => {
    if (data) {
      setViewData(data);
    }
  }, [data]);

  const displayData = viewData || data;
  const teachers = useMemo(
    () => (displayData?.users || []).filter((user) => user.role === 'teacher'),
    [displayData?.users],
  );
  const students = useMemo(
    () => (displayData?.users || []).filter((user) => user.role === 'student'),
    [displayData?.users],
  );
  const pendingLeaves = useMemo(
    () => (displayData?.leaves || []).filter((leave) => leave.status === 'pending'),
    [displayData?.leaves],
  );
  const pendingRequests = useMemo(
    () => (displayData?.requests || []).filter((request) => request.status === 'pending'),
    [displayData?.requests],
  );

  async function runAction(task, message) {
    try {
      await task();
      pushToast(message, 'success');
      setRefreshKey((value) => value + 1);
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  async function handleApproveStudent(requestId, values) {
    try {
      await approveStudent(token, { requestId, ...values });
      setViewData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          requests: current.requests.filter((request) => request._id !== requestId),
        };
      });
      pushToast('Student approved and enrolled.', 'success');
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  async function handleRejectStudent(requestId) {
    try {
      await rejectStudentRequest(token, { requestId });
      setViewData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          requests: current.requests.filter((request) => request._id !== requestId),
        };
      });
      pushToast('Enrollment request rejected.', 'success');
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  async function handleReviewLeave(leaveId, status) {
    try {
      await reviewLeave(token, leaveId, {
        status,
        note: status === 'approved' ? 'Approved from admin panel' : 'Rejected from admin panel',
      });

      setViewData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          leaves: current.leaves.filter((leave) => leave._id !== leaveId),
        };
      });
      pushToast(`Leave ${status}.`, 'success');
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  if (loading) {
    return <LoadingState label="Loading admin workspace..." />;
  }

  if (error) {
    return <PageHeader eyebrow="Admin" title="Management" description={error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Admin workspace" title="Manage the academic system" />

      <div className="content-grid">
        <Panel eyebrow="Create" title="New user">
          <EntityForm
            fields={[
              { name: 'fullName', label: 'Full name' },
              { name: 'email', label: 'Email', type: 'email' },
              { name: 'password', label: 'Password', type: 'password' },
              { name: 'role', label: 'Role', type: 'select', options: ['teacher', 'student'] },
            ]}
            submitLabel="Create user"
            onSubmit={(values) => runAction(() => createUser(token, values), 'User created successfully.')}
          />
        </Panel>

        <Panel eyebrow="Requests" title="Pending student approvals">
          {!pendingRequests.length ? (
            <EmptyState title="No pending requests" message="New student signups will appear here." />
          ) : (
            <div className="list-grid">
              {pendingRequests.map((request) => (
                <div key={request._id} className="list-card stack">
                  <div>
                    <strong>{request.student?.fullName}</strong>
                    <p className="muted">{request.student?.email}</p>
                  </div>
                  <ApproveStudentForm
                    sections={displayData.sections}
                    onSubmit={(values) => handleApproveStudent(request._id, values)}
                    onReject={() => handleRejectStudent(request._id)}
                  />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Directory" title="Users">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayData.users.map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <StatusBadge tone={user.isActive ? 'success' : 'warning'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => runAction(() => toggleUser(token, user._id), 'User status updated.')}
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger-button"
                        onClick={() => runAction(() => deleteUser(token, user._id), 'User deleted.')}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="content-grid">
        <Panel eyebrow="Setup" title="Departments, sections, and courses">
          <div className="stack-lg">
            <EntityForm
              title="Create department"
              fields={[{ name: 'name', label: 'Department name' }]}
              submitLabel="Create department"
              onSubmit={(values) => runAction(() => createDepartment(token, values), 'Department created.')}
            />
            <EntityForm
              title="Create section"
              fields={[
                { name: 'name', label: 'Section name' },
                { name: 'semester', label: 'Semester', type: 'number' },
                {
                  name: 'department',
                  label: 'Department',
                  type: 'select',
                  options: displayData.departments.map((item) => ({ label: item.name, value: item._id })),
                },
              ]}
              submitLabel="Create section"
              onSubmit={(values) => runAction(() => createSection(token, values), 'Section created.')}
            />
            <EntityForm
              title="Create course"
              fields={[
                { name: 'name', label: 'Course name' },
                { name: 'creditHours', label: 'Credit hours', type: 'number' },
                {
                  name: 'section',
                  label: 'Section',
                  type: 'select',
                  options: displayData.sections.map((item) => ({
                    label: `${item.name} - Sem ${item.semester}`,
                    value: item._id,
                  })),
                },
                {
                  name: 'teacher',
                  label: 'Teacher',
                  type: 'select',
                  options: teachers.map((item) => ({ label: item.fullName, value: item._id })),
                },
              ]}
              submitLabel="Create course"
              onSubmit={(values) => runAction(() => createCourse(token, values), 'Course created.')}
            />
          </div>
        </Panel>

        <Panel eyebrow="Assignments" title="Link people and schedule exams">
          <div className="stack-lg">
            <EntityForm
              title="Assign teacher to department"
              fields={[
                {
                  name: 'departmentId',
                  label: 'Department',
                  type: 'select',
                  options: displayData.departments.map((item) => ({ label: item.name, value: item._id })),
                },
                {
                  name: 'teacherId',
                  label: 'Teacher',
                  type: 'select',
                  options: teachers.map((item) => ({ label: item.fullName, value: item._id })),
                },
              ]}
              submitLabel="Assign teacher"
              onSubmit={(values) => runAction(() => assignTeacherToDepartment(token, values), 'Teacher assigned to department.')}
            />
            <EntityForm
              title="Assign teacher to section"
              fields={[
                {
                  name: 'sectionId',
                  label: 'Section',
                  type: 'select',
                  options: displayData.sections.map((item) => ({ label: item.name, value: item._id })),
                },
                {
                  name: 'teacherId',
                  label: 'Teacher',
                  type: 'select',
                  options: teachers.map((item) => ({ label: item.fullName, value: item._id })),
                },
              ]}
              submitLabel="Assign class teacher"
              onSubmit={(values) => runAction(() => assignTeacherToSection(token, values), 'Teacher assigned to section.')}
            />
            <EntityForm
              title="Assign student to section"
              fields={[
                {
                  name: 'studentId',
                  label: 'Student',
                  type: 'select',
                  options: students.map((item) => ({ label: item.fullName, value: item._id })),
                },
                {
                  name: 'sectionId',
                  label: 'Section',
                  type: 'select',
                  options: displayData.sections.map((item) => ({ label: item.name, value: item._id })),
                },
                { name: 'rollNumber', label: 'Roll number', type: 'number' },
              ]}
              submitLabel="Assign student"
              onSubmit={(values) => runAction(() => assignStudentToSection(token, values), 'Student assigned to section.')}
            />
            <EntityForm
              title="Create exam"
              fields={[
                {
                  name: 'course',
                  label: 'Course',
                  type: 'select',
                  options: displayData.courses.map((item) => ({ label: item.name, value: item._id })),
                },
                {
                  name: 'section',
                  label: 'Section',
                  type: 'select',
                  options: displayData.sections.map((item) => ({ label: item.name, value: item._id })),
                },
                { name: 'date', label: 'Date', type: 'date' },
                { name: 'time', label: 'Time' },
                { name: 'type', label: 'Type', type: 'select', options: ['midterm', 'final', 'quiz'] },
                { name: 'venue', label: 'Venue' },
              ]}
              submitLabel="Create exam"
              onSubmit={(values) => runAction(() => createExam(token, values), 'Exam created.')}
            />
          </div>
        </Panel>
      </div>

      <div className="content-grid">
        <Panel eyebrow="Resources" title="Current sections and courses">
          <div className="list-grid compact-list">
            {displayData.sections.slice(0, 6).map((section) => (
              <div key={section._id} className="list-card">
                <strong>{section.name}</strong>
                <p className="muted">{section.department?.name} - Semester {section.semester}</p>
              </div>
            ))}
            {displayData.courses.slice(0, 6).map((course) => (
              <div key={course._id} className="list-card">
                <strong>{course.name}</strong>
                <p className="muted">{course.section?.name} - {course.teacher?.fullName || 'Unassigned teacher'}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Exams" title="Upcoming exam entries">
          {!displayData.exams.length ? (
            <EmptyState title="No exams yet" message="Created exams will show here." />
          ) : (
            <div className="list-grid compact-list">
              {displayData.exams.slice(0, 6).map((exam) => (
                <div key={exam._id} className="list-card">
                  <strong>{exam.course?.name}</strong>
                  <p className="muted">{String(exam.date).slice(0, 10)} - {exam.time} - {exam.venue}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel eyebrow="Leaves" title="Review leave requests">
        {!pendingLeaves.length ? (
          <EmptyState title="No leave requests" message="Student leave requests will appear here." />
        ) : (
          <div className="list-grid">
            {pendingLeaves.map((leave) => (
              <div key={leave._id} className="list-card stack">
                <div>
                  <strong>{leave.student?.fullName}</strong>
                  <p className="muted">{leave.student?.email} - {leave.reason || 'No reason provided'}</p>
                  <p className="muted">{leave.fromDate?.slice(0, 10)} to {leave.toDate?.slice(0, 10)}</p>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleReviewLeave(leave._id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="ghost-button danger-button"
                    onClick={() => handleReviewLeave(leave._id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function EntityForm({ title, fields, submitLabel, onSubmit }) {
  const initialValues = Object.fromEntries(
    fields.map((field) => {
      const firstOption = Array.isArray(field.options) ? field.options[0] : '';
      return [field.name, typeof firstOption === 'object' ? firstOption?.value || '' : firstOption || ''];
    }),
  );
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    await onSubmit(values);
    setLoading(false);
  }

  return (
    <form className="form-grid form-card" onSubmit={handleSubmit}>
      {title ? <strong>{title}</strong> : null}
      {fields.map((field) => (
        <label key={field.name} className="field">
          <span>{field.label}</span>
          {field.type === 'select' ? (
            <select
              value={values[field.name]}
              onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              required
            >
              <option value="">Select</option>
              {field.options.map((option) => (
                <option
                  key={typeof option === 'object' ? option.value : option}
                  value={typeof option === 'object' ? option.value : option}
                >
                  {typeof option === 'object' ? option.label : option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              value={values[field.name]}
              onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
              required
            />
          )}
        </label>
      ))}
      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}

function ApproveStudentForm({ sections, onSubmit, onReject }) {
  const [values, setValues] = useState({
    sectionId: sections[0]?._id || '',
    rollNumber: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="inline-form compact-inline-form" onSubmit={handleSubmit}>
      <select
        value={values.sectionId}
        onChange={(event) => setValues((current) => ({ ...current, sectionId: event.target.value }))}
        required
      >
        <option value="">Select section</option>
        {sections.map((section) => (
          <option key={section._id} value={section._id}>
            {section.name}
          </option>
        ))}
      </select>
      <input
        className="inline-input"
        type="number"
        placeholder="Roll number"
        value={values.rollNumber}
        onChange={(event) => setValues((current) => ({ ...current, rollNumber: event.target.value }))}
        required
      />
      <div className="button-row">
        <button type="submit" className="primary-button">
          Approve
        </button>
        <button type="button" className="ghost-button danger-button" onClick={onReject}>
          Reject
        </button>
      </div>
    </form>
  );
}

export default AdminManagePage;
