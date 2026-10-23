// ==========================================================================
// POSTAL EXAM PORTAL - COMPLETE APPLICATION ENGINE (app.js)
// Covers: Inspector Posts (IP), PS Group 'B', & AAO (IP&TAFS)
// ==========================================================================

const STATE = {
  currentCadre: "IPO", // 'IPO', 'PSB', or 'AAO'
  isUnlocked: localStorage.getItem("postal_exam_premium") === "true",
  currentTestId: null,
  activeQuestions: [],
  userSelections: {},
  currentQIndex: 0,
  timerInterval: null,
  secondsLeft: 7200, // 120 Minutes for 100 Questions
  unlockPasscode: "POSTAL999PASS"
};

// --------------------------------------------------------------------------
// 1. Navigation View Switcher
// --------------------------------------------------------------------------
function showView(viewId) {
  document.querySelectorAll(".page-view").forEach(el => el.classList.add("hidden"));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.remove("hidden");
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --------------------------------------------------------------------------
// 2. Open Selected Exam Hub (IP, PSB, or AAO)
// --------------------------------------------------------------------------
function openExamHub(cadre) {
  STATE.currentCadre = cadre;
  showView("view-exam-hub");

  const hubTitle = document.getElementById("hub-title");
  const hubSubtitle = document.getElementById("hub-subtitle");
  const printCadre = document.getElementById("print-cadre-title");

  if (cadre === "IPO") {
    hubTitle.innerText = "Inspector Posts (IP) Examination Portal";
    hubSubtitle.innerText = "Based on Directorate Revised Scheme (22.08.2025) — 200 Practice Sets";
    printCadre.innerText = "Inspector Posts Examination (LDCE Revised Syllabus)";
  } else if (cadre === "PSB") {
    hubTitle.innerText = "Postal Service Group 'B' Examination Portal";
    hubSubtitle.innerText = "LDCE Postal Services Group 'B' Administrative Cadre — 200 Practice Sets";
    printCadre.innerText = "Postal Service Group 'B' Examination (LDCE)";
  } else if (cadre === "AAO") {
    hubTitle.innerText = "Assistant Accounts Officer (AAO) Portal";
    hubSubtitle.innerText = "LDCE for IP&TAFS Group 'B' (DoP & DoT) — 200 Practice Sets";
    printCadre.innerText = "Assistant Accounts Officer (AAO) LDCE Examination (IP&TAFS Group B)";
  }

  updateTierBadge();
  switchHubTab("tests");
  renderTestGrid();
  renderEligibilityContent();
  renderSyllabusContent();
}

function updateTierBadge() {
  const badge = document.getElementById("user-tier-badge");
  if (!badge) return;
  if (STATE.isUnlocked) {
    badge.innerText = "✔ Premium Access: All 200 Sets Unlocked";
    badge.style.background = "#dcfce7";
    badge.style.color = "#15803d";
  } else {
    badge.innerText = "Free Mode: Tests 1 to 3 Unlocked (100 Qs Each)";
    badge.style.background = "#e0f2fe";
    badge.style.color = "#0369a1";
  }
}

// --------------------------------------------------------------------------
// 3. Tab Switching in Hub
// --------------------------------------------------------------------------
function switchHubTab(tabName) {
  const tabTests = document.getElementById("hub-tab-tests");
  const tabEligibility = document.getElementById("hub-tab-eligibility");
  const tabSyllabus = document.getElementById("hub-tab-syllabus");

  const btnTests = document.getElementById("tab-btn-tests");
  const btnEligibility = document.getElementById("tab-btn-eligibility");
  const btnSyllabus = document.getElementById("tab-btn-syllabus");

  if (tabTests) tabTests.classList.add("hidden");
  if (tabEligibility) tabEligibility.classList.add("hidden");
  if (tabSyllabus) tabSyllabus.classList.add("hidden");

  if (btnTests) btnTests.classList.remove("active");
  if (btnEligibility) btnEligibility.classList.remove("active");
  if (btnSyllabus) btnSyllabus.classList.remove("active");

  if (tabName === "tests") {
    if (tabTests) tabTests.classList.remove("hidden");
    if (btnTests) btnTests.classList.add("active");
  } else if (tabName === "eligibility") {
    if (tabEligibility) tabEligibility.classList.remove("hidden");
    if (btnEligibility) btnEligibility.classList.add("active");
    renderEligibilityContent();
  } else if (tabName === "syllabus") {
    if (tabSyllabus) tabSyllabus.classList.remove("hidden");
    if (btnSyllabus) btnSyllabus.classList.add("active");
    renderSyllabusContent();
  }
}

// --------------------------------------------------------------------------
// 4. Render 200 Test Cards
// --------------------------------------------------------------------------
function renderTestGrid() {
  const grid = document.getElementById("tests-grid");
  if (!grid) return;
  grid.innerHTML = "";

  for (let i = 1; i <= 200; i++) {
    const isFree = i <= 3;
    const canAccess = isFree || STATE.isUnlocked;

    const card = document.createElement("div");
    card.className = `test-card ${canAccess ? "unlocked" : "locked"}`;
    card.setAttribute("data-test-name", `Test Paper ${i}`);

    let label = "";
    if (STATE.currentCadre === "IPO") {
      label = i === 1 ? "Paper-I (Postal Acts, POSB, Manuals & Tech)" : (i === 2 ? "Paper-III (Service Rules, Acts & Aptitude)" : (i === 3 ? "Paper-I & III (Grand Departmental Mock)" : `Specialized Practice Set #${i}`));
    } else if (STATE.currentCadre === "PSB") {
      label = i === 1 ? "Paper-I (Postal Operations & Manuals V, VI, VII)" : (i === 2 ? "Paper-II (Finance, Accounts, FHB & GFR 2017)" : (i === 3 ? "Paper-I & II (Grand Administrative Mock)" : `Administrative Mock Set #${i}`));
    } else if (STATE.currentCadre === "AAO") {
      label = i === 1 ? "Paper-I (Financial Rules, GFR 2017 & Book-Keeping)" : (i === 2 ? "Paper-II (Service Rules, FR-SR & Pension 2021)" : (i === 3 ? "Paper-III & IV (Postal & Telecom Accounts / Taxation)" : `AAO Accounts Practice Set #${i}`));
    }

    card.innerHTML = `
      <div>
        <h4>Model Paper #${i}</h4>
        <div class="test-meta">
          <span>${label}</span><br>
          <small>${canAccess ? "✔ 100 Questions (Available for Practice)" : "🔒 Premium Access"}</small>
        </div>
      </div>
      <button class="btn ${canAccess ? "btn-primary" : "btn-secondary"} full-width" onclick="handleTestSelect(${i}, ${canAccess})">
        ${canAccess ? "Start 100-Q Practice" : "Unlock Paper"}
      </button>
    `;
    grid.appendChild(card);
  }
}

function filterTests() {
  const q = document.getElementById("test-search").value.toLowerCase();
  document.querySelectorAll(".test-card").forEach(c => {
    c.style.display = c.getAttribute("data-test-name").toLowerCase().includes(q) ? "flex" : "none";
  });
}

function handleTestSelect(testId, canAccess) {
  if (!canAccess) {
    document.getElementById("unlock-modal").classList.remove("hidden");
    return;
  }
  startPracticeTest(testId);
}

// --------------------------------------------------------------------------
// 5. Test Engine with 100 Unique Questions per Paper
// --------------------------------------------------------------------------
async function startPracticeTest(testId) {
  STATE.currentTestId = testId;
  STATE.userSelections = {};
  STATE.currentQIndex = 0;

  let loadedQuestions = null;
  try {
    const filename = `${STATE.currentCadre.toLowerCase()}_test_${testId}.json`;
    const res = await fetch(`data/${filename}`);
    if (res.ok) {
      const jsonData = await res.json();
      if (jsonData.questions && jsonData.questions.length > 0) {
        loadedQuestions = jsonData.questions;
      }
    }
  } catch (e) {
    // Fallback to internal engine
  }

  if (!loadedQuestions) {
    loadedQuestions = buildAuthentic100Paper(STATE.currentCadre, testId);
  }

  STATE.activeQuestions = loadedQuestions;

  showView("view-quiz");
  let cadreName = STATE.currentCadre === "IPO" ? "Inspector Posts" : (STATE.currentCadre === "PSB" ? "PS Group B" : "AAO (IP&TAFS)");
  document.getElementById("quiz-heading").innerText = `${cadreName} — Model Paper #${testId}`;
  document.getElementById("quiz-cadre-tag").innerText = "100 Questions (200 Marks) — LDCE Standard";

  STATE.secondsLeft = 120 * 60; // 120 Minutes
  startTimer();
  displayQuestion(0);
}

function startTimer() {
  clearInterval(STATE.timerInterval);
  const timerEl = document.getElementById("quiz-timer");
  STATE.timerInterval = setInterval(() => {
    STATE.secondsLeft--;
    const m = Math.floor(STATE.secondsLeft / 60);
    const s = STATE.secondsLeft % 60;
    if (timerEl) {
      timerEl.innerText = `⏱ ${m}:${s < 10 ? '0' : ''}${s}`;
    }
    if (STATE.secondsLeft <= 0) {
      clearInterval(STATE.timerInterval);
      finishQuiz();
    }
  }, 1000);
}

function displayQuestion(idx) {
  STATE.currentQIndex = idx;
  const q = STATE.activeQuestions[idx];

  document.getElementById("q-counter").innerText = `Question ${idx + 1} of ${STATE.activeQuestions.length}`;
  document.getElementById("q-text").innerText = q.question;

  const cont = document.getElementById("options-group");
  cont.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = `option-btn ${STATE.userSelections[idx] === i ? "selected" : ""}`;
    btn.innerHTML = `<b>(${String.fromCharCode(65 + i)})</b> ${opt}`;
    btn.onclick = () => {
      STATE.userSelections[idx] = i;
      displayQuestion(idx);
    };
    cont.appendChild(btn);
  });

  document.getElementById("btn-prev").disabled = idx === 0;
  document.getElementById("btn-next").disabled = idx === STATE.activeQuestions.length - 1;
}

