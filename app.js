const TEAM_CONFIG = {
  technical: {
    label: "Technical Team",
    questions: [
      { key: "techStack", label: "Current technical skills (languages/tools)", type: "textarea", required: true },
      {
        key: "buildLevel",
        label: "What have you built so far?",
        type: "select",
        options: ["None yet", "Small beginner projects", "Multiple projects with teamwork", "Production-level apps"],
        required: true,
      },
      { key: "github", label: "GitHub / portfolio link", type: "url", required: false },
      {
        key: "debugStyle",
        label: "How do you debug when code breaks?",
        type: "textarea",
        required: true,
      },
    ],
  },
  social: {
    label: "Social Media Team",
    questions: [
      {
        key: "platforms",
        label: "Which platforms can you manage confidently?",
        type: "textarea",
        required: true,
      },
      {
        key: "campaignExperience",
        label: "Social campaign experience level",
        type: "select",
        options: ["No experience", "Personal account growth", "Handled a club/page campaign", "Ran analytics-backed campaigns"],
        required: true,
      },
      { key: "socialProof", label: "Share social page/profile/analytics link", type: "url", required: false },
      { key: "crisis", label: "How would you handle negative comments/public backlash?", type: "textarea", required: true },
    ],
  },
  content: {
    label: "Content Creation Team",
    questions: [
      { key: "formats", label: "What content formats can you create?", type: "textarea", required: true },
      {
        key: "tools",
        label: "Tools you use (Canva, Figma, Premiere, etc.)",
        type: "textarea",
        required: true,
      },
      { key: "driveLink", label: "Portfolio / Drive link", type: "url", required: false },
      { key: "storytelling", label: "Give one idea for an engaging recruitment post.", type: "textarea", required: true },
    ],
  },
  outreach: {
    label: "Outreach & Partnerships Team",
    questions: [
      { key: "communication", label: "How do you approach a new external partner/speaker?", type: "textarea", required: true },
      {
        key: "confidence",
        label: "Public speaking confidence",
        type: "select",
        options: ["Beginner", "Comfortable in small groups", "Confident with large groups", "Highly experienced"],
        required: true,
      },
      { key: "network", label: "Any past outreach/community engagement examples", type: "textarea", required: false },
    ],
  },
  finance: {
    label: "Finance & Sponsorship Team",
    questions: [
      {
        key: "budgeting",
        label: "Budgeting exposure",
        type: "select",
        options: ["No exposure", "Handled personal/small budgets", "Managed club/event budget", "Built detailed budget reports"],
        required: true,
      },
      { key: "sponsorPitch", label: "Draft your pitch idea to a potential sponsor.", type: "textarea", required: true },
      { key: "negotiation", label: "How would you negotiate if sponsor asks for major concessions?", type: "textarea", required: true },
    ],
  },
};

const form = document.getElementById("applicationForm");
const dynamicSections = document.getElementById("dynamicSections");
const teamChoiceError = document.getElementById("teamChoiceError");
const rows = document.getElementById("applicantRows");
const cards = document.getElementById("screeningCards");
const stats = document.getElementById("stats");
const teamFilter = document.getElementById("teamFilter");
const scoreFilter = document.getElementById("scoreFilter");
const scoreValue = document.getElementById("scoreValue");
const storageNote = document.getElementById("storageNote");
const dashboardPanel = document.getElementById("dashboardPanel");
const adminAccessPanel = document.getElementById("adminAccessPanel");
const adminModeHint = document.getElementById("adminModeHint");
const adminCodeInput = document.getElementById("adminCodeInput");
const adminUnlockBtn = document.getElementById("adminUnlockBtn");
const adminLockBtn = document.getElementById("adminLockBtn");
const adminAuthMessage = document.getElementById("adminAuthMessage");

const STORAGE_KEY = "devCatalystApplicants";
const ADMIN_SESSION_KEY = "devCatalystAdminSession";
const ADMIN_PASSCODE = "DEVCATALYST-ADMIN";
let applicants = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

