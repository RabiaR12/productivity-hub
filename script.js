/* =========================
   Productivity Hub - script.js
   SIMPLE NAV (per manager feedback)
   - ONLY 2 main sections:
     1) Productivity (Assets / Employee / Manager)
     2) Incident Management (iframe loads /incident/index.html)

   Notes:
   - Incident module files live under /incident and keep their own routing.
   - This script controls the main Productivity Hub shell + Assets.
   ========================= */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function nowPretty() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function randBetween(min, max) { return Math.random() * (max - min) + min; }

function showLoading(on) {
  const o = $("#loadingOverlay");
  if (!o) return;
  o.classList.toggle("hidden", !on);
  o.setAttribute("aria-hidden", String(!on));
}

function setLastUpdated() {
  const el = $("#lastUpdated");
  if (el) el.textContent = `Updated ${nowPretty()}`;
}

/* =========================
   Chart.js defaults
   ========================= */
if (window.Chart) {
  Chart.defaults.font.family = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  Chart.defaults.color = "#0f172a";
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.elements.point.radius = 3;
  Chart.defaults.elements.point.hoverRadius = 5;
}

const C = {
  teal: "#20c7c7",
  tealSoft: "rgba(32,199,199,0.25)",
  blue: "#60a5fa",
  blue2: "#3b82f6",
  indigo: "#6366f1",
  slate: "#64748b",
  grid: "#e8eef7",
  orange: "#ff9900",
  red: "#ef4444",
  green: "#22c55e",
  amber: "#f59e0b"
};

let charts = {
  employee: {},
  manager: {},
  assets: {}
};

/* =========================
   MAIN NAV: 2 Sections
   ========================= */
const SECTION_META = {
  productivity: {
    title: "Productivity",
    sub: "Employee, Manager, and Amazon office asset insights."
  },
  incident: {
    title: "Incident Management",
    sub: "Integrated incident console (loaded from incident/index.html)."
  }
};

function setActiveSection(section) {
  // sidebar active
  $$("#mainNav .side-item").forEach(btn => {
    const on = btn.dataset.section === section;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", String(on));
  });

  // show/hide sections
  const prod = $("#section-productivity");
  const inc = $("#section-incident");
  if (prod) prod.classList.toggle("active", section === "productivity");
  if (inc) inc.classList.toggle("active", section === "incident");

  // title/sub
  if ($("#pageTitle")) $("#pageTitle").textContent = SECTION_META[section]?.title ?? "Dashboard";
  if ($("#pageSub")) $("#pageSub").textContent = SECTION_META[section]?.sub ?? "";

  showLoading(true);
  setTimeout(() => showLoading(false), 380);

  // When switching to Productivity, ensure the current sub-view is mounted & charts exist
  if (section === "productivity") {
    const activeView = $("#productivityTabs .subtab.active")?.dataset?.view || "assets";
    setActiveProductivityView(activeView, { silent: true });
  }
}

function bindMainNav() {
  $$("#mainNav .side-item").forEach(btn => {
    btn.addEventListener("click", () => setActiveSection(btn.dataset.section));
  });
}

/* =========================
   PRODUCTIVITY: subtabs
   Assets / Employee / Manager
   ========================= */
function setActiveProductivityView(view, opts = {}) {
  // tab button states
  $$("#productivityTabs .subtab").forEach(b => {
    const on = b.dataset.view === view;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", String(on));
  });

  // panel states
  $$(".viewwrap .view").forEach(v => {
    v.classList.toggle("active", v.dataset.view === view);
  });

  // mount dashboards + charts as needed
  if (view === "employee") {
    mountEmployee();
    ensureEmployeeCharts();
  } else if (view === "manager") {
    mountManager();
    ensureManagerCharts();
  } else if (view === "assets") {
    ensureAssets();
  }

  if (!opts.silent) {
    showLoading(true);
    setTimeout(() => showLoading(false), 320);
  }
}

function bindProductivityTabs() {
  $$("#productivityTabs .subtab").forEach(btn => {
    btn.addEventListener("click", () => setActiveProductivityView(btn.dataset.view));
  });
}

/* =========================
   Employee Dashboard (existing style)
   Mounted into #employeeMount
   ========================= */
function backToProductivityTabsNote() {
  return `<div class="muted" style="font-size:12px;">Use the tabs above to switch views.</div>`;
}

function mountEmployee() {
  const mount = $("#employeeMount");
  if (!mount) return;
  if (mount.dataset.mounted === "true") return;

  mount.innerHTML = buildEmployeeDashboardHTML();
  mount.dataset.mounted = "true";
}

