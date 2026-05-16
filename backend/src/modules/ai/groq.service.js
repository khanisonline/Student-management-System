const OpenAI = require("openai");

function createClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  });
}

function parseJsonResponse(content) {
  return JSON.parse(String(content || "").trim().replace(/```json|```/g, ""));
}

function buildFormattedMarks(marks = []) {
  return marks.map((mark) => ({
    subject: mark.course?.name,
    score: Number(mark.marks) || 0
  }));
}

function buildFallback(formattedMarks, attendancePercent, summary) {
  const avgMarks =
    formattedMarks.reduce((sum, mark) => sum + mark.score, 0) /
    (formattedMarks.length || 1);

  return {
    performance:
      avgMarks < 40 ? "Weak" :
      avgMarks < 70 ? "Average" : "Good",
    riskLevel:
      avgMarks < 40 || attendancePercent < 60
        ? "High"
        : avgMarks < 70 || attendancePercent < 75
          ? "Medium"
          : "Low",
    avgMarks,
    attendance: attendancePercent,
    weakSubjects: formattedMarks
      .filter((mark) => mark.score < avgMarks)
      .slice(0, 2)
      .map((mark) => mark.subject)
      .filter(Boolean),
    topSubjects: [...formattedMarks]
      .sort((left, right) => right.score - left.score)
      .slice(0, 2)
      .map((mark) => mark.subject)
      .filter(Boolean),
    summary,
    recommendations: ["Focus on weaker subjects and maintain attendance consistency."],
    alerts: attendancePercent < 75 ? ["Low attendance"] : []
  };
}

function buildDetailedFallback({
  studentName,
  focusArea,
  question,
  averageMarks,
  attendancePercent,
  pendingAssignments,
  weakSubjects,
  strongSubjects,
  courseCount
}) {
  const riskLevel =
    averageMarks < 40 || attendancePercent < 60
      ? "High"
      : averageMarks < 70 || attendancePercent < 75 || pendingAssignments > 0
        ? "Medium"
        : "Low";

  const strengths = [];
  const concerns = [];

  if (strongSubjects.length) {
    strengths.push(`Your strongest subjects right now are ${strongSubjects.join(", ")}.`);
  }

  if (attendancePercent >= 75) {
    strengths.push(`Your attendance is steady at ${attendancePercent.toFixed(1)}%.`);
  }

  if (!strengths.length) {
    strengths.push("You have enough activity in the system to start building a stronger pattern.");
  }

  if (weakSubjects.length) {
    concerns.push(`The lowest-scoring subjects are ${weakSubjects.join(", ")}.`);
  }

  if (attendancePercent < 75) {
    concerns.push(`Attendance is below the preferred range at ${attendancePercent.toFixed(1)}%.`);
  }

  if (pendingAssignments > 0) {
    concerns.push(`${pendingAssignments} assignment(s) are still pending submission.`);
  }

  if (!concerns.length) {
    concerns.push("No critical warning signs were detected in the current academic snapshot.");
  }

  return {
    mode: "fallback",
    headline: `${studentName || "Student"} academic analysis`,
    summary: `AI response is unavailable right now, so this guidance is calculated from ${courseCount} course record(s), marks, attendance, and assignment status.`,
    mentorMessage: question
      ? `Your question was noted: "${question}". Use the action plan below as the current best guidance.`
      : "Use the action plan below as the current best guidance from your academic record.",
    focusArea,
    riskLevel,
    confidence: "Medium",
    strengths,
    concerns,
    actionPlan: [
      weakSubjects.length
        ? `Prioritize revision for ${weakSubjects.join(", ")} this week.`
        : "Keep your revision balanced across active subjects.",
      attendancePercent < 75
        ? "Improve attendance consistency over the next few classes."
        : "Maintain your current attendance discipline.",
      pendingAssignments > 0
        ? "Finish pending assignments before starting new revision blocks."
        : "Stay ahead by preparing for upcoming assignments early."
    ]
  };
}