function createField(question, teamKey) {
  const wrapper = document.createElement("label");
  wrapper.textContent = question.label;
  const name = `team_${teamKey}_${question.key}`;

  let input;
  if (question.type === "select") {
    input = document.createElement("select");
    input.innerHTML = `<option value="">Choose</option>` + question.options.map((option) => `<option>${option}</option>`).join("");
  } else {
    input = document.createElement("input");
    input.type = question.type;
    if (question.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 3;
    }
  }

  input.name = name;
  input.required = question.required;
  wrapper.appendChild(input);
  return wrapper;
}

function renderTeamSections() {
  dynamicSections.innerHTML = "";
  const selected = [...form.querySelectorAll('input[name="teams"]:checked')].map((box) => box.value);

  selected.forEach((teamKey) => {
    const config = TEAM_CONFIG[teamKey];
    const template = document.getElementById("teamSectionTemplate").content.cloneNode(true);
    template.querySelector("legend").textContent = `${config.label} Screening Questions`;
    const body = template.querySelector(".team-body");
    config.questions.forEach((question) => body.appendChild(createField(question, teamKey)));
    dynamicSections.appendChild(template);
  });
}

function scoreFromSelect(value, options) {
  const idx = options.indexOf(value);
  if (idx === -1) return 0;
  return Math.round((idx / (options.length - 1 || 1)) * 100);
}

function textScore(text = "") {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words > 45) return 90;
  if (words > 25) return 75;
  if (words > 12) return 60;
  if (words > 5) return 40;
  return words > 0 ? 25 : 0;
}

function computeAts(formData, teamKey) {
  const config = TEAM_CONFIG[teamKey];
  const values = config.questions.map((question) => {
    const val = formData.get(`team_${teamKey}_${question.key}`) || "";
    if (question.type === "select") return scoreFromSelect(val, question.options);
    if (question.type === "url") return val ? 80 : 35;
    return textScore(val);
  });

  const base = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const motivationBonus = Math.min(textScore(formData.get("motivation")) * 0.2, 15);
  const commitmentBoost = {
    "2-4 hours": 4,
    "5-7 hours": 8,
    "8-10 hours": 12,
    "10+ hours": 15,
  }[formData.get("commitment")] || 0;

  const total = Math.min(100, Math.round(base + motivationBonus + commitmentBoost));
  if (total >= 78) return { score: total, recommendation: "Strong shortlist" };
  if (total >= 58) return { score: total, recommendation: "Consider for interview" };
  return { score: total, recommendation: "Hold / skill-building track" };
}

function topTeamResult(teamScores) {
  return Object.entries(teamScores).sort((a, b) => b[1].score - a[1].score)[0];
}



function isAdminView() {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "admin";
}

function setDashboardAccess(isUnlocked) {
  dashboardPanel.hidden = !isUnlocked;
  localStorage.setItem(ADMIN_SESSION_KEY, isUnlocked ? "unlocked" : "locked");
  adminAuthMessage.textContent = isUnlocked ? "Admin dashboard unlocked." : "Dashboard is locked.";
}

function initializeAdminAccess() {
  if (!isAdminView()) {
    adminAccessPanel.hidden = true;
    dashboardPanel.hidden = true;
    adminModeHint.hidden = false;
    return;
  }

  adminAccessPanel.hidden = false;
  adminModeHint.hidden = true;

  const isUnlocked = localStorage.getItem(ADMIN_SESSION_KEY) === "unlocked";
  dashboardPanel.hidden = !isUnlocked;
  adminAuthMessage.textContent = isUnlocked ? "Admin dashboard unlocked." : "Dashboard is locked.";

  adminUnlockBtn.addEventListener("click", () => {
    if (adminCodeInput.value.trim() !== ADMIN_PASSCODE) {
      dashboardPanel.hidden = true;
      localStorage.setItem(ADMIN_SESSION_KEY, "locked");
      adminAuthMessage.textContent = "Invalid admin passcode.";
      return;
    }

    adminCodeInput.value = "";
    setDashboardAccess(true);
    renderDashboard();
  });

  adminLockBtn.addEventListener("click", () => {
    setDashboardAccess(false);
  });
}

function updateStorageNote() {
  storageNote.innerHTML = `
    <strong>Storage:</strong> Form submissions are currently stored in this browser's local storage only (key: <code>${STORAGE_KEY}</code>, records: ${applicants.length}).
    <div class="form-actions compact">
      <button id="exportBtn" type="button" class="secondary">Export JSON</button>
      <button id="clearBtn" type="button" class="secondary danger">Clear All Submissions</button>
    </div>
  `;

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(applicants, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dev-catalyst-applications-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!window.confirm("This will permanently remove all stored submissions from this browser. Continue?")) return;
    applicants = [];
    localStorage.removeItem(STORAGE_KEY);
    renderDashboard();
  });
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applicants));
  renderDashboard();
}

