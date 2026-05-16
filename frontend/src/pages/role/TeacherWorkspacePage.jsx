import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import StatusBadge from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useAuth, useAuthActions } from '../../features/auth/useAuth';
import {
  addMarks,
  createAssignment,
  fetchAttendance,
  fetchMarks,
  fetchSectionStudents,
  fetchTeacherAssignments,
  fetchTeacherCourses,
  fetchTeacherDashboard,
  fetchTeacherSections,
  markAttendance,
} from '../../services/teacherService';

async function loadTeacherData(token) {
  const [dashboard, sectionsResult, coursesResult, assignmentsResult] = await Promise.all([
    fetchTeacherDashboard(token),
    fetchTeacherSections(token),
    fetchTeacherCourses(token),
    fetchTeacherAssignments(token),
  ]);

  return {
    dashboard,
    sections: sectionsResult.sections || [],
    courses: coursesResult.courses || [],
    assignments: assignmentsResult.assignments || [],
  };
}

function TeacherWorkspacePage() {
  const { token } = useAuth();
  const { pushToast } = useAuthActions();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsyncData(() => loadTeacherData(token), [token, refreshKey]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  const filteredCourses = useMemo(
    () => (data?.courses || []).filter((course) => (!selectedSection ? true : course.section?._id === selectedSection)),
    [data?.courses, selectedSection],
  );

  useEffect(() => {
    if (selectedCourse && !filteredCourses.some((course) => course._id === selectedCourse)) {
      setSelectedCourse('');
    }
  }, [filteredCourses, selectedCourse]);

  const studentsQuery = useAsyncData(
    () => (selectedSection ? fetchSectionStudents(token, selectedSection) : Promise.resolve({ students: [] })),
    [token, selectedSection, refreshKey],
  );
  const marksQuery = useAsyncData(
    () => (selectedCourse ? fetchMarks(token, selectedCourse) : Promise.resolve({ marks: [] })),
    [token, selectedCourse, refreshKey],
  );
  const attendanceQuery = useAsyncData(
    () =>
      selectedSection && selectedCourse
        ? fetchAttendance(token, selectedSection, selectedCourse)
        : Promise.resolve({ attendance: [] }),
    [token, selectedSection, selectedCourse, refreshKey],
  );

  const sectionStudents = studentsQuery.data?.students || [];

  async function runAction(task, message) {
    try {
      await task();
      pushToast(message, 'success');
      setRefreshKey((value) => value + 1);
    } catch (actionError) {
      pushToast(actionError.message, 'danger');
    }
  }

  if (loading) {
    return <LoadingState label="Loading teacher workspace..." />;
  }

  if (error) {
    return <PageHeader eyebrow="Teacher" title="Workspace" description={error} />;
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Teacher workspace" title="Run class operations" />

      <div className="stats-grid stats-grid-tight">
        <QuickStat label="Sections" value={data.dashboard.summary.sections} />
        <QuickStat label="Courses" value={data.dashboard.summary.courses} />
        <QuickStat label="Students" value={data.dashboard.summary.students} />
      </div>

      <div className="content-grid">
        <Panel eyebrow="Selection" title="Choose section and course">
          <div className="form-grid">
            <label className="field">
              <span>Section</span>
              <select value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)}>
                <option value="">Select section</option>
                {data.sections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name} - Semester {section.semester}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Course</span>
              <select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)} disabled={!selectedSection}>
                <option value="">Select course</option>
                {filteredCourses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Panel>

        <Panel eyebrow="Assignments" title="Create assignment">
          <TeacherAssignmentForm
            sections={data.sections}
            onSubmit={(values) => runAction(() => createAssignment(token, values), 'Assignment created.')}
          />
        </Panel>
      </div>

      <div className="content-grid">
        <Panel eyebrow="Roster" title="Students in selected section">
          {!selectedSection ? (
            <EmptyState title="Select a section" message="Student roster will load here." />
          ) : studentsQuery.loading ? (
            <LoadingState label="Loading students..." />
          ) : !sectionStudents.length ? (
            <EmptyState title="No students assigned" message="Admin needs to enroll students into this section." />
          ) : (
            <div className="list-grid compact-list">
              {sectionStudents.map((entry) => (
                <div key={entry._id} className="list-card">
                  <strong>{entry.student?.fullName}</strong>
                  <p className="muted">{entry.student?.email} - Roll {entry.rollNumber}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel eyebrow="Attendance" title="Mark attendance">
          <AttendanceForm
            students={sectionStudents}
            sectionId={selectedSection}
            courseId={selectedCourse}
            onSubmit={(payload) => runAction(() => markAttendance(token, payload), 'Attendance recorded.')}
          />
        </Panel>
      </div>

      <div className="content-grid">
        <Panel eyebrow="Marks" title="Add marks">
          <MarksForm
            students={sectionStudents}
            courseId={selectedCourse}
            onSubmit={(payload) => runAction(() => addMarks(token, payload), 'Marks added.')}
          />
        </Panel>

        <Panel eyebrow="Recent data" title="Attendance and marks status">
          <div className="stack">
            <div className="list-card">
              <strong>Attendance sessions</strong>
              <span className="metric-inline">{attendanceQuery.data?.attendance?.length || 0}</span>
            </div>
            <div className="list-card">
              <strong>Marks entries</strong>
              <span className="metric-inline">{marksQuery.data?.marks?.length || 0}</span>
            </div>
          </div>
        </Panel>
      </div>

      <Panel eyebrow="Published marks" title="Course marks table">
        {!selectedCourse ? (
          <EmptyState title="Select a course" message="Marks will show once a course is selected." />
        ) : !(marksQuery.data?.marks || []).length ? (
          <EmptyState title="No marks yet" message="Use the form above to create marks." />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Exam type</th>
                  <th>Marks</th>
                </tr>
              </thead>
              <tbody>
                {marksQuery.data.marks.map((mark) => (
                  <tr key={mark._id}>
                    <td>{mark.student?.fullName}</td>
                    <td>{mark.course?.name}</td>
                    <td>{mark.examType}</td>
                    <td>
                      <StatusBadge tone="accent">{mark.marks}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel eyebrow="Assignments" title="Assignments created by you">
        {!data.assignments.length ? (
          <EmptyState title="No assignments created" message="Create one above for your section." />
        ) : (
          <div className="list-grid">
            {data.assignments.map((assignment) => (
              <div key={assignment._id} className="list-card">
                <div>
                  <strong>{assignment.title}</strong>
                  <p className="muted">{assignment.section?.name} - Due {String(assignment.dueDate).slice(0, 10)}</p>
                </div>
                <StatusBadge tone="success">{assignment.totalMarks} marks</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function TeacherAssignmentForm({ sections, onSubmit }) {
  const [values, setValues] = useState({
    title: '',
    sectionId: '',
    dueDate: '',
    totalMarks: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(values);
    setValues({ title: '', sectionId: '', dueDate: '', totalMarks: '' });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Title</span>
        <input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} required />
      </label>
      <label className="field">
        <span>Section</span>
        <select value={values.sectionId} onChange={(event) => setValues((current) => ({ ...current, sectionId: event.target.value }))} required>
          <option value="">Select section</option>
          {sections.map((section) => (
            <option key={section._id} value={section._id}>
              {section.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Due date</span>
        <input type="date" value={values.dueDate} onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))} required />
      </label>
      <label className="field">
        <span>Total marks</span>
        <input type="number" value={values.totalMarks} onChange={(event) => setValues((current) => ({ ...current, totalMarks: event.target.value }))} required />
      </label>
      <button type="submit" className="primary-button">Create assignment</button>
    </form>
  );
}

function AttendanceForm({ students, sectionId, courseId, onSubmit }) {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    setRecords(
      students.map((entry) => ({
        student: entry.student?._id,
        status: 'present',
      })),
    );
  }, [students]);

  function updateStatus(studentId, status) {
    setRecords((current) =>
      current.map((record) => (record.student === studentId ? { ...record, status } : record)),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!sectionId || !courseId || !records.length) {
      return;
    }

    await onSubmit({
      sectionId,
      courseId,
      records: records.filter((record) => record.student),
    });
  }

  if (!sectionId) {
    return <EmptyState title="Select a section" message="Attendance tools will open after a section is selected." />;
  }

  if (!students.length) {
    return <EmptyState title="No students found" message="Student attendance can be recorded after enrollment." />;
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      {!courseId ? <p className="muted">Select a course to submit attendance for this section.</p> : null}
      <div className="stack">
        {students.map((entry) => {
          const currentRecord = records.find((record) => record.student === entry.student?._id);

          return (
            <div key={entry._id} className="list-card attendance-row">
              <div>
                <strong>{entry.student?.fullName}</strong>
                <p className="muted">Roll {entry.rollNumber}</p>
              </div>
              <select
                value={currentRecord?.status || 'present'}
                onChange={(event) => updateStatus(entry.student?._id, event.target.value)}
              >
                <option value="present">present</option>
                <option value="absent">absent</option>
                <option value="leave">leave</option>
              </select>
            </div>
          );
        })}
      </div>
      <button type="submit" className="primary-button" disabled={!courseId || !records.length}>
        Submit attendance
      </button>
    </form>
  );
}

function MarksForm({ students, courseId, onSubmit }) {
  const [values, setValues] = useState({
    studentId: '',
    examType: 'quiz',
    marks: '',
    remarks: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ ...values, courseId });
    setValues({ studentId: '', examType: 'quiz', marks: '', remarks: '' });
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <label className="field">
        <span>Student</span>
        <select value={values.studentId} onChange={(event) => setValues((current) => ({ ...current, studentId: event.target.value }))} required>
          <option value="">Select student</option>
          {students.map((entry) => (
            <option key={entry._id} value={entry.student?._id}>
              {entry.student?.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Exam type</span>
        <select value={values.examType} onChange={(event) => setValues((current) => ({ ...current, examType: event.target.value }))}>
          <option value="quiz">quiz</option>
          <option value="midterm">midterm</option>
          <option value="final">final</option>
          <option value="project">project</option>
        </select>
      </label>
      <label className="field">
        <span>Marks</span>
        <input type="number" value={values.marks} onChange={(event) => setValues((current) => ({ ...current, marks: event.target.value }))} required />
      </label>
      <label className="field">
        <span>Remarks</span>
        <input value={values.remarks} onChange={(event) => setValues((current) => ({ ...current, remarks: event.target.value }))} />
      </label>
      <button type="submit" className="primary-button" disabled={!courseId || !students.length}>
        Add marks
      </button>
    </form>
  );
}

function QuickStat({ label, value }) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <strong className="stat-value">{value}</strong>
    </article>
  );
}

export default TeacherWorkspacePage;