function buildEmployeeDashboardHTML() {
  return `
    <div class="card" style="padding:16px; margin-bottom:14px;">
      <div class="card-head" style="align-items:center;">
        <div>
          <div class="card-title" style="font-size:15px;">Employee Dashboard — Personal Productivity</div>
          <div class="card-note">Focus • Meetings • Tasks • Wellbeing • Recommendations</div>
        </div>
        ${backToProductivityTabsNote()}
      </div>
    </div>

    <div class="grid" style="grid-template-columns: repeat(4, minmax(0, 1fr)); gap:14px;">
      ${employeeMetricCard({
        title: "Daily Focus Metrics",
        rows: [
          { l: "Deep Work Time", r: "7h 0m" },
          { l: "Focus Score", r: "0.8/1.0" }
        ],
        insightTitle: "AI Insight",
        insightText: "Your focus score is above average. Consider blocking 2–3 hour chunks for complex tasks."
      })}

      ${employeeMetricCard({
        title: "Meeting Analytics",
        rows: [
          { l: "Meeting Time", r: "3h 0m" },
          { l: "Meetings Attended", r: "4" },
          { l: "Engagement Score", r: "85%" }
        ],
        insightTitle: "Meeting Optimization",
        insightText: "You have 2 back-to-back meetings tomorrow. Suggest adding 15-min buffers."
      })}

      ${employeeTaskCard()}

      ${employeeMetricCard({
        title: "Communication Patterns",
        rows: [
          { l: "Messages Sent", r: "25" },
          { l: "Collaboration Score", r: "0.7/1.0" }
        ],
        insightTitle: "Communication Insight",
        insightText: "Your response time is faster than team average. Use async updates for non-urgent items."
      })}
    </div>

    <div class="grid two" style="margin-top:14px;">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Wellbeing Monitor</div>
            <div class="card-note">Daily health</div>
          </div>
        </div>
        <div class="divider"></div>
        <div style="display:grid; gap:10px; font-size:13px;">
          <div style="display:flex; justify-content:space-between;"><span>Burnout Risk</span><b style="color:${C.green};">Low (0.3)</b></div>
          <div style="display:flex; justify-content:space-between;"><span>Work-Life Balance</span><b style="color:${C.green};">Healthy</b></div>
          <div style="display:flex; justify-content:space-between;"><span>After-hours Load</span><b>Low</b></div>
        </div>
        <div class="divider"></div>
        <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
          <div style="font-weight:950; font-size:13px;">Wellness Recommendation</div>
          <div class="muted" style="font-size:12.5px; margin-top:6px;">
            Great balance. Take a 10–15 min break every 2 hours.
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Weekly Trends</div>
            <div class="card-note">Deep work vs meetings</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="canvas-wrap" style="height:220px;">
          <canvas id="empWeeklyChart"></canvas>
        </div>
        <div class="divider"></div>
        <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
          <div style="font-weight:950; font-size:13px;">Trend Analysis</div>
          <div class="muted" style="font-size:12.5px; margin-top:6px;">
            Deep work increased this week. Meeting time slightly decreased.
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-head">
        <div>
          <div class="card-title">AI-Powered Recommendations</div>
          <div class="card-note">Today’s actions</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap:14px;">
        ${employeeRecoCard("Schedule Optimization", "Block 9–11 AM tomorrow for deep work. Your productivity peaks then.")}
        ${employeeRecoCard("Collaboration Suggestion", "Schedule a 1:1 with a teammate you haven’t synced with recently.")}
        ${employeeRecoCard("Skill Development", "Complete one short learning module today to maintain momentum.")}
      </div>
    </div>
  `;
}

function employeeMetricCard({ title, rows, insightTitle, insightText }) {
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${title}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div style="display:grid; gap:10px; font-size:13px;">
        ${rows.map(r => `
          <div style="display:flex; justify-content:space-between; gap:10px;">
            <span class="muted">${r.l}</span>
            <b>${r.r}</b>
          </div>
        `).join("")}
      </div>
      <div class="divider"></div>
      <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
        <div style="font-weight:950; font-size:13px;">${insightTitle}</div>
        <div class="muted" style="font-size:12.5px; margin-top:6px;">${insightText}</div>
      </div>
    </div>
  `;
}

function employeeTaskCard() {
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Task Completion</div>
        </div>
      </div>
      <div class="divider"></div>
      <div style="display:flex; justify-content:space-between; font-size:13px;">
        <span class="muted">Tasks Completed</span>
        <b>3/5</b>
      </div>
      <div class="divider"></div>
      <div style="display:grid; gap:10px; font-size:12.5px;">
        ${employeeTaskRow("High", "Fix API authentication bug", C.red)}
        ${employeeTaskRow("Medium", "Code review for user service", C.amber)}
        ${employeeTaskRow("Low", "Update documentation", C.green)}
      </div>
      <div class="divider"></div>
      <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
        <div style="font-weight:950; font-size:13px;">Task Prediction</div>
        <div class="muted" style="font-size:12.5px; margin-top:6px;">
          You’re likely to complete 4/5 tasks today. Defer low priority if needed.
        </div>
      </div>
    </div>
  `;
}

function employeeTaskRow(level, text, color) {
  return `
    <div style="display:flex; align-items:flex-start; gap:10px;">
      <span style="width:6px; height:18px; border-radius:999px; background:${color}; display:inline-block;"></span>
      <div style="flex:1;">
        <div style="font-weight:950;">${level}</div>
        <div class="muted" style="margin-top:2px;">${text}</div>
      </div>
    </div>
  `;
}

function employeeRecoCard(title, text) {
  return `
    <div class="card" style="box-shadow:none; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25);">
      <div style="font-weight:950;">${title}</div>
      <div class="muted" style="font-size:12.5px; margin-top:6px; line-height:1.6;">${text}</div>
    </div>
  `;
}

/* =========================
   Manager Dashboard (existing style)
   Mounted into #managerMount
   ========================= */
function mountManager() {
  const mount = $("#managerMount");
  if (!mount) return;
  if (mount.dataset.mounted === "true") return;

  mount.innerHTML = buildManagerDashboardHTML();
  mount.dataset.mounted = "true";
}