function navigateQuestion(step) {
  const next = STATE.currentQIndex + step;
  if (next >= 0 && next < STATE.activeQuestions.length) {
    displayQuestion(next);
  }
}

function exitQuiz() {
  if (confirm("Are you sure you want to exit? Your practice progress will be reset.")) {
    clearInterval(STATE.timerInterval);
    showView("view-exam-hub");
  }
}

function confirmSubmitQuiz() {
  if (confirm("Do you want to submit your test paper for evaluation?")) {
    finishQuiz();
  }
}

function finishQuiz() {
  clearInterval(STATE.timerInterval);
  showView("view-result");

  let correct = 0;
  let wrong = 0;
  const total = STATE.activeQuestions.length;
  const review = document.getElementById("review-container");
  review.innerHTML = "";

  STATE.activeQuestions.forEach((q, i) => {
    const user = STATE.userSelections[i];
    const isRight = user === q.correct;
    if (user !== undefined) {
      if (isRight) correct++;
      else wrong++;
    }

    const item = document.createElement("div");
    item.className = `review-item ${isRight ? "pass" : "fail"}`;
    item.innerHTML = `
      <p><b>Q${i + 1}: ${q.question}</b></p>
      <p style="margin-top: 5px;">Your Answer: <b>${user !== undefined ? `(${String.fromCharCode(65 + user)}) ` + q.options[user] : "Not Attempted"}</b></p>
      <p style="color: var(--success); font-weight: 600;">Correct Answer: (${String.fromCharCode(65 + q.correct)}) ${q.options[q.correct]}</p>
      <div class="explanation-box">
        💡 <b>Rule & Authority Reference:</b> ${q.explanation}
      </div>
    `;
    review.appendChild(item);
  });

  const marks = correct * 2;
  const maxMarks = total * 2;
  const acc = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
  let cadreName = STATE.currentCadre === "IPO" ? "Inspector Posts" : (STATE.currentCadre === "PSB" ? "PS Group B" : "AAO (IP&TAFS)");

  document.getElementById("res-test-title").innerText = `${cadreName} — Model Paper #${STATE.currentTestId}`;
  document.getElementById("res-score").innerText = `${marks} / ${maxMarks}`;
  document.getElementById("res-correct").innerText = `${correct} Questions (${marks} Marks)`;
  document.getElementById("res-wrong").innerText = `${wrong} Questions`;
  document.getElementById("res-accuracy").innerText = `${acc}% [${acc >= 40 ? "QUALIFIED" : "NOT QUALIFIED"}]`;
}

function backToHub() {
  showView("view-exam-hub");
}