exports.generateInsights = async ({ marks, attendancePercent }) => {
  const formattedMarks = buildFormattedMarks(marks);
  const client = createClient();

  if (!client) {
    return buildFallback(
      formattedMarks,
      attendancePercent,
      "AI service unavailable. Showing calculated fallback insights."
    );
  }

  try {
    const prompt = `
You are an academic AI system.

Analyze student data and return STRICT JSON ONLY.

Data:
Marks: ${JSON.stringify(formattedMarks)}
Attendance: ${attendancePercent}%

Return JSON:
{
  "performance": "Weak | Average | Good",
  "riskLevel": "Low | Medium | High",
  "avgMarks": number,
  "attendance": number,
  "weakSubjects": [string],
  "topSubjects": [string],
  "summary": string,
  "recommendations": [string],
  "alerts": [string]
}

Rules:
- Weak if avgMarks < 40
- Average if 40-70
- Good if >70
- Risk High if marks <40 OR attendance <60
- Risk Medium if moderate
- Risk Low if good
- Keep answers short
`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    });

    return parseJsonResponse(response.choices[0].message.content);
  } catch (error) {
    console.error("AI ERROR:", error.message);

    return buildFallback(
      formattedMarks,
      attendancePercent,
      "AI service unavailable. Showing calculated fallback insights."
    );
  }
};

exports.generateDetailedStudentAnalysis = async ({
  studentName,
  enrollment,
  focusArea,
  question,
  marks,
  attendancePercent,
  pendingAssignments,
  submittedAssignments,
  sectionCourses,
  leaveCount
}) => {
  const formattedMarks = buildFormattedMarks(marks);
  const averageMarks =
    formattedMarks.reduce((sum, mark) => sum + mark.score, 0) /
    (formattedMarks.length || 1);
  const weakSubjects = [...formattedMarks]
    .sort((left, right) => left.score - right.score)
    .slice(0, 2)
    .map((mark) => mark.subject)
    .filter(Boolean);
  const strongSubjects = [...formattedMarks]
    .sort((left, right) => right.score - left.score)
    .slice(0, 2)
    .map((mark) => mark.subject)
    .filter(Boolean);

  const client = createClient();

  if (!client) {
    return buildDetailedFallback({
      studentName,
      focusArea,
      question,
      averageMarks,
      attendancePercent,
      pendingAssignments,
      weakSubjects,
      strongSubjects,
      courseCount: sectionCourses.length
    });
  }

  const context = {
    studentName,
    focusArea,
    question: question || "No extra question provided.",
    enrollment: enrollment || null,
    marks: formattedMarks,
    averageMarks: Number(averageMarks.toFixed(1)),
    attendancePercent: Number(attendancePercent.toFixed(1)),
    pendingAssignments,
    submittedAssignments,
    sectionCourses: sectionCourses.map((course) => course.name),
    leaveCount,
    weakSubjects,
    strongSubjects
  };

  try {
    const prompt = `
You are a caring but direct academic mentor inside a student dashboard.

Analyze the student's academic situation using the JSON context below and return STRICT JSON ONLY.
Do not invent facts outside the context. Be specific and practical.

Context:
${JSON.stringify(context)}

Return JSON in this exact shape:
{
  "headline": string,
  "summary": string,
  "mentorMessage": string,
  "riskLevel": "Low" | "Medium" | "High",
  "confidence": "High" | "Medium" | "Low",
  "strengths": [string],
  "concerns": [string],
  "actionPlan": [string]
}

Rules:
- Mention the requested focus area in the summary or mentorMessage.
- Keep headline under 12 words.
- Keep summary to 2 sentences max.
- strengths, concerns, and actionPlan should each contain 2 to 4 concise items.
- Ground recommendations in marks, attendance, assignments, and courses from the context.
`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    });

    const analysis = parseJsonResponse(response.choices[0].message.content);

    return {
      mode: "ai",
      headline: analysis.headline || `${studentName || "Student"} academic analysis`,
      summary: analysis.summary || "AI analysis completed successfully.",
      mentorMessage: analysis.mentorMessage || "Keep following the action plan for the next study cycle.",
      focusArea,
      riskLevel: analysis.riskLevel || "Medium",
      confidence: analysis.confidence || "Medium",
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      concerns: Array.isArray(analysis.concerns) ? analysis.concerns : [],
      actionPlan: Array.isArray(analysis.actionPlan) ? analysis.actionPlan : []
    };
  } catch (error) {
    console.error("DETAILED AI ERROR:", error.message);

    return buildDetailedFallback({
      studentName,
      focusArea,
      question,
      averageMarks,
      attendancePercent,
      pendingAssignments,
      weakSubjects,
      strongSubjects,
      courseCount: sectionCourses.length
    });
  }
};