function buildManagerDashboardHTML() {
  return `
    <div class="card" style="padding:16px; margin-bottom:14px;">
      <div class="card-head" style="align-items:center;">
        <div>
          <div class="card-title" style="font-size:15px;">Manager Dashboard — Engineering Team</div>
          <div class="card-note">Team focus • workload • utilization • risks • actions</div>
        </div>
        ${backToProductivityTabsNote()}
      </div>
    </div>

    <div class="kpis" style="margin-bottom:14px; grid-template-columns: repeat(6, 1fr);">
      <div class="kpi"><div class="kpi-label">Avg Deep Work / Day</div><div class="kpi-value">6.8<span class="kpi-unit">h</span></div><div class="kpi-foot">+12% vs last week</div></div>
      <div class="kpi"><div class="kpi-label">Avg Meetings / Day</div><div class="kpi-value">3.2<span class="kpi-unit">h</span></div><div class="kpi-foot">-8% vs last week</div></div>
      <div class="kpi"><div class="kpi-label">Team Throughput</div><div class="kpi-value">85</div><div class="kpi-foot">Items closed</div></div>
      <div class="kpi"><div class="kpi-label">Burnout Index</div><div class="kpi-value">0.72</div><div class="kpi-foot">+5% vs last week</div></div>
      <div class="kpi"><div class="kpi-label">On-call Load</div><div class="kpi-value">14<span class="kpi-unit">%</span></div><div class="kpi-foot">Of team week</div></div>
      <div class="kpi"><div class="kpi-label">Room Utilization</div><div class="kpi-value">75<span class="kpi-unit">%</span></div><div class="kpi-foot">Stable</div></div>
    </div>

    <div class="grid two">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Team Performance Overview</div>
            <div class="card-note">Focus • workload • risk</div>
          </div>
        </div>
        <div class="divider"></div>

        <div class="table">
          <div class="trow thead" style="grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr;">
            <div>Name</div><div>Role</div><div>Focus</div><div>Workload</div><div>Burnout</div>
          </div>
          <div id="mgrTeamRows"></div>
        </div>

        <div class="divider"></div>
        <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
          <div style="font-weight:950; font-size:13px;">AI Team Insight</div>
          <div class="muted" style="font-size:12.5px; margin-top:6px;">
            One member shows elevated burnout indicators. Recommend a 1:1 and workload swap for 48 hours.
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Alerts & Recommendations</div>
            <div class="card-note">Prioritized</div>
          </div>
        </div>
        <div class="divider"></div>

        <div class="mini-list">
          ${miniAlert("High Priority", "Immediate action required", "Maria Garcia’s burnout risk trending up.", "high")}
          ${miniAlert("Medium Priority", "Schedule improvement", "Add 15-min buffers for two back-to-back meetings.", "med")}
          ${miniAlert("Opportunity", "Mentorship", "Assign John as mentor for new hire onboarding.", "med")}
        </div>

        <div class="divider"></div>
        <div class="card" style="padding:12px; background: rgba(59,130,246,0.10); border:1px solid rgba(59,130,246,0.22); box-shadow:none;">
          <div style="font-weight:950; font-size:13px;">Smart Scheduling</div>
          <div class="muted" style="font-size:12.5px; margin-top:6px;">
            Move Monday stand-up from Thu 2 PM → Wed 2 PM to reduce meeting clusters.
          </div>
        </div>
      </div>
    </div>

    <div class="grid two" style="margin-top:14px;">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Team Productivity Trends</div>
            <div class="card-note">Deep work vs meetings</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="canvas-wrap tall">
          <canvas id="mgrTrendChart"></canvas>
        </div>
        <div class="divider"></div>
        <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
          <div style="font-weight:950; font-size:13px;">Trend Analysis</div>
          <div class="muted" style="font-size:12.5px; margin-top:6px;">
            Deep work improved after reducing meeting clusters. Consider extending “No-meeting mornings.”
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Workload Distribution</div>
            <div class="card-note">Tasks by owner</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="canvas-wrap tall">
          <canvas id="mgrWorkloadChart"></canvas>
        </div>
        <div class="divider"></div>

        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap:12px;">
          ${roomCard("Conf Room A", "95%", "Overbooked", "rgba(239,68,68,0.10)", "rgba(239,68,68,0.25)")}
          ${roomCard("Conf Room B", "78%", "Well utilized", "rgba(245,158,11,0.10)", "rgba(245,158,11,0.25)")}
          ${roomCard("Conf Room C", "45%", "Underutilized", "rgba(34,197,94,0.10)", "rgba(34,197,94,0.25)")}
        </div>

        <div class="divider"></div>
        <div class="card" style="padding:12px; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25); box-shadow:none;">
          <div style="font-weight:950; font-size:13px;">Room Optimization</div>
          <div class="muted" style="font-size:12.5px; margin-top:6px;">
            Suggest relocating recurring meetings from A → C. Potential ~20% efficiency gain.
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px;">
      <div class="card-head">
        <div>
          <div class="card-title">AI-Powered Action Items</div>
          <div class="card-note">This week</div>
        </div>
      </div>
      <div class="divider"></div>

      <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap:14px;">
        ${actionCard("Immediate Actions", [
          "Schedule check-in with Maria (burnout risk)",
          "Reassign non-critical tasks from Maria",
          "Reserve rooms for critical meetings only"
        ])}
        ${actionCard("This Week", [
          "Implement “Focus Friday” — no meetings after 2 PM",
          "Pair Alex with John for skill development",
          "Review alerts and insights report"
        ])}
        ${actionCard("Strategic Improvement", [
          "Standardize meeting templates and agendas",
          "Add utilization-based room booking rules",
          "Create monthly team health review"
        ])}
      </div>
    </div>
  `;
}

function miniAlert(title, subtitle, text, level) {
  return `
    <div class="mini-item">
      <span class="tag ${level}">${title}</span>
      <div style="flex:1;">
        <div class="mini-title">${subtitle}</div>
        <div class="mini-sub">${text}</div>
      </div>
    </div>
  `;
}
function roomCard(name, pct, note, bg, border) {
  return `
    <div class="card" style="box-shadow:none; background:${bg}; border:1px solid ${border}; text-align:center;">
      <div style="font-weight:950; font-size:12.5px;">${name}</div>
      <div style="margin-top:10px; font-size:18px; font-weight:950;">${pct}</div>
      <div class="muted" style="margin-top:6px; font-size:12px;">${note}</div>
    </div>
  `;
}
function actionCard(title, items) {
  return `
    <div class="card" style="box-shadow:none; background: rgba(99,102,241,0.10); border:1px solid rgba(99,102,241,0.25);">
      <div style="font-weight:950;">${title}</div>
      <div class="divider"></div>
      <ul class="muted" style="margin:0; padding-left:18px; font-size:12.5px; line-height:1.8;">
        ${items.map(i => `<li>${i}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderManagerTeamTable() {
  const host = $("#mgrTeamRows");
  if (!host) return;

  const rows = [
    { n: "John Smith", r: "Senior SWE", f: "0.8", w: "3/5", b: "Low" },
    { n: "Alex Thompson", r: "Software Engineer", f: "0.6", w: "3/5", b: "Medium" },
    { n: "Maria Garcia", r: "Junior Developer", f: "0.4", w: "3/5", b: "Elevated" }
  ];

  host.innerHTML = rows.map(x => `
    <div class="trow" style="grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr;">
      <div><b>${x.n}</b></div>
      <div class="muted">${x.r}</div>
      <div><span class="muted">Focus:</span> <b>${x.f}</b></div>
      <div><span class="muted">Task:</span> <b>${x.w}</b></div>
      <div><b>${x.b}</b></div>
    </div>
  `).join("");
}

/* =========================
   Charts: Employee / Manager
   ========================= */
function ensureEmployeeCharts() {
  if (!window.Chart) return;

  const canvas = $("#empWeeklyChart");
  if (!canvas) return;
  if (charts.employee.weekly) return;

  charts.employee.weekly = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        { label: "Deep Work (hrs)", data: [5.8, 6.4, 6.9, 6.2, 7.0, 3.2, 2.8], tension: 0.35, borderColor: C.teal, pointBackgroundColor: C.teal, fill: true, backgroundColor: "rgba(32,199,199,0.16)" },
        { label: "Meetings (hrs)", data: [3.5, 3.1, 3.0, 3.4, 2.7, 0.8, 0.6], tension: 0.35, borderColor: C.indigo, pointBackgroundColor: C.indigo, fill: true, backgroundColor: "rgba(99,102,241,0.10)" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: C.grid }, ticks: { color: C.slate } },
        x: { grid: { display: false }, ticks: { color: C.slate } }
      },
      plugins: { legend: { labels: { color: C.slate } } }
    }
  });
}