function renderDashboard() {
  if (!isAdminView() || dashboardPanel.hidden) return;

  const filterTeam = teamFilter.value;
  const minScore = Number(scoreFilter.value);

  const filtered = applicants.filter((candidate) => {
    const scores = Object.entries(candidate.teamScores);
    const matchTeam = filterTeam === "all" || scores.some(([team]) => team === filterTeam);
    const matchScore = scores.some(([, result]) => result.score >= minScore);
    return matchTeam && matchScore;
  });

  const shortlistCount = filtered.filter((candidate) => Object.values(candidate.teamScores).some((res) => res.score >= 78)).length;
  const avgScore = filtered.length
    ? Math.round(
        filtered
          .map((candidate) => topTeamResult(candidate.teamScores)[1].score)
          .reduce((a, b) => a + b, 0) / filtered.length
      )
    : 0;

  stats.innerHTML = `
    <div class="stat"><div>Total Applicants</div><div class="value">${filtered.length}</div></div>
    <div class="stat"><div>Shortlist Ready</div><div class="value">${shortlistCount}</div></div>
    <div class="stat"><div>Avg Top ATS</div><div class="value">${avgScore}</div></div>
  `;

  rows.innerHTML = filtered
    .map((candidate) => {
      const [team, best] = topTeamResult(candidate.teamScores);
      return `<tr>
        <td>${candidate.profile.name}</td>
        <td>${candidate.teams.map((t) => TEAM_CONFIG[t].label).join(", ")}</td>
        <td>${best.score} (${TEAM_CONFIG[team].label})</td>
        <td>${best.recommendation}</td>
      </tr>`;
    })
    .join("");

  cards.innerHTML = filtered
    .map((candidate) => {
      const details = Object.entries(candidate.teamScores)
        .map(([team, result]) => {
          const klass = result.score >= 78 ? "pass" : result.score >= 58 ? "maybe" : "reject";
          return `<span class="badge ${klass}">${TEAM_CONFIG[team].label}: ${result.score}</span>`;
        })
        .join("");

      return `<article class="card">
        <h4>${candidate.profile.name}</h4>
        <div>${details}</div>
        <p><strong>Intent Signal:</strong> ${candidate.profile.motivation.slice(0, 130)}...</p>
        <p><strong>Event Readiness:</strong> ${candidate.profile.eventExperience} • ${candidate.profile.eventRole}</p>
      </article>`;
    })
    .join("");

  updateStorageNote();
}

function validateTeamCount() {
  const checked = form.querySelectorAll('input[name="teams"]:checked').length;
  if (checked < 1 || checked > 2) {
    teamChoiceError.textContent = "Please choose at least 1 and at most 2 specialist teams.";
    return false;
  }
  teamChoiceError.textContent = "";
  return true;
}

form.addEventListener("change", (event) => {
  if (event.target.name === "teams") {
    validateTeamCount();
    renderTeamSections();
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateTeamCount()) return;

  const formData = new FormData(form);
  const teams = formData.getAll("teams");
  const profile = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    department: formData.get("department"),
    motivation: formData.get("motivation"),
    commitment: formData.get("commitment"),
    deadlineStyle: formData.get("deadlineStyle"),
    challenge: formData.get("challenge"),
    eventExperience: formData.get("eventExperience"),
    eventRole: formData.get("eventRole"),
    eventCrisis: formData.get("eventCrisis"),
  };

  const teamScores = Object.fromEntries(teams.map((team) => [team, computeAts(formData, team)]));
  applicants.unshift({ profile, teams, teamScores, createdAt: new Date().toISOString() });

  form.reset();
  dynamicSections.innerHTML = "";
  persistAndRender();
});

teamFilter.addEventListener("change", renderDashboard);
scoreFilter.addEventListener("input", () => {
  scoreValue.textContent = scoreFilter.value;
  renderDashboard();
});

initializeAdminAccess();
if (!dashboardPanel.hidden) renderDashboard();