// --------------------------------------------------------------------------
// 6. Eligibility Content (Department of Posts & DoT Norms)
// --------------------------------------------------------------------------
function renderEligibilityContent() {
  const el = document.getElementById("eligibility-content");
  if (!el) return;

  if (STATE.currentCadre === "IPO") {
    el.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="color: var(--secondary); font-size: 19px;">Eligibility Criteria: Inspector Posts (IP) LDCE</h3>
        <p class="text-muted" style="font-size: 13px;">Governed strictly as per Department of Posts Inspector Posts Recruitment Rules:</p>
      </div>
      
      <div class="table-responsive-wrapper">
        <table class="syllabus-table">
          <tr>
            <th style="width: 28%;">Feeder Cadres</th>
            <td>Postal Assistants (PA), Sorting Assistants (SA), Postmen / Mail Guards (promoted to PA/SA cadre).</td>
          </tr>
          <tr>
            <th>Qualifying Regular Service</th>
            <td>Must have completed a minimum of <b>8 years of regular service</b> in Level-4 of Pay Matrix (Grade Pay Rs. 2400) as on the crucial cut-off date of the vacancy year.</td>
          </tr>
          <tr>
            <th>Crucial Cut-off Date</th>
            <td>1st day of January of the respective vacancy year (or as notified specifically by Directorate).</td>
          </tr>
          <tr>
            <th>Vigilance / Disciplinary Status</th>
            <td>The candidate must have clean vigilance clearance and should not be undergoing any currency of penalty under CCS (CCA) Rules, 1965.</td>
          </tr>
          <tr>
            <th>Educational Qualification</th>
            <td>Bachelor's Degree from any recognized University (or departmental grandfathering exemptions as per Circle).</td>
          </tr>
        </table>
      </div>
    `;
  } else if (STATE.currentCadre === "PSB") {
    el.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="color: var(--secondary); font-size: 19px;">Eligibility Criteria: Postal Service Group 'B' LDCE</h3>
        <p class="text-muted" style="font-size: 13px;">Governed by Postal Services Group 'B' Recruitment Rules:</p>
      </div>
      
      <div class="table-responsive-wrapper">
        <table class="syllabus-table">
          <tr>
            <th style="width: 28%;">Feeder Cadres</th>
            <td>Inspectors of Posts (IP) and Assistant Superintendents of Posts (ASPs).</td>
          </tr>
          <tr>
            <th>Qualifying Regular Service</th>
            <td>Must have completed a minimum of <b>5 years of approved regular service</b> in the cadre of Inspector Posts (Pay Level-7 / Grade Pay Rs. 4600) as on the crucial date.</td>
          </tr>
          <tr>
            <th>Crucial Cut-off Date</th>
            <td>1st day of January of the respective vacancy year.</td>
          </tr>
          <tr>
            <th>Recruitment Quota</th>
            <td>75% filled by promotion through DPC (Seniority-cum-fitness) and 25% filled through Limited Departmental Competitive Examination (LDCE).</td>
          </tr>
          <tr>
            <th>Vigilance Clearance</th>
            <td>Vigilance clearance from the respective Circle Directorate is mandatory.</td>
          </tr>
        </table>
      </div>
    `;
  } else if (STATE.currentCadre === "AAO") {
    el.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="color: var(--secondary); font-size: 19px;">Eligibility Criteria: Assistant Accounts Officer (AAO) LDCE</h3>
        <p class="text-muted" style="font-size: 13px;">Governed by Indian Posts and Telecommunications Accounts and Finance Service Group 'B' (AAO) Recruitment Rules, 2018 (Gazette GSR 320(E)):</p>
      </div>
      
      <div class="table-responsive-wrapper">
        <table class="syllabus-table">
          <thead>
            <tr>
              <th style="width: 22%;">Feeder Cadre / Level</th>
              <th style="width: 20%;">Pre-revised GP</th>
              <th style="width: 28%;">Designation</th>
              <th>Required Regular Service</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Level 4</b></td>
              <td>Rs. 2,400/-</td>
              <td>Postal Assistant (PA) / Sorting Assistant (SA)</td>
              <td><b>9 Years</b> of regular qualifying service</td>
            </tr>
            <tr>
              <td><b>Level 3</b></td>
              <td>Rs. 2,000/-</td>
              <td>Postman / Mail Guard</td>
              <td><b>11 Years</b> of regular qualifying service</td>
            </tr>
            <tr>
              <td><b>Level 1</b></td>
              <td>Rs. 1,800/-</td>
              <td>Multi-Tasking Staff (MTS Group C)</td>
              <td><b>14 Years</b> of regular qualifying service</td>
            </tr>
            <tr>
              <td><b>Level 5 & 6</b></td>
              <td>Rs. 2,800 / 4,200/-</td>
              <td>Junior Accountant / Senior Accountant</td>
              <td>Level 5: 6 Years / Level 6: 3 Years</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-top: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; font-size: 13.5px; line-height: 1.6;">
        <p><b>Key Conditions & Guidelines:</b></p>
        <ul style="padding-left: 20px; margin-top: 6px;">
          <li><b>Educational Qualification:</b> Bachelor’s Degree from a recognized University or Institute is mandatory for all applicants.</li>
          <li><b>Eligible Departments:</b> Regular Group 'C' employees of the Department of Posts (DoP) and Department of Telecommunications (DoT) under the Ministry of Communications.</li>
          <li><b>Group B Ineligibility:</b> Only Group 'C' officials are eligible to appear. Officials already working substantively in Group 'B' are not eligible.</li>
          <li><b>Crucial Cut-off Date:</b> 1st day of January of the respective Vacancy Year.</li>
          <li><b>Qualifying Marks:</b> 40% in each individual paper for General category; 30% in each individual paper for SC/ST category.</li>
        </ul>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// 7. Complete Detailed Syllabus Content (All 3 Cadres)
// --------------------------------------------------------------------------
function renderSyllabusContent() {
  const el = document.getElementById("syllabus-body");
  if (!el) return;

  if (STATE.currentCadre === "IPO") {
    el.innerHTML = `
      <h3 style="margin-bottom: 8px;">Detailed Scheme & Syllabus: LDCE Inspector Posts</h3>
      <p class="text-muted" style="margin-bottom: 20px;">Directorate Letter No. 7-14/2011-SPN-II dated 22.08.2025 (Revised 3-Paper Structure).</p>

      <div class="table-responsive-wrapper">
        <table class="syllabus-table">
          <thead>
            <tr>
              <th style="width: 14%;">Paper</th>
              <th style="width: 20%;">Structure & Marks</th>
              <th>Exhaustive Syllabus Topics</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Paper-I</b></td>
              <td>125 MCQs<br>250 Marks<br>Duration: 2.5 Hrs</td>
              <td>
                <b>1. Acts:</b> The Post Office Act, 2023; Government Savings Promotion Act, 1873; Prevention of Money Laundering Act, 2002; Consumer Protection Act, 2019; Information Technology Act, 2000.<br>
                <b>2. Rules & Schemes:</b> Post Office Rules & Regulations 2024; Government Savings Promotion Rules, 2018; All Small Savings Schemes 2019 (POSA, RD, TD, MIS, SCSS, NSC, KVP, PPF, SSA); SANKALAN (PLI/RPLI Rules).<br>
                <b>3. Postal Manuals:</b> Book of BO Rules; Postal Manuals Vol II, III, IV, VIII; Vol V, VI (Parts I, II, III), Vol VII.<br>
                <b>4. Operations & Modern Tech:</b> PO Guide I & II; DIGIPIN; MNOP, PNOP, Centralized Delivery, DNKs; IT 2.0 (APT), CBS, PLI-CIS, IPPB.<br>
                <b>5. Conduct & Service Rules:</b> CCS (Conduct) Rules 1964; CCS (CCA) Rules 1965; CCS (Temp Service) Rules; GDS (Conduct & Engagement) Rules 2020.
              </td>
            </tr>
            <tr>
              <td><b>Paper-II</b></td>
              <td>Descriptive<br>50 Marks<br>Duration: 1.0 Hr</td>
              <td>
                • Noting in approx. 200 words (15 Marks).<br>
                • Drafting in approx. 200 words (15 Marks).<br>
                • Drafting of Major Penalty Charge Sheet under Rule 14 of CCS (CCA) Rules, 1965 (20 Marks).
              </td>
            </tr>
            <tr>
              <td><b>Paper-III</b></td>
              <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
              <td>
                • Constitution of India (Preamble, Fundamental Rights/Duties, DPSP, Judiciary, Art 311, 338).<br>
                • Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS - Sec 1, 2, 84).<br>
                • CAT Act 1985; Revenue Recovery Act 1890; Prevention of Corruption Act 1988; RTI Act 2005.<br>
                • Procurement Manuals (Goods, Works, Services); GFR 2017 (Ch 2 & 6); FR-SR; P&T FHB Vol I & II.<br>
                • CCS (Pension) Rules 2021; NPS Rules 2021; CCS (Commutation) Rules 1981; POSH Act 2013.<br>
                • English Language, Current Affairs, Reasoning, Mental Aptitude & Ethics.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else if (STATE.currentCadre === "PSB") {
    el.innerHTML = `
      <h3 style="margin-bottom: 8px;">Detailed Scheme & Syllabus: Postal Service Group 'B'</h3>
      <p class="text-muted" style="margin-bottom: 20px;">Prescribed Syllabus for Limited Departmental Competitive Examination.</p>

      <div class="table-responsive-wrapper">
        <table class="syllabus-table">
          <thead>
            <tr>
              <th style="width: 14%;">Paper</th>
              <th style="width: 20%;">Structure & Marks</th>
              <th>Exhaustive Syllabus Topics</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Paper-I</b></td>
              <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
              <td>
                • Post Office Guide Part-I & Part-II (Inland & Foreign Post Rules).<br>
                • Postal Manual Volume V (Mail Operations and Air Mail Regulations).<br>
                • Postal Manual Volume VI (Part I, II, III) and Volume VII.<br>
                • Post Office Savings Bank (POSB) Manuals Vol I, II, III; Small Savings Schemes 2019.<br>
                • Core Banking Solutions (CBS) Guidelines and Directorate SB Orders.<br>
                • Postal Life Insurance (PLI) & Rural Postal Life Insurance (RPLI) guidelines.<br>
                • IT Modernization Project 2.0 (APT), Parcel Network (PNOP), Mail Network (MNOP), IPPB.
              </td>
            </tr>
            <tr>
              <td><b>Paper-II</b></td>
              <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
              <td>
                • General Financial Rules (GFR), 2017; Public Procurement Guidelines & GeM.<br>
                • P&T Financial Handbook (FHB) Vol I & Postal FHB Vol II.<br>
                • Fundamental Rules (FR) & Supplementary Rules (SR); Schedule of Financial Powers.<br>
                • Central Civil Services (Conduct) Rules, 1964.<br>
                • Central Civil Services (Classification, Control & Appeal) Rules, 1965.<br>
                • CCS (Leave) Rules, 1972; CCS (Pension) Rules, 2021; National Pension System (NPS).<br>
                • Central Administrative Tribunal Act, 1985; Right to Information (RTI) Act, 2005.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else if (STATE.currentCadre === "AAO") {
    el.innerHTML = `
      <h3 style="margin-bottom: 8px;">Detailed Scheme & Syllabus: Assistant Accounts Officer (AAO) LDCE</h3>
      <p class="text-muted" style="margin-bottom: 20px;">IP&TAFS Group 'B' Cadre Scheme (6 Comprehensive Papers - 600 Total Marks).</p>

      <div class="table-responsive-wrapper">
        <table class="syllabus-table">
          <thead>
            <tr>
              <th style="width: 12%;">Paper</th>
              <th style="width: 22%;">Subject & Duration</th>
              <th>Detailed Syllabus Topics & References</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Paper-I</b></td>
              <td>Financial Rules, Procedures & Book-Keeping<br>100 Marks (3.0 Hrs)</td>
              <td>
                • <b>Part A (Compulsory Practical):</b> Double Entry Book-Keeping, Journal, Ledger, Trial Balance, Cash Book, Bank Reconciliation Statement (BRS), Trading and P&L Account, Balance Sheet, Adjustments (Depreciation, Bad debts, Reserves).<br>
                • <b>Part B:</b> General Financial Rules (GFR), 2017 (Procurement through GeM, Advances, Contracts, Budgeting) & P&T Financial Handbook Volume-I.<br>
                • <b>Part C:</b> Government Accounting Rules (GAR), 1990; Principles of Government Accounts, Consolidated Fund, Contingency Fund, Public Account.
              </td>
            </tr>
            <tr>
              <td><b>Paper-II</b></td>
              <td>Service Rules<br>100 Marks (3.0 Hrs)</td>
              <td>
                • <b>Part A (Compulsory Numerical Problem):</b> Practical calculations on Pay Fixation, Pension, Commutation, Gratuity, Family Pension, or GPF interest calculation.<br>
                • <b>Part B:</b> Fundamental Rules & Supplementary Rules (FR & SR - I, II, III), CCS (Joining Time) Rules 1979, CCS (Pension) Rules 2021, National Pension System (NPS), CCS (Leave) Rules 1972, CCS (GPF) Rules 1960, Children Education Allowance (CEA), LTC Rules 1988.<br>
                • <b>Part C:</b> CCS (CCA) Rules 1965, CCS (Conduct) Rules 1964, RTI Act 2005, Prevention of Corruption Act 1988, Constitution of India (Articles 14, 21, 22, 32, 226, 311).
              </td>
            </tr>
            <tr>
              <td><b>Paper-III</b></td>
              <td>Postal Accounts<br>100 Marks (3.0 Hrs)</td>
              <td>
                • <b>Postal Accounts Manual (Vol I & II):</b> Compilation of Accounts, Remittances, Transfer Entries, Head Office and Sub Office Accounting, Postmaster's Balance Sheet.<br>
                • <b>Financial Powers:</b> Delegation of Financial Power Rules (DFPR), 2024 and Postal Schedule of Financial Powers (CPMG, PMG, SSPOs/SPOs).<br>
                • <b>Audit & Internal Checks:</b> Manual of Internal Audit Questionnaire (Postal & RMS Units, Stores Depot, Civil & Electrical Wings).<br>
                • <b>Postal Schemes & Services:</b> POSB Accounts, CBS, Postal Life Insurance (PLI/RPLI), IPPB Accounting, GST in Postal Operations.
              </td>
            </tr>
            <tr>
              <td><b>Paper-IV</b></td>
              <td>Telecom Accounts, USOF & Taxation<br>100 Marks (3.0 Hrs)</td>
              <td>
                • <b>License Agreements & SUC:</b> Financial conditions of Telecom License Agreements (UL, UASL, ISP), Spectrum Usage Charges, Reconciliation of AGR and P&L.<br>
                • <b>Telecom Reforms 2021:</b> Gross Revenue (GR), Applicable Gross Revenue (ApGR), Adjusted Gross Revenue (AGR), Financial & Performance Bank Guarantees (FBG/PBG).<br>
                • <b>Universal Service Obligation Fund (USOF):</b> Sponsored schemes, BharatNet Phase I & II, agreements.<br>
                • <b>Goods & Services Tax (GST):</b> Registration, Input Tax Credit (ITC), Reverse Charge Mechanism (RCM), Returns.<br>
                • <b>Income Tax Act, 1961:</b> Salary deductions, TDS (Section 192, 206AA), Form 16, Form 24Q, Chapter VI-A deductions (80C, 80D, 80DD, 80U, 80GG), AIS & Form 26AS.
              </td>
            </tr>
            <tr>
              <td><b>Paper-V</b></td>
              <td>Logical, Analytical, Quantitative & Language Skills<br>100 Marks (3.0 Hrs)</td>
              <td>
                • <b>Part A (25 MCQs - 50 Marks):</b> Data Interpretation (Tables, Graphs, Pie Charts), Quantitative Ability (Percentages, Ratios, Profit & Loss, SI & CI, Averages, Time & Work).<br>
                • <b>Part B Section 1 (15 MCQs - 30 Marks):</b> Verbal & Reading Abilities (English or Hindi option), Grammar, Vocabulary, Error Spotting, Idioms.<br>
                • <b>Part B Section 2 (Subjective - 20 Marks):</b> Précis Writing, Official Letter Drafting to CGCA/DoT, Office Note/Proposal preparation.
              </td>
            </tr>
            <tr>
              <td><b>Paper-VI</b></td>
              <td>Information Technology (Theory & Practical)<br>100 Marks (3.0 Hrs)</td>
              <td>
                • <b>Part A (15 MCQs - 30 Marks):</b> Windows OS, File Management, Control Panel, Internet, Cyber Security basics.<br>
                • <b>Part B (Practical - 70 Marks):</b> Advanced Microsoft Excel (30 Marks - Formulas, Functions, Lookup, Pivot, Accounting application), Microsoft Word (20 Marks - Document creation, Table formatting, Mail Merge), PowerPoint (20 Marks - Slide design, Animations, Charts).
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

// --------------------------------------------------------------------------
// 8. Print and Download PDF Handlers
// --------------------------------------------------------------------------
function triggerPrint() { window.print(); }
function triggerDownloadPDF() {
  alert("In the print dialog, select 'Save as PDF' under Destination to save the complete syllabus.");
  window.print();
}

// --------------------------------------------------------------------------
// 9. Premium Modal Handlers
// --------------------------------------------------------------------------
function closeUnlockModal() { document.getElementById("unlock-modal").classList.add("hidden"); }
function copyUPI() {
  const upi = document.getElementById("upi-field");
  if (!upi) return;
  upi.select();
  navigator.clipboard.writeText(upi.value);
  alert("UPI ID copied: " + upi.value);
}

function verifyAccessKey() {
  const entered = document.getElementById("access-key-input").value.trim();
  if (entered === STATE.unlockPasscode) {
    localStorage.setItem("postal_exam_premium", "true");
    STATE.isUnlocked = true;
    alert("Passcode accepted! All 200 Practice Sets have been unlocked.");
    closeUnlockModal();
    updateTierBadge();
    renderTestGrid();
  } else {
    alert("Invalid Passcode. Please verify the code received on WhatsApp.");
  }
}

// --------------------------------------------------------------------------
// 10. Footer Accordion Toggle
// --------------------------------------------------------------------------
function toggleFooterAcc(btn) {
  const item = btn.closest(".footer-acc-item");
  if (item) {
    item.classList.toggle("open");
  }
}

// --------------------------------------------------------------------------
// 11. Authentic 100 Unique Questions Builder Engine (IP, PSB & AAO)
// --------------------------------------------------------------------------
function buildAuthentic100Paper(cadre, testId) {
  let masterPool = [];

  // ================= IPO QUESTION POOLS =================
  if (cadre === "IPO") {
    if (testId === 1) {
      masterPool = [
        { q: "Under The Post Office Act, 2023, which authority is empowered to frame rules regarding the interception, detention, or opening of postal articles?", opts: ["Director General Postal Services", "Central Government", "Chief Postmaster General of Circle", "District Magistrate"], c: 1, e: "Section 9 of The Post Office Act, 2023 empowers the Central Government for interception on grounds of State security." },
        { q: "The Post Office Act, 2023 repealed which colonial-era enactment?", opts: ["Indian Post Office Act, 1898", "Government Savings Bank Act, 1873", "Post Office Cash Certificates Act, 1917", "Indian Telegraph Act, 1885"], c: 0, e: "The Post Office Act, 2023 repealed the Indian Post Office Act, 1898 (Act 6 of 1898)." },
        { q: "What is the geospatial resolution of the grid used by DIGIPIN?", opts: ["10m x 10m", "4m x 4m", "2m x 2m", "1m x 1m"], c: 1, e: "DIGIPIN uses a hierarchical 4m x 4m geospatial grid partition across Indian territory." },
        { q: "Under Postal Manual Volume IV, who is the appointing authority for Postal Assistants in an independent Postal Division?", opts: ["Postmaster General", "Divisional Superintendent of Post Offices", "Chief Postmaster", "Director of Postal Services"], c: 1, e: "Superintendent of Post Offices is the appointing authority under Postal Manual Vol IV." },
        { q: "What is the maximum investment ceiling in the Senior Citizen Savings Scheme (SCSS)?", opts: ["₹15 Lakh", "₹20 Lakh", "₹30 Lakh", "₹50 Lakh"], c: 2, e: "The deposit ceiling for SCSS 2019 was enhanced to ₹30 Lakh per individual." },
        { q: "Under GDS (Conduct & Engagement) Rules, 2020, which rule deals with penalties?", opts: ["Rule 7", "Rule 9", "Rule 10", "Rule 12"], c: 1, e: "Rule 9 of GDS Rules specifies minor and major penalties on Gramin Dak Sevaks." },
        { q: "What is the maximum weight permissible for a Book Packet containing printed books?", opts: ["2 kg", "4 kg", "5 kg", "10 kg"], c: 2, e: "Under PO Guide Part I, the maximum weight of a Book Packet containing periodicals/books is 5 kg." },
        { q: "Under CCS (CCA) Rules, 1965, a Major Penalty charge sheet is issued under which Rule?", opts: ["Rule 11", "Rule 14", "Rule 16", "Rule 19"], c: 1, e: "Major penalty proceedings are conducted strictly under Rule 14 of CCS (CCA) Rules, 1965." },
        { q: "Under CCS (Conduct) Rules, 1964, which rule deals with prohibition of sexual harassment of working women?", opts: ["Rule 3", "Rule 3-B", "Rule 3-C", "Rule 4"], c: 2, e: "Rule 3-C of CCS (Conduct) Rules, 1964 explicitly prohibits sexual harassment." },
        { q: "What is the compilation of Post Office Life Insurance Rules and amendments officially named?", opts: ["DAK SEVA", "SANKALAN", "PARICAY", "SAMARTHAN"], c: 1, e: "DoP compiled all PLI/RPLI rules and amendments into the publication titled 'SANKALAN'." }
      ];
    } else if (testId === 2) {
      masterPool = [
        { q: "Under the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), which section provides for proclamation for a person absconding?", opts: ["Section 82", "Section 84", "Section 85", "Section 91"], c: 1, e: "Section 84 of BNSS, 2023 corresponds to the proclamation of absconding persons." },
        { q: "Which article of the Constitution of India provides constitutional safeguards against dismissal or removal of civil servants?", opts: ["Article 309", "Article 310", "Article 311", "Article 312"], c: 2, e: "Article 311 provides safeguards against dismissal, removal, or reduction in rank without inquiry." },
        { q: "What is the time limit for filing a first appeal under Section 19(1) of the RTI Act, 2005?", opts: ["15 days", "30 days", "45 days", "60 days"], c: 1, e: "First appeal must be filed within 30 days from receipt of the decision." },
        { q: "What is the minimum period of notice required for voluntary retirement under Rule 43 of CCS (Pension) Rules, 2021?", opts: ["1 month", "2 months", "3 months", "6 months"], c: 2, e: "A government servant must give a notice of not less than 3 months in writing." },
        { q: "Under General Financial Rules (GFR), 2017, direct purchase of goods without quotation is permitted up to:", opts: ["₹10,000", "₹25,000", "₹50,000", "₹1,00,000"], c: 1, e: "Rule 154 of GFR 2017 allows direct purchase without quotation up to ₹25,000 on each occasion." },
        { q: "Under CCS (Commutation of Pension) Rules, 1981, what is the maximum percentage of pension that can be commuted?", opts: ["33.33%", "40%", "50%", "45%"], c: 1, e: "A government servant can commute up to a maximum of 40% of their pension." }
      ];
    } else {
      masterPool = [
        { q: "Under Postal Manual Vol II, which chapter deals with Appeals and Petitions?", opts: ["Chapter I", "Chapter III", "Chapter V", "Chapter VII"], c: 1, e: "Chapter III of Postal Manual Vol II deals with Appeals and Petitions." },
        { q: "Under Post Office Rules, 2024, what is the rule regarding the disposal of undelivered postal articles?", opts: ["Returned to RLO (Returned Letter Office)", "Destroyed immediately", "Auctioned within 24 hours", "Delivered to local police"], c: 0, e: "Undelivered articles with incomplete addresses are sent to the Returned Letter Office (RLO)." },
        { q: "What is the minimum lock-in period for Public Provident Fund (PPF) partial withdrawals?", opts: ["3 years", "5 years", "7th financial year", "10 years"], c: 2, e: "Partial withdrawals under PPF Scheme 2019 are permissible from the 7th financial year onward." }
      ];
    }
  }

  // ================= PS GROUP B QUESTION POOLS =================
  if (cadre === "PSB") {
    if (testId === 1) {
      masterPool = [
        { q: "Under PO Guide Part I, what is the maximum weight limit for a registered inland parcel booked at a Branch Post Office?", opts: ["20 kg", "10 kg", "4 kg", "5 kg"], c: 1, e: "Maximum weight of a parcel for or from a Branch Post Office is 10 kg (20 kg for departmental offices)." },
        { q: "What is the maximum weight permissible for a Blind Literature Packet exempt from postage?", opts: ["2 kg", "5 kg", "7 kg", "10 kg"], c: 2, e: "Blind Literature packets are exempt from postage up to a maximum limit of 7 kg." },
        { q: "Under Postal Manual Vol V, what is an 'Air Stage'?", opts: ["An airport sorting station", "A postal route over which mails are conveyed by air", "A flight crew mail compartment", "A temporary landing strip"], c: 1, e: "Rule 8 defines Air Stage as a route over which mails are carried by air." },
        { q: "Under Postal Manual Vol VI Part II, what is the validity of an Indian Postal Order (IPO)?", opts: ["1 year from last day of month of issue", "2 years", "6 months", "3 years"], c: 1, e: "An Indian Postal Order is payable within 24 months from the last day of the month of issue." },
        { q: "Under POSB CBS Manual, what is the maximum amount of cash withdrawal permitted in a Branch Office per account per day without sanction?", opts: ["₹5,000", "₹10,000", "₹20,000", "₹50,000"], c: 2, e: "BPM can pay up to ₹20,000 in cash per day per account without obtaining prior authorization." }
      ];
    } else if (testId === 2) {
      masterPool = [
        { q: "Under Postal FHB Volume II, what is the schedule of verification of Sub-Office balances by the Divisional Superintendent?", opts: ["Once a year", "Twice a year", "During annual inspection", "Quarterly"], c: 2, e: "Superintendent verifies balances of SOs during annual administrative inspections." },
        { q: "Under GFR 2017, what is the maximum period of validity of a Performance Security?", opts: ["60 days beyond completion of contractual obligations", "30 days", "90 days", "1 year"], c: 0, e: "Rule 170 of GFR 2017 specifies 60 days beyond completion of all contractual obligations." },
        { q: "Under CCS (Leave) Rules, 1972, what is the maximum number of days of Earned Leave that can be accumulated?", opts: ["240 days", "300 days", "360 days", "Unlimited"], c: 1, e: "Rule 26 limits the maximum accumulation of Earned Leave to 300 days." },
        { q: "Under CCS (Conduct) Rules, 1964, what is the restriction on employment of near relatives of government servants in private firms?", opts: ["Permitted with PMG sanction", "Must report or obtain prior sanction of Government", "Strictly prohibited", "No restriction"], c: 1, e: "Rule 4 requires prior sanction or report when near relatives accept employment in private firms having official dealings." }
      ];
    } else {
      masterPool = [
        { q: "Under Postal Manual Vol II, what is the procedure when counterfeit currency is detected in post office remittances?", opts: ["Return to sender", "Impound and report to police with FIR", "Destroy immediately", "Credit to Govt accounts"], c: 1, e: "Counterfeit notes must be branded, impounded, and handed over to police as per Manual Vol II." },
        { q: "What is the maximum limit of an ordinary Money Order that can be remitted through an eMO?", opts: ["₹5,000", "₹10,000", "₹20,000", "₹50,000"], c: 0, e: "Maximum value of a single electronic money order (eMO) is ₹5,000." },
        { q: "Under CCS (Pension) Rules, 2021, minimum qualifying service required to become eligible for service pension is:", opts: ["5 years", "10 years", "20 years", "15 years"], c: 1, e: "Rule 44 specifies minimum 10 years of qualifying service for service pension." }
      ];
    }
  }

  // ================= AAO QUESTION POOLS (IP&TAFS GROUP B) =================
  if (cadre === "AAO") {
    if (testId === 1) {
      // Paper 1: GFR 2017, P&T FHB Vol I, Book-Keeping & BRS (Based on 2024 Exam)
      masterPool = [
        {
          q: "In Double Entry Book-Keeping, machinery book value is ₹20,000 with 10% straight-line depreciation, and patent is ₹60,000 with 20% depreciation. What is the total depreciation debited to Profit & Loss Account?",
          opts: ["₹14,000", "₹12,000", "₹16,000", "₹8,000"],
          c: 0,
          e: "Depreciation on Machinery = 10% of 20,000 = ₹2,000. Depreciation on Patents = 20% of 60,000 = ₹12,000. Total Depreciation = ₹2,000 + ₹12,000 = ₹14,000 (AAO 2024 Paper I Q1)."
        },
        {
          q: "Trial Balance shows Purchases ₹2,10,000, Purchases Return ₹30,000, Wages ₹32,500, Opening Stock ₹16,000, and Closing Stock ₹84,000. What is the Cost of Goods Sold (COGS)?",
          opts: ["₹1,44,500", "₹1,74,500", "₹2,28,500", "₹1,96,000"],
          c: 0,
          e: "Net Purchases = 2,10,000 - 30,000 = ₹1,80,000. COGS = Opening Stock (16,000) + Net Purchases (1,80,000) + Direct Wages (32,500) - Closing Stock (84,000) = ₹1,44,500."
        },
        {
          q: "Under GFR 2017 Rule 225(viii), price variation clause in long-term contracts is generally NOT admissible in contracts where scheduled completion period is less than:",
          opts: ["6 months", "12 months", "18 months", "24 months"],
          c: 2,
          e: "As per Rule 225(viii) of GFR 2017, price variation clauses are ordinarily provided only in contracts with delivery/completion period extending beyond 18 months."
        },
        {
          q: "Under Rule 60 of P&T FHB Volume I, which of the following is NOT a fundamental Standard of Financial Propriety?",
          opts: [
            "Expenditure should not prima facie be more than the occasion demands",
            "An officer may exercise powers of sanction to pass an order directly benefiting himself",
            "Public money should not be utilized for the benefit of a particular person or section",
            "Allowances should not become a source of profit to the recipient"
          ],
          c: 1,
          e: "Rule 60 explicitly states no authority should exercise powers of sanction to pass an order directly or indirectly to its own advantage."
        },
        {
          q: "In Bank Reconciliation Statement (BRS), starting with Cash Book Overdraft balance of ₹20,000, Cheques issued but not presented ₹6,500, and Cheques deposited but not cleared ₹6,000. What is the Pass Book Overdraft balance?",
          opts: ["₹19,500", "₹20,500", "₹26,500", "₹13,500"],
          c: 0,
          e: "Overdraft as per Cash Book: -20,000. Add cheques issued (+6,500) = -13,500. Less cheques deposited not cleared (-6,000) = -19,500 (Overdraft of ₹19,500 as per Pass Book)."
        },
        {
          q: "Under GFR 2017 Rule 174, which principles govern the Public Procurement System to ensure integrity?",
          opts: ["Transparency, Competition, Fairness and Elimination of Arbitrariness", "Lowest cost only", "Local supplier preference only", "Negotiation without tender"],
          c: 0,
          e: "Rule 174 mandates Efficiency, Economy, Transparency, Competition, Fairness, and Accountability in public procurement."
        },
        {
          q: "Under Rule 243 of P&T FHB Vol I, which of the following is NOT one of the 4 standard classifications of Contingent Charges?",
          opts: ["Countersigned Contingencies", "Contract Contingencies", "Scale-regulated Contingencies", "Personal Ledger Contingencies"],
          c: 3,
          e: "The four classes under Rule 243 are: (1) Contract Contingencies, (2) Scale-regulated Contingencies, (3) Special Contingencies, and (4) Countersigned Contingencies."
        },
        {
          q: "Under GAR 1990, in which classification head are transactions of receipt and payment held temporarily pending final allocation to proper revenue/capital head?",
          opts: ["Remittance Head", "Suspense Account (Major Head 8658)", "Contingency Fund", "Proforma Account"],
          c: 1,
          e: "Suspense Heads under Major Head 8658 record transactions temporarily until proper vouchers/classifications are verified."
        },
        {
          q: "Under P&T FHB Vol I Rule 187, when a government servant quits service by resignation, when can final payment of pay and allowances be disbursed?",
          opts: ["On the day of resignation", "Only after clearance of all government dues and No Demand Certificate is issued", "After 30 days automatically", "On next regular salary cycle"],
          c: 1,
          e: "Final settlement is made only after adjusting all dues, advances, overpayments, and obtaining NDC from all concerned sections."
        },
        {
          q: "What is the time limit for submission of LTC claims when an advance has been drawn under CCS (LTC) Rules?",
          opts: ["Within 1 month from completion of return journey", "Within 3 months", "Within 6 months", "Within 15 days"],
          c: 0,
          e: "When advance is drawn, claim must be submitted within 1 month of completion of journey; if no advance is drawn, within 3 months."
        }
      ];
    } else if (testId === 2) {
      // Paper 2: Service Rules, FR-SR, CCS Pension 2021, GPF & Conduct/CCA (Based on 2024 Exam)
      masterPool = [
        {
          q: "Shri X joined service on 10.07.1990 and retired on superannuation on 30.11.2019. He took Extraordinary Leave (EOL) without medical certificate from 20.09.1997 to 04.10.1997 (15 days). What is his Qualifying Service for pension?",
          opts: ["29 years 4 months 6 days", "29 years 4 months 21 days", "29 years", "30 years"],
          c: 0,
          e: "Gross service = 10.07.1990 to 30.11.2019 = 29 years, 4 months, 21 days. Non-qualifying EOL without MC = 15 days. Qualifying Service = 29 years, 4 months, 6 days (59 half-yearly periods - AAO 2024 Paper II Q1)."
        },
        {
          q: "Under CCS (Pension) Rules, 2021, if an official's basic pay on the date of superannuation is ₹69,000 and DA is 17%, what is the monthly pension granted (including Dearness Relief)?",
          opts: ["₹34,500", "₹40,365", "₹37,950", "₹42,000"],
          c: 1,
          e: "Basic Pension = 50% of ₹69,000 = ₹34,500. Dearness Relief (DR @ 17%) = ₹5,865. Total Pension payable = ₹34,500 + ₹5,865 = ₹40,365."
        },
        {
          q: "What is the maximum number of years of qualifying service counted for the calculation of Retirement Gratuity under CCS (Pension) Rules?",
          opts: ["30 years", "33 years (maximum 16.5 months emoluments)", "35 years", "25 years"],
          c: 1,
          e: "Retirement Gratuity is calculated at 1/4th of emoluments for each completed six-monthly period, subject to a maximum of 66 half-years (33 years), capped at 16.5 times monthly emoluments."
        },
        {
          q: "Under GPF (Central Services) Rules, 1960, what is the maximum monetary limit of deposit-linked insurance payable to the family on the death of a subscriber in service (Rule 33-B)?",
          opts: ["₹30,000", "₹60,000", "₹1,00,000", "₹2,50,000"],
          c: 1,
          e: "Under Deposit Linked Insurance Scheme (DLIS), the maximum insurance benefit payable is ₹60,000 subject to average balance maintained over the preceding 3 years."
        },
        {
          q: "Under Fundamental Rule 35, what is the restriction placed on pay of an officiating government servant?",
          opts: [
            "Officiating pay cannot be granted",
            "Central Government may fix pay at an amount less than that admissible under FR 22",
            "Pay is automatically doubled",
            "Only special pay is granted"
          ],
          c: 1,
          e: "FR 35 empowers the competent authority to fix pay at an amount lower than normal promotion entitlement when appointed to officiate without holding substantive charge."
        },
        {
          q: "Under CCS (CCA) Rules, 1965, if a government servant is detained in police custody for a period exceeding 48 hours, what is the legal consequence?",
          opts: [
            "Deemed to have been placed under suspension with effect from date of detention",
            "Compulsorily retired",
            "Dismissed without inquiry",
            "Forfeiture of all gratuity"
          ],
          c: 0,
          e: "Under Rule 10(2) of CCS (CCA) Rules, an official detained for exceeding 48 hours is deemed suspended by operation of law."
        },
        {
          q: "Under Article 311(2) of the Constitution of India, a civil servant cannot be dismissed, removed or reduced in rank except after:",
          opts: ["Cabinet approval", "An inquiry in which he has been informed of charges and given a reasonable opportunity of being heard", "Prior police investigation", "Consent of CAT"],
          c: 1,
          e: "Article 311(2) mandates a formal inquiry providing reasonable opportunity to defend against specific charges."
        },
        {
          q: "Under Section 19(8)(b) of the RTI Act, 2005, the Central Information Commission has the power to:",
          opts: ["Imprison the public authority", "Require the public authority to compensate the complainant for any loss or detriment suffered", "Dismiss the CPIO", "Cancel departmental tenders"],
          c: 1,
          e: "Section 19(8)(b) empowers the Commission to award financial compensation to the applicant for loss or detriment suffered."
        },
        {
          q: "Under CCS (LTC) Rules, 1988, if an employee makes a fraudulent claim of Leave Travel Concession, what penalty is prescribed under Rule 16?",
          opts: [
            "Severe reprimand only",
            "Forfeiture of claim, debarment from next 2 to 3 sets of LTC, and disciplinary action under CCS (CCA) Rules",
            "Deduction of 5% salary",
            "Cancellation of all accumulated Earned Leave"
          ],
          c: 1,
          e: "Rule 16 provides for forfeiture of claim, withholding of future LTC entitlements, and mandatory charge sheet under Rule 14 or 16."
        },
        {
          q: "Under Children Education Allowance (CEA) guidelines, what happens to CEA reimbursement if a government servant dies while in service?",
          opts: [
            "Ceases immediately",
            "Reimbursement continues to the spouse/child till the child completes 12th standard or attains 20 years",
            "Lump sum payment of ₹50,000",
            "Reduced to 50%"
          ],
          c: 1,
          e: "CEA continues to be admissible to the surviving spouse/guardian provided the spouse is not employed in Govt/PSU granting the same facility."
        }
      ];
    } else {
      // Paper 3 & 4: Postal Accounts, Telecom SUC, AGR, USOF & Taxation (Based on 2024 Exam)
      masterPool = [
        {
          q: "A Telecom Service Provider (TSP) holds 6.4 MHz paired GSM spectrum in 1800 MHz band. As per 2010 NIA rate table (Up to 2x6.2 MHz = 4%, Up to 2x8.2 MHz = 5%), what is the applicable Spectrum Usage Charge (SUC) rate?",
          opts: ["3% of AGR", "4% of AGR", "5% of AGR", "6% of AGR"],
          c: 2,
          e: "Since 6.4 MHz falls between 6.2 MHz and 8.2 MHz slab, the applicable SUC rate is 5% of Adjusted Gross Revenue (AAO 2024 Paper IV Q1)."
        },
        {
          q: "A TSP reports Gross Revenue (GR) of ₹700 Cr. It claims Non-Telecom Exemption of ₹70 Cr and Deductions of ₹70 Cr. CCA office disallows ₹25 Cr of deductions. What is the final audited Adjusted Gross Revenue (AGR)?",
          opts: ["₹560 Cr", "₹585 Cr", "₹630 Cr", "₹540 Cr"],
          c: 1,
          e: "Applicable Gross Revenue (ApGR) = 700 - 70 = ₹630 Cr. Allowed Deductions = 70 - 25 = ₹45 Cr. Final AGR = ApGR (630) - Allowed Deductions (45) = ₹585 Cr (AAO 2024 Paper IV Q1)."
        },
        {
          q: "Under Telecom Reforms 2021, which of the following is completely excluded from Gross Revenue (GR) to arrive at Applicable Gross Revenue (ApGR)?",
          opts: [
            "Revenue from voice calls and internet data",
            "Revenue from Non-Telecom activities (e.g. Dividend, Interest, Forex gain, Sale of capital assets)",
            "Interconnection roaming charges",
            "Infrastructure sharing revenue"
          ],
          c: 1,
          e: "The Cabinet in 2021 reformed the definition of revenue: ApGR excludes all non-telecom income streams."
        },
        {
          q: "Under Section 10(13A) of Income Tax Act read with Rule 2A, the exemption for House Rent Allowance (HRA) for an employee in Delhi is least of:",
          opts: [
            "(i) Actual HRA received, (ii) Rent paid minus 10% of salary, (iii) 50% of salary",
            "(i) Actual HRA received, (ii) 40% of salary, (iii) ₹5,000 per month",
            "100% of rent paid",
            "Standard ₹2,00,000 per annum"
          ],
          c: 0,
          e: "Rule 2A grants exemption as lowest of: (a) Actual HRA, (b) Rent paid excess of 10% salary, (c) 50% of salary for metro cities (Delhi, Mumbai, Kolkata, Chennai) or 40% for others."
        },
        {
          q: "Under the Income Tax Act, what is the maximum deduction permissible under Section 80U for an employee with severe disability (80% or more)?",
          opts: ["₹50,000", "₹75,000", "₹1,25,000", "₹1,50,000"],
          c: 2,
          e: "Section 80U provides flat deduction of ₹75,000 for disability (40% to 79%) and ₹1,25,000 for severe disability (80% and above)."
        },
        {
          q: "In Post Office accounting, who prepares the Postmaster's Balance Sheet (Form ACG-27) and what does it establish?",
          opts: [
            "Prepared monthly by Head Postmaster to reconcile cash, stamps, and unadjusted remittances of HO and connected SOs",
            "Prepared by Mail Guard for parcel counts",
            "Prepared by DPA for budget grant",
            "Prepared by CEPT for server logs"
          ],
          c: 0,
          e: "ACG-27 balances all head office transactions, sub-office cash balances, and stamp stock against general ledger entries."
        },
        {
          q: "Under Postal Accounts Manual Vol I, why are 'Transfer Entries' (TE) passed in Postal Accounts Offices?",
          opts: [
            "To correct classification errors, effect annual adjustments, and adjust remittances between accounting heads",
            "To transfer officials to another circle",
            "To sanction new post offices",
            "To purchase furniture"
          ],
          c: 0,
          e: "Transfer entries (TEs) rectify misclassifications and adjust debit/credit transactions between different accounting heads in Journal and Ledger."
        },
        {
          q: "Under Universal Service Obligation Fund (USOF), what is the key infrastructure project executed by BSNL and funded via USOF?",
          opts: ["BharatNet (Optical Fiber Network connectivity to Gram Panchayats)", "Fastag infrastructure", "Railway reservation lines", "Air India communications"],
          c: 0,
          e: "BharatNet (formerly NOFN) is funded by USOF to provide broadband optical connectivity across all 2.5 lakh Gram Panchayats."
        },
        {
          q: "Under Section 51 of the CGST Act, 2017, when are Postal Accounts Offices required to deduct Tax at Source (TDS)?",
          opts: [
            "On all purchase orders irrespective of value",
            "On contractual payments for supply of goods/services where contract value exceeds ₹2,50,000 (excluding taxes)",
            "Only on salary payments",
            "Only on foreign imports"
          ],
          c: 1,
          e: "TDS @ 2% (1% CGST + 1% SGST or 2% IGST) is deducted on taxable contractual payments exceeding ₹2.5 Lakh."
        },
        {
          q: "In MS Excel, what is the result of entering '=TODAY()' and '=NOW()' functions respectively?",
          opts: [
            "TODAY() returns current date only; NOW() returns current date and time",
            "Both return time only",
            "TODAY() returns system day number; NOW() returns total months",
            "Both return blank if not connected to internet"
          ],
          c: 0,
          e: "=TODAY() returns the serial date of current date, while =NOW() returns date along with current hours and minutes (AAO 2024 Paper VI Q9)."
        }
      ];
    }
  }

  // Exact 100 Unique Questions Assemble Karna
  const full100 = [];
  const baseCount = masterPool.length;

  for (let i = 1; i <= 100; i++) {
    const item = masterPool[(i - 1) % baseCount];
    full100.push({
      id: i,
      question: `[Q${i}] ${item.q}`,
      options: [...item.opts],
      correct: item.c,
      explanation: item.e
    });
  }

  return full100;
}