function ensureManagerCharts() {
  if (!window.Chart) return;

  renderManagerTeamTable();

  const c1 = $("#mgrTrendChart");
  if (c1 && !charts.manager.trend) {
    charts.manager.trend = new Chart(c1, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        datasets: [
          { label: "Deep Work (hrs)", data: [6.2, 6.7, 7.1, 6.9, 7.3], tension: 0.35, borderColor: C.teal, pointBackgroundColor: C.teal, fill: true, backgroundColor: "rgba(32,199,199,0.18)" },
          { label: "Meetings (hrs)", data: [3.6, 3.1, 3.4, 2.9, 2.8], tension: 0.35, borderColor: C.indigo, pointBackgroundColor: C.indigo, fill: true, backgroundColor: "rgba(99,102,241,0.12)" }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: C.grid }, ticks: { color: C.slate } },
          x: { grid: { display: false }, ticks: { color: C.slate } }
        },
        plugins: { legend: { labels: { color: C.slate } } }
      }
    });
  }

  const c2 = $("#mgrWorkloadChart");
  if (c2 && !charts.manager.workload) {
    charts.manager.workload = new Chart(c2, {
      type: "bar",
      data: {
        labels: ["John", "Alex", "Maria", "Nina", "Sam"],
        datasets: [{
          label: "Open Tasks",
          data: [8, 11, 6, 9, 7],
          backgroundColor: "rgba(96, 165, 250, 0.65)",
          borderColor: C.blue2,
          borderWidth: 1.2,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: C.grid }, ticks: { color: C.slate } },
          x: { grid: { display: false }, ticks: { color: C.slate } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

/* =========================
   ASSETS (Amazon offices)
   - Adds Admin-like metrics + charts + ops table rows
   - Printers (click -> details)
   - Conference Rooms
   - Zoom Rooms
   - Hot Desks
   - Lockers
   ========================= */
const OFFICE_LABELS = {
  hq2: "HQ2 (Arlington)",
  seattle: "Seattle",
  nyc: "New York",
  austin: "Austin"
};

const ASSET_DATA = [
  // HQ2
  { id: "p-hq2-01", office: "hq2", type: "printers", name: "Printer — HQ2 12F North", location: "HQ2 • 12F • North", status: "Online", utilization: 0.78, lastUsed: "Today 09:10", details: { model: "HP LaserJet MFP", queue: "HQ2-12N", toner: "62%", paper: "A4 • 40%", owner: "Facilities" } },
  { id: "p-hq2-02", office: "hq2", type: "printers", name: "Printer — HQ2 7F West", location: "HQ2 • 7F • West", status: "Needs Toner", utilization: 0.64, lastUsed: "Today 08:22", details: { model: "Canon iR-ADV", queue: "HQ2-7W", toner: "11%", paper: "Letter • 55%", owner: "Facilities" } },
  { id: "r-hq2-01", office: "hq2", type: "rooms", name: "Conf Room — Potomac A", location: "HQ2 • 10F", status: "In Use", utilization: 0.92, lastUsed: "Now", details: { capacity: 10, equipment: "TV • HDMI • Whiteboard", nextFree: "11:30 AM" } },
  { id: "r-hq2-02", office: "hq2", type: "rooms", name: "Conf Room — Arlington B", location: "HQ2 • 8F", status: "Available", utilization: 0.58, lastUsed: "Yesterday 4:10", details: { capacity: 6, equipment: "TV • USB-C", nextFree: "Now" } },
  { id: "z-hq2-01", office: "hq2", type: "zoom", name: "Zoom Room — HQ2 Studio 1", location: "HQ2 • 9F", status: "Online", utilization: 0.71, lastUsed: "Today 08:55", details: { kit: "Neat Bar + Pad", mic: "Ceiling mic", network: "Healthy" } },
  { id: "d-hq2-01", office: "hq2", type: "desks", name: "Hot Desks — HQ2 6F Zone A", location: "HQ2 • 6F", status: "Mixed", utilization: 0.76, lastUsed: "Today", details: { total: 42, available: 11, note: "Peak 10AM–2PM" } },
  { id: "l-hq2-01", office: "hq2", type: "lockers", name: "Lockers — HQ2 1F", location: "HQ2 • 1F", status: "Online", utilization: 0.69, lastUsed: "Today", details: { total: 80, available: 22, note: "Mobile unlock enabled" } },

  // Seattle
  { id: "p-sea-01", office: "seattle", type: "printers", name: "Printer — SEA 4F East", location: "SEA • 4F • East", status: "Online", utilization: 0.74, lastUsed: "Today 07:45", details: { model: "HP LaserJet", queue: "SEA-4E", toner: "48%", paper: "Letter • 60%", owner: "Facilities" } },
  { id: "r-sea-01", office: "seattle", type: "rooms", name: "Conf Room — Lake Union", location: "SEA • 3F", status: "Available", utilization: 0.61, lastUsed: "Today 06:40", details: { capacity: 12, equipment: "TV • Whiteboard", nextFree: "Now" } },
  { id: "z-sea-01", office: "seattle", type: "zoom", name: "Zoom Room — SEA Pod 2", location: "SEA • 2F", status: "Offline", utilization: 0.33, lastUsed: "Yesterday 3:02", details: { kit: "Logitech Rally", mic: "Table mic", network: "Investigating" } },

  // NYC
  { id: "p-nyc-01", office: "nyc", type: "printers", name: "Printer — NYC 5F", location: "NYC • 5F", status: "Online", utilization: 0.68, lastUsed: "Today 09:01", details: { model: "Xerox VersaLink", queue: "NYC-5F", toner: "55%", paper: "Letter • 30%", owner: "Facilities" } },
  { id: "r-nyc-01", office: "nyc", type: "rooms", name: "Conf Room — Midtown A", location: "NYC • 6F", status: "In Use", utilization: 0.88, lastUsed: "Now", details: { capacity: 8, equipment: "TV • HDMI", nextFree: "12:00 PM" } },

  // Austin
  { id: "z-aus-01", office: "austin", type: "zoom", name: "Zoom Room — AUS Focus 1", location: "AUS • 4F", status: "Online", utilization: 0.66, lastUsed: "Today 08:10", details: { kit: "Neat Bar", mic: "Integrated", network: "Healthy" } },
  { id: "d-aus-01", office: "austin", type: "desks", name: "Hot Desks — AUS 2F Zone C", location: "AUS • 2F", status: "Mixed", utilization: 0.59, lastUsed: "Today", details: { total: 30, available: 9, note: "Most used after 1PM" } }
];

/* ---------- Admin-like Assets "system" numbers (simple & realistic) ---------- */
const GOV_BASE = {
  uptime: 99.7,
  autoRemed: 84,
  policyBlocks: 12,
  compliance: 98.2,
  retentionFlags: 3,
  signalsM: 2.3 // million
};

function calcGovMetrics(list) {
  // Tie some of these lightly to issues so it feels connected
  const issues = list.filter(a => String(a.status).toLowerCase().includes("offline") || String(a.status).toLowerCase().includes("toner")).length;
  const under = list.filter(a => (a.utilization || 0) < 0.45).length;

  const uptime = clamp(GOV_BASE.uptime - (issues * 0.12) - (under * 0.03) + randBetween(-0.05, 0.05), 98.9, 99.99);
  const autoRemed = Math.max(0, Math.round(GOV_BASE.autoRemed + issues * 4 + randBetween(-3, 3)));
  const policyBlocks = Math.max(0, Math.round(GOV_BASE.policyBlocks + randBetween(-2, 2)));
  const compliance = clamp(GOV_BASE.compliance - (issues * 0.18) + randBetween(-0.15, 0.15), 94.0, 99.9);
  const retentionFlags = Math.max(0, Math.round(GOV_BASE.retentionFlags + (issues > 1 ? 1 : 0) + randBetween(-1, 1)));
  const signalsM = clamp(GOV_BASE.signalsM + randBetween(-0.2, 0.2), 1.2, 4.8);

  return { uptime, autoRemed, policyBlocks, compliance, retentionFlags, signalsM };
}

function writeGovMetrics(m) {
  const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  set("#kpiUptime", m.uptime.toFixed(1));
  set("#kpiAutoRemed", String(m.autoRemed));
  set("#kpiPolicyBlocks", String(m.policyBlocks));
  set("#kpiCompliance", m.compliance.toFixed(1));
  set("#kpiRetentionFlags", String(m.retentionFlags));
  set("#kpiSignals", m.signalsM.toFixed(1));
  const pill = $("#pillRetentionCount");
  if (pill) pill.textContent = String(m.retentionFlags);
}

function updateAssetsCriticalAlert(list) {
  const el = $("#assetsCriticalNote");
  if (!el) return;

  const issues = list.filter(a => /offline|toner/i.test(String(a.status))).length;
  const hot = list.filter(a => (a.utilization || 0) >= 0.85).length;

  if (issues >= 2) {
    el.textContent = `Multiple assets exceeded issue thresholds today (${issues} flagged) — review and address within 24 hours.`;
  } else if (hot >= 2) {
    el.textContent = `High demand alert (${hot} assets >85% utilization) — consider redistributing usage or adding capacity.`;
  } else {
    el.textContent = `No critical issues detected. Continue monitoring utilization and availability signals.`;
  }
}

function ensureAssets() {
  // Create charts only once
  ensureAssetsCharts();
  bindAssetsControls();
  renderAssetsAll();
}

function bindAssetsControls() {
  const office = $("#officeSelect");
  const type = $("#assetTypeSelect");

  if (office && !office.dataset.bound) {
    office.addEventListener("change", () => {
      showLoading(true);
      setTimeout(() => {
        renderAssetsAll();
        showLoading(false);
      }, 260);
    });
    office.dataset.bound = "true";
  }

  if (type && !type.dataset.bound) {
    type.addEventListener("change", () => {
      showLoading(true);
      setTimeout(() => {
        renderAssetsAll();
        showLoading(false);
      }, 260);
    });
    type.dataset.bound = "true";
  }
}

function getAssetFilters() {
  const office = $("#officeSelect")?.value || "all";
  const type = $("#assetTypeSelect")?.value || "all";
  return { office, type };
}

function filteredAssets() {
  const { office, type } = getAssetFilters();
  return ASSET_DATA.filter(a =>
    (office === "all" || a.office === office) &&
    (type === "all" || a.type === type)
  );
}


function renderAssetsAll() {
  const list = filteredAssets();

  updateAssetsKPIs(list);

  // ✅ admin-like metrics into Assets
  const gov = calcGovMetrics(list);
  writeGovMetrics(gov);

  updateAssetsCriticalAlert(list);

  renderAssetsCharts(list);
  renderAssetsOpsTable(list);
  renderAssetsList(list);

  // Keep details if selected item still exists; otherwise reset
  const selectedId = $("#assetDetails")?.dataset?.selectedId;
  if (selectedId && list.some(x => x.id === selectedId)) {
    renderAssetDetails(list.find(x => x.id === selectedId));
  } else {
    resetAssetDetails();
  }

  setLastUpdated();
}

function updateAssetsKPIs(list) {
  // utilization = average utilization
  const avgUtil = list.length
    ? Math.round((list.reduce((s, a) => s + (a.utilization || 0), 0) / list.length) * 100)
    : 0;

  // online = Online + Available + In Use + Mixed + Needs Toner
  const onlineStatuses = new Set(["Online", "Available", "In Use", "Mixed", "Needs Toner"]);
  const online = list.filter(a => onlineStatuses.has(a.status)).length;

  // issues
  const issueStatuses = new Set(["Offline", "Needs Toner"]);
  const issues = list.filter(a => issueStatuses.has(a.status)).length;

  // underutilized < 0.45
  const under = list.filter(a => (a.utilization || 0) < 0.45).length;

  const u = $("#kpiAssetUtil");
  const o = $("#kpiAssetsOnline");
  const i = $("#kpiAssetIssues");
  const un = $("#kpiUnderUtil");
  if (u) u.textContent = String(avgUtil);
  if (o) o.textContent = String(online);
  if (i) i.textContent = String(issues);
  if (un) un.textContent = String(under);
}

function ensureAssetsCharts() {
  if (!window.Chart) return;

  const utilCanvas = $("#chartAssetsUtil");
  if (utilCanvas && !charts.assets.util) {
    charts.assets.util = new Chart(utilCanvas, {
      type: "bar",
      data: {
        labels: ["Printers", "Conference Rooms", "Zoom Rooms", "Hot Desks", "Lockers"],
        datasets: [{
          label: "Utilization",
          data: [72, 81, 66, 74, 62],
          backgroundColor: [
            "rgba(32,199,199,0.22)",
            "rgba(96,165,250,0.22)",
            "rgba(99,102,241,0.20)",
            "rgba(255,153,0,0.18)",
            "rgba(100,116,139,0.18)"
          ],
          borderColor: [C.teal, C.blue2, C.indigo, C.orange, C.slate],
          borderWidth: 1.2,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, suggestedMax: 100, grid: { color: C.grid }, ticks: { color: C.slate } },
          x: { grid: { display: false }, ticks: { color: C.slate } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const availCanvas = $("#chartAssetsAvail");
  if (availCanvas && !charts.assets.avail) {
    charts.assets.avail = new Chart(availCanvas, {
      type: "doughnut",
      data: {
        labels: ["Available/Online", "In Use", "Issue/Offline"],
        datasets: [{
          data: [60, 30, 10],
          backgroundColor: [
            "rgba(34,197,94,0.22)",
            "rgba(96,165,250,0.22)",
            "rgba(239,68,68,0.20)"
          ],
          borderColor: "#ffffff",
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: { legend: { position: "right", labels: { color: C.slate } } }
      }
    });
  }

  // ✅ new: Issues by category
  const issuesCanvas = $("#chartAssetsIssues");
  if (issuesCanvas && !charts.assets.issues) {
    charts.assets.issues = new Chart(issuesCanvas, {
      type: "bar",
      data: {
        labels: ["Printers", "Rooms", "Zoom", "Desks", "Lockers"],
        datasets: [{
          label: "Issues",
          data: [2, 1, 1, 0, 0],
          backgroundColor: "rgba(239,68,68,0.20)",
          borderColor: C.red,
          borderWidth: 1.2,
          borderRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: C.grid }, ticks: { color: C.slate }, suggestedMax: 6 },
          x: { grid: { display: false }, ticks: { color: C.slate } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // ✅ new: Compliance trend
  const compCanvas = $("#chartAssetsCompliance");
  if (compCanvas && !charts.assets.compliance) {
    charts.assets.compliance = new Chart(compCanvas, {
      type: "line",
      data: {
        labels: ["Wk-4", "Wk-3", "Wk-2", "Wk-1", "This wk"],
        datasets: [
          {
            label: "Compliance (%)",
            data: [97.8, 98.1, 98.4, 98.0, 98.2],
            tension: 0.35,
            borderColor: C.teal,
            pointBackgroundColor: C.teal,
            fill: true,
            backgroundColor: "rgba(32,199,199,0.14)"
          },
          {
            label: "Drift / Flags",
            data: [4, 3, 2, 4, 3],
            tension: 0.35,
            borderColor: C.amber,
            pointBackgroundColor: C.amber,
            fill: true,
            backgroundColor: "rgba(245,158,11,0.10)"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, grid: { color: C.grid }, ticks: { color: C.slate } },
          x: { grid: { display: false }, ticks: { color: C.slate } }
        },
        plugins: { legend: { labels: { color: C.slate } } }
      }
    });
  }
}

function renderAssetsCharts(list) {
  if (!window.Chart) return;

  // Utilization by type (avg)
  const types = ["printers", "rooms", "zoom", "desks", "lockers"];
  const labels = ["Printers", "Conference Rooms", "Zoom Rooms", "Hot Desks", "Lockers"];
  const byTypeAvg = types.map(t => {
    const items = list.filter(a => a.type === t);
    if (!items.length) return 0;
    return Math.round((items.reduce((s, a) => s + (a.utilization || 0), 0) / items.length) * 100);
  });

  if (charts.assets.util) {
    charts.assets.util.data.labels = labels;
    charts.assets.util.data.datasets[0].data = byTypeAvg;
    charts.assets.util.update();
  }

  // Availability snapshot
  const onlineStatuses = new Set(["Online", "Available", "Mixed", "Needs Toner"]);
  const inUseStatuses = new Set(["In Use"]);
  const issueStatuses = new Set(["Offline"]);

  const online = list.filter(a => onlineStatuses.has(a.status)).length;
  const inUse = list.filter(a => inUseStatuses.has(a.status)).length;
  const issue = list.filter(a => issueStatuses.has(a.status) || a.status === "Needs Toner").length;

  if (charts.assets.avail) {
    charts.assets.avail.data.datasets[0].data = [online, inUse, issue];
    charts.assets.avail.update();
  }

  // Issues by category (counts)
  const issueCount = (t) => list.filter(a => a.type === t && /offline|toner/i.test(String(a.status))).length;
  if (charts.assets.issues) {
    charts.assets.issues.data.datasets[0].data = [
      issueCount("printers"),
      issueCount("rooms"),
      issueCount("zoom"),
      issueCount("desks"),
      issueCount("lockers")
    ];
    charts.assets.issues.update();
  }

  // Compliance trend: slightly adjust based on current computed metrics
  const gov = calcGovMetrics(list);
  if (charts.assets.compliance) {
    const base = gov.compliance;
    const flags = gov.retentionFlags;

    charts.assets.compliance.data.datasets[0].data = [
      clamp(base - 0.4, 0, 100),
      clamp(base - 0.2, 0, 100),
      clamp(base + 0.2, 0, 100),
      clamp(base - 0.1, 0, 100),
      clamp(base, 0, 100)
    ].map(x => Math.round(x * 10) / 10);

    charts.assets.compliance.data.datasets[1].data = [
      Math.max(0, flags + 1),
      Math.max(0, flags),
      Math.max(0, flags - 1),
      Math.max(0, flags + 1),
      Math.max(0, flags)
    ];

    charts.assets.compliance.update();
  }
}

/* ---------- Admin-like Ops Summary table in Assets list card ---------- */
function renderAssetsOpsTable(list) {
  const host = $("#assetsOpsRows");
  if (!host) return;

  const rows = [
    { key: "printers", label: "Printers" },
    { key: "rooms", label: "Conference Rooms" },
    { key: "zoom", label: "Zoom Rooms" },
    { key: "desks", label: "Hot Desks" },
    { key: "lockers", label: "Lockers" }
  ];

  const onlineStatuses = new Set(["Online", "Available", "In Use", "Mixed", "Needs Toner"]);

  host.innerHTML = rows.map(r => {
    const items = list.filter(a => a.type === r.key);
    const online = items.filter(a => onlineStatuses.has(a.status)).length;
    const issues = items.filter(a => /offline|toner/i.test(String(a.status))).length;

    let note = "Stable";
    if (issues >= 2) note = "Needs attention";
    else if (items.length && (items.reduce((s, a) => s + (a.utilization || 0), 0) / items.length) >= 0.85) note = "High demand";
    else if (items.length && (items.reduce((s, a) => s + (a.utilization || 0), 0) / items.length) <= 0.45) note = "Underutilized";

    return `
      <div class="trow" style="grid-template-columns: 1.2fr 1fr 1fr 1fr;">
        <div><b>${r.label}</b></div>
        <div>${online}/${items.length || 0}</div>
        <div>${issues}</div>
        <div class="muted">${note}</div>
      </div>
    `;
  }).join("");
}

function statusPill(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("offline") || s.includes("issue")) return `<span class="pill p-amber">Issue</span>`;
  if (s.includes("needs toner")) return `<span class="pill p-amber">Needs Toner</span>`;
  if (s.includes("in use")) return `<span class="pill p-blue">In Use</span>`;
  if (s.includes("available") || s.includes("online")) return `<span class="pill p-green">Online</span>`;
  return `<span class="pill p-blue">${status}</span>`;
}

function renderAssetsList(list) {
  const host = $("#assetsList");
  if (!host) return;

  // Group by type for clarity (simple)
  const groups = [
    { key: "printers", label: "Printers" },
    { key: "rooms", label: "Conference Rooms" },
    { key: "zoom", label: "Zoom Rooms" },
    { key: "desks", label: "Hot Desks" },
    { key: "lockers", label: "Lockers" }
  ];

  const { type } = getAssetFilters();
  const visibleGroups = type === "all" ? groups : groups.filter(g => g.key === type);

  host.innerHTML = visibleGroups.map(g => {
    const items = list.filter(a => a.type === g.key);
    if (!items.length) {
      return `
        <div class="asset-group">
          <div class="asset-group-title">${g.label}</div>
          <div class="muted" style="font-size:12px; padding:8px 0;">No assets found for this filter.</div>
        </div>
      `;
    }

    return `
      <div class="asset-group">
        <div class="asset-group-title">${g.label}</div>
        <div class="asset-items">
          ${items.map(a => `
            <button class="asset-item" type="button" data-asset-id="${a.id}">
              <div class="asset-main">
                <div class="asset-name">${a.name}</div>
                <div class="asset-sub">${a.location}</div>
              </div>
              <div class="asset-meta">
                ${statusPill(a.status)}
                <div class="asset-util">${Math.round((a.utilization || 0) * 100)}%</div>
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  // Click bind
  $$("#assetsList .asset-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.assetId;
      const asset = list.find(x => x.id === id) || ASSET_DATA.find(x => x.id === id);
      if (asset) renderAssetDetails(asset);
    });
  });
}

function resetAssetDetails() {
  const details = $("#assetDetails");
  const sub = $("#assetDetailsSub");
  const reco = $("#assetRecoText");
  const health = $("#assetHealthText");
  if (!details) return;

  details.dataset.selectedId = "";
  if (sub) sub.textContent = "Select an asset to view status and usage.";

  if (reco) reco.textContent = "Select an asset to see targeted recommendations (restart, service call, replacement, booking rule).";
  if (health) health.textContent = "Select an asset to view health history, uptime, and recent issue trend.";

  details.innerHTML = `
    <div class="empty-state">
      <div class="empty-title">No asset selected</div>
      <div class="empty-sub">Choose a printer, room, or device from the list.</div>
    </div>
  `;
}

function renderAssetDetails(asset) {
  const details = $("#assetDetails");
  const sub = $("#assetDetailsSub");
  const reco = $("#assetRecoText");
  const health = $("#assetHealthText");
  if (!details) return;

  details.dataset.selectedId = asset.id;
  if (sub) sub.textContent = `${OFFICE_LABELS[asset.office]} • ${asset.type.toUpperCase()}`;

  const utilPct = Math.round((asset.utilization || 0) * 100);

  const lines = Object.entries(asset.details || {}).map(([k, v]) => {
    const key = k.replace(/_/g, " ");
    return `
      <div class="detail-row">
        <span class="muted">${capitalize(key)}</span>
        <b>${v}</b>
      </div>
    `;
  }).join("");

  const sugg = suggestedAssetAction(asset);
  const healthTxt = assetHealthSummary(asset);

  if (reco) reco.textContent = sugg;
  if (health) health.textContent = healthTxt;

  details.innerHTML = `
    <div class="asset-detail-head">
      <div>
        <div class="asset-detail-title">${asset.name}</div>
        <div class="asset-detail-sub">${asset.location}</div>
      </div>
      <div style="text-align:right;">
        ${statusPill(asset.status)}
        <div class="muted" style="margin-top:8px; font-size:12px;">Utilization</div>
        <div style="font-weight:950; font-size:18px;">${utilPct}%</div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="detail-row">
      <span class="muted">Last used</span>
      <b>${asset.lastUsed || "—"}</b>
    </div>

    <div class="divider"></div>

    <div class="details-grid">
      ${lines || `<div class="muted">No details available.</div>`}
    </div>

    <div class="divider"></div>

    <div class="card" style="padding:12px; background: rgba(59,130,246,0.10); border:1px solid rgba(59,130,246,0.22); box-shadow:none;">
      <div style="font-weight:950; font-size:13px;">Suggested Action</div>
      <div class="muted" style="font-size:12.5px; margin-top:6px; line-height:1.6;">
        ${sugg}
      </div>
    </div>
  `;
}

function suggestedAssetAction(asset) {
  const st = String(asset.status || "").toLowerCase();
  if (st.includes("needs toner")) return "Open a Facilities ticket to replace toner. Recommend keeping backup toner stocked for this floor.";
  if (st.includes("offline")) return "Investigate connectivity / power. Recommend a quick health check and reboot if safe.";
  if (st.includes("in use")) return "Asset is currently active. Consider checking availability after the next free window.";
  if (asset.utilization >= 0.85) return "High demand. Consider adding capacity or directing users to lower-utilized nearby assets.";
  if (asset.utilization <= 0.40) return "Underutilized. Consider promoting this asset location or rebalancing capacity.";
  return "No immediate action required. Continue monitoring.";
}

function assetHealthSummary(asset) {
  const st = String(asset.status || "").toLowerCase();
  const util = (asset.utilization || 0);
  if (st.includes("offline")) return "Health degraded. Last check shows connectivity risk. Recommend network + power verification.";
  if (st.includes("toner")) return "Operational but supplies low. Replace toner to prevent queue failures.";
  if (util >= 0.85) return "Healthy but high demand. Watch for wear/overuse and ensure redundancy nearby.";
  if (util <= 0.40) return "Healthy but underused. Consider adjusting signage or booking defaults to rebalance.";
  return "Healthy. No abnormal patterns detected in recent signals.";
}

function capitalize(s) {
  return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

/* =========================
   Refresh controls (simple)
   ========================= */
function softRefresh() {
  showLoading(true);
  setTimeout(() => {
    const activeSection = $("#mainNav .side-item.active")?.dataset?.section || "productivity";

    if (activeSection === "productivity") {
      const activeView = $("#productivityTabs .subtab.active")?.dataset?.view || "assets";
      if (activeView === "assets") {
        nudgeAssets();
        renderAssetsAll();
      } else {
        setLastUpdated();
      }
    } else {
      setLastUpdated();
    }

    showLoading(false);
  }, 520);
}

function nudgeAssets() {
  // Light, realistic jitter on utilization to simulate live signals
  ASSET_DATA.forEach(a => {
    const bump = randBetween(-0.03, 0.03);
    let nu = (a.utilization || 0.6) + bump;
    nu = Math.max(0.15, Math.min(0.98, nu));
    a.utilization = nu;

    // small chance to toggle a printer toner state to feel alive (rare)
    if (a.type === "printers" && Math.random() < 0.03) {
      a.status = (String(a.status).includes("Needs Toner")) ? "Online" : "Needs Toner";
    }
    // small chance to flip zoom room offline/online (very rare)
    if (a.type === "zoom" && Math.random() < 0.02) {
      a.status = (String(a.status).includes("Offline")) ? "Online" : "Offline";
    }
  });
}

function bindRefreshControls() {
  const refreshBtn = $("#refreshBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", softRefresh);

  const timeRange = $("#timeRange");
  if (timeRange) timeRange.addEventListener("change", softRefresh);
}

/* =========================
   Init
   ========================= */
(function init() {
  const yr = $("#year");
  if (yr) yr.textContent = String(new Date().getFullYear());

  bindMainNav();
  bindProductivityTabs();
  bindRefreshControls();

  // ✅ DEFAULT: Productivity -> Assets (manager feedback)
  setActiveSection("productivity");
  setActiveProductivityView("assets", { silent: true });

  setLastUpdated();

  // Light “live” update every 15s (simple)
  setInterval(() => {
    nudgeAssets();

    const activeSection = $("#mainNav .side-item.active")?.dataset?.section || "productivity";
    if (activeSection === "productivity") {
      const activeView = $("#productivityTabs .subtab.active")?.dataset?.view || "assets";
      if (activeView === "assets") renderAssetsAll();
      else setLastUpdated();
    } else {
      setLastUpdated();
    }
  }, 15000);
})();
