// State Management
const STATE = {
  currentCadre: "IPO", // 'IPO' or 'PSB'
  isUnlocked: localStorage.getItem("postal_exam_premium") === "true",
  currentTestId: null,
  activeQuestions: [],
  userSelections: {},
  currentQIndex: 0,
  timerInterval: null,
  secondsLeft: 0,
  unlockPasscode: "POSTAL2026KEY" // Passcode provided to paid candidates
};

// 1. Navigation View Switcher
function showView(viewId) {
  document.querySelectorAll(".page-view").forEach(el => el.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 2. Open Selected Exam Hub (Inspector Posts or PS Group B)
function openExamHub(cadre) {
  STATE.currentCadre = cadre;
  showView("view-exam-hub");

  const hubTitle = document.getElementById("hub-title");
  const hubSubtitle = document.getElementById("hub-subtitle");
  const printCadre = document.getElementById("print-cadre-title");

  if (cadre === "IPO") {
    hubTitle.innerText = "Inspector Posts (IP) Examination Portal";
    hubSubtitle.innerText = "Strictly Based on Directorate Revised Scheme (22.08.2025) — 200 Practice Sets";
    printCadre.innerText = "Inspector Posts Examination (LDCE Revised Syllabus)";
  } else {
    hubTitle.innerText = "Postal Service Group 'B' Examination Portal";
    hubSubtitle.innerText = "LDCE Postal Services Group 'B' Administrative Cadre — 200 Practice Sets";
    printCadre.innerText = "Postal Service Group 'B' Examination (LDCE)";
  }

  updateTierBadge();
  switchHubTab("tests");
  renderTestGrid();
  renderSyllabusContent();
}

function updateTierBadge() {
  const badge = document.getElementById("user-tier-badge");
  if (STATE.isUnlocked) {
    badge.innerText = "✔ Premium Access: All 200 Sets Unlocked";
    badge.style.background = "#dcfce7";
    badge.style.color = "#15803d";
  } else {
    badge.innerText = "Free Mode: Tests 1 to 3 Unlocked";
    badge.style.background = "#e0f2fe";
    badge.style.color = "#0369a1";
  }
}

// 3. Hub Tab Switching
function switchHubTab(tabName) {
  const tabTests = document.getElementById("hub-tab-tests");
  const tabSyllabus = document.getElementById("hub-tab-syllabus");
  const btnTests = document.getElementById("tab-btn-tests");
  const btnSyllabus = document.getElementById("tab-btn-syllabus");

  if (tabName === "tests") {
    tabTests.classList.remove("hidden");
    tabSyllabus.classList.add("hidden");
    btnTests.classList.add("active");
    btnSyllabus.classList.remove("active");
  } else {
    tabTests.classList.add("hidden");
    tabSyllabus.classList.remove("hidden");
    btnTests.classList.remove("active");
    btnSyllabus.classList.add("active");
  }
}

// 4. Render 200 Tests Grid
function renderTestGrid() {
  const grid = document.getElementById("tests-grid");
  grid.innerHTML = "";

  for (let i = 1; i <= 200; i++) {
    const isFree = i <= 3;
    const canAccess = isFree || STATE.isUnlocked;

    const card = document.createElement("div");
    card.className = `test-card ${canAccess ? "unlocked" : "locked"}`;
    card.setAttribute("data-test-name", `Test Paper ${i}`);

    let paperLabel = "";
    if (STATE.currentCadre === "IPO") {
      paperLabel = i <= 90 ? "Paper-I (Domain & Postal Laws)" : (i <= 170 ? "Paper-III (Rules & Acts)" : "Full Grand Mock");
    } else {
      paperLabel = i <= 100 ? "Paper-I (Operations & Postal)" : "Paper-II (Service & Finance)";
    }

    card.innerHTML = `
      <div>
        <h4>Model Paper #${i}</h4>
        <div class="test-meta">
          <span>${paperLabel}</span><br>
          <small>${canAccess ? "✔ Available for Practice" : "🔒 Premium Only"}</small>
        </div>
      </div>
      <button class="btn ${canAccess ? "btn-primary" : "btn-secondary"} full-width" onclick="handleTestSelect(${i}, ${canAccess})">
        ${canAccess ? "Start Practice" : "Unlock Paper"}
      </button>
    `;
    grid.appendChild(card);
  }
}

function filterTests() {
  const query = document.getElementById("test-search").value.toLowerCase();
  document.querySelectorAll(".test-card").forEach(card => {
    const name = card.getAttribute("data-test-name").toLowerCase();
    card.style.display = name.includes(query) ? "flex" : "none";
  });
}

// 5. Handle Test Launch or Modal Trigger
function handleTestSelect(testId, canAccess) {
  if (!canAccess) {
    document.getElementById("unlock-modal").classList.remove("hidden");
    return;
  }
  startPracticeTest(testId);
}

// 6. Test Runner Engine (With Sample Fallback for Tests)
function startPracticeTest(testId) {
  STATE.currentTestId = testId;
  STATE.userSelections = {};
  STATE.currentQIndex = 0;

  // Build authentic sample questions matching selected cadre
  STATE.activeQuestions = generateSampleQuestions(STATE.currentCadre, testId);

  showView("view-quiz");
  document.getElementById("quiz-heading").innerText = `${STATE.currentCadre === "IPO" ? "Inspector Posts" : "PS Group B"} — Paper #${testId}`;
  document.getElementById("quiz-cadre-tag").innerText = STATE.currentCadre === "IPO" ? "Pattern: 22.08.2025 Order" : "PS Gr B LDCE Scheme";

  STATE.secondsLeft = 60 * 60; // 60 minutes for practice set
  startQuizTimer();
  displayQuestion(0);
}

function generateSampleQuestions(cadre, testId) {
  if (cadre === "IPO") {
    return [
      {
        id: 1,
        question: "Under The Post Office Act, 2023, which authority is empowered to frame rules regarding the interception, detention, or opening of postal articles?",
        options: [
          "Director General Postal Services",
          "Central Government",
          "Chief Postmaster General of the Circle",
          "District Magistrate"
        ],
        correct: 1,
        explanation: "Section 9 of The Post Office Act, 2023 empowers the Central Government to frame rules for interception or detention in the interest of the security of the State."
      },
      {
        id: 2,
        question: "Under the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), which section corresponds to the proclamation for a person absconding?",
        options: ["Section 82", "Section 84", "Section 91", "Section 102"],
        correct: 1,
        explanation: "As per the updated LDCE IP syllabus (dated 22.08.2025), Section 84 of the BNSS, 2023 deals with the proclamation for a person absconding."
      },
      {
        id: 3,
        question: "What is DIGIPIN in the context of modern India Post initiatives?",
        options: [
          "Digital Postal Index Number using geospatial latitude-longitude coordinates",
          "Digital PIN code specifically for speed post articles",
          "Biometric authentication key for CBS post offices",
          "An encrypted code for Dak Ghar Niryat Kendras"
        ],
        correct: 0,
        explanation: "DIGIPIN is a 10-character alphanumeric digital addressing code developed on a 4m x 4m geographical grid using geospatial coordinates."
      }
    ];
  } else {
    return [
      {
        id: 1,
        question: "Under Postal Manual Volume IV, who is the appointing authority for Postal Assistants in an independent Postal Division?",
        options: ["Postmaster General", "Superintendent of Post Offices / Divisional Head", "Chief Postmaster", "Director of Postal Services"],
        correct: 1,
        explanation: "The Divisional Superintendent of Post Offices is the appointing authority for Postal Assistants under Postal Manual Vol IV."
      },
      {
        id: 2,
        question: "What is the maximum limit for investment in the Senior Citizen Savings Scheme (SCSS)?",
        options: ["₹15 Lakh", "₹20 Lakh", "₹30 Lakh", "₹50 Lakh"],
        correct: 2,
        explanation: "The maximum ceiling for deposit under SCSS (2019 Scheme) was enhanced to ₹30 Lakh per individual."
      }
    ];
  }
}

function startQuizTimer() {
  clearInterval(STATE.timerInterval);
  const timerEl = document.getElementById("quiz-timer");
  
  STATE.timerInterval = setInterval(() => {
    STATE.secondsLeft--;
    const min = Math.floor(STATE.secondsLeft / 60);
    const sec = STATE.secondsLeft % 60;
    timerEl.innerText = `⏱ ${min}:${sec < 10 ? '0' : ''}${sec}`;

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

  const optContainer = document.getElementById("options-group");
  optContainer.innerHTML = "";

  q.options.forEach((optText, i) => {
    const btn = document.createElement("button");
    btn.className = `option-btn ${STATE.userSelections[idx] === i ? "selected" : ""}`;
    btn.innerHTML = `<b>(${String.fromCharCode(65 + i)})</b> ${optText}`;
    btn.onclick = () => {
      STATE.userSelections[idx] = i;
      displayQuestion(idx);
    };
    optContainer.appendChild(btn);
  });

  document.getElementById("btn-prev").disabled = idx === 0;
  document.getElementById("btn-next").disabled = idx === STATE.activeQuestions.length - 1;
}

function navigateQuestion(step) {
  const newIndex = STATE.currentQIndex + step;
  if (newIndex >= 0 && newIndex < STATE.activeQuestions.length) {
    displayQuestion(newIndex);
  }
}

function exitQuiz() {
  if (confirm("Are you sure you want to exit? Your practice progress in this paper will be reset.")) {
    clearInterval(STATE.timerInterval);
    showView("view-exam-hub");
  }
}

function confirmSubmitQuiz() {
  if (confirm("Do you wish to submit this test paper for evaluation?")) {
    finishQuiz();
  }
}

function finishQuiz() {
  clearInterval(STATE.timerInterval);
  showView("view-result");

  let correct = 0;
  let wrong = 0;
  const total = STATE.activeQuestions.length;
  const reviewContainer = document.getElementById("review-container");
  reviewContainer.innerHTML = "";

  STATE.activeQuestions.forEach((q, i) => {
    const userAns = STATE.userSelections[i];
    const isRight = userAns === q.correct;
    if (userAns !== undefined) {
      if (isRight) correct++;
      else wrong++;
    }

    const item = document.createElement("div");
    item.className = `review-item ${isRight ? "pass" : "fail"}`;
    item.innerHTML = `
      <p><b>Q${i + 1}: ${q.question}</b></p>
      <p style="margin-top: 5px;">Your Answer: <b>${userAns !== undefined ? `(${String.fromCharCode(65 + userAns)}) ` + q.options[userAns] : "Not Attempted"}</b></p>
      <p style="color: var(--success); font-weight: 600;">Correct Answer: (${String.fromCharCode(65 + q.correct)}) ${q.options[q.correct]}</p>
      <div class="explanation-box">
        💡 <b>Rule & Solution Citation:</b> ${q.explanation}
      </div>
    `;
    reviewContainer.appendChild(item);
  });

  const marks = correct * 2;
  const maxMarks = total * 2;
  const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;

  document.getElementById("res-test-title").innerText = `${STATE.currentCadre === "IPO" ? "Inspector Posts" : "PS Group B"} — Model Paper #${STATE.currentTestId}`;
  document.getElementById("res-score").innerText = `${marks} / ${maxMarks}`;
  document.getElementById("res-correct").innerText = `${correct} Qs`;
  document.getElementById("res-wrong").innerText = `${wrong} Qs`;
  document.getElementById("res-accuracy").innerText = `${accuracy}%`;
}

function backToHub() {
  showView("view-exam-hub");
}

// 7. Dynamic Syllabus Renderer
function renderSyllabusContent() {
  const container = document.getElementById("syllabus-body");
  
  if (STATE.currentCadre === "IPO") {
    container.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h3>Scheme & Syllabus for LDCE Inspector Posts</h3>
        <p class="text-muted">Issued vide Directorate Communication No. 7-14/2011-SPN-II dated 22.08.2025.</p>
      </div>

      <table class="syllabus-table">
        <thead>
          <tr>
            <th style="width: 15%;">Paper</th>
            <th style="width: 25%;">Pattern & Duration</th>
            <th>Detailed Syllabus Coverage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Paper-I</b></td>
            <td>125 MCQs<br>250 Marks<br>Duration: 2.5 Hrs</td>
            <td>
              • <b>Acts:</b> The Post Office Act, 2023; Govt Savings Promotion Act 1873; PMLA 2002; CPA 2019; IT Act 2000.<br>
              • <b>Rules & Schemes:</b> Post Office Rules & Regulations 2024; POSB Schemes 2019 (SB, RD, TD, MIS, SCSS, PPF, SSA, KVP, NSC); PLI SANKALAN.<br>
              • <b>Manuals:</b> Book of BO Rules; Postal Manuals Vol II, III, IV, VIII; Vol V, VI (Parts I, II, III), Vol VII.<br>
              • <b>Operations & Modern Tech:</b> DIGIPIN, MNOP, PNOP, Centralized Delivery, Dak Ghar Niryat Kendra (DNK), IT 2.0 (APT), CBS, PLI-CIS, IPPB.<br>
              • <b>Conduct & Service Rules:</b> CCS (Conduct) Rules 1964; CCS (CCA) Rules 1965; CCS (Temp Service) Rules; GDS (Conduct & Engagement) Rules 2020.
            </td>
          </tr>
          <tr>
            <td><b>Paper-II</b></td>
            <td>Descriptive<br>50 Marks<br>Duration: 1.0 Hr</td>
            <td>
              • Noting on a given topic (15 Marks - approx. 200 words).<br>
              • Drafting on a given topic (15 Marks - approx. 200 words).<br>
              • Draft Major Penalty Charge Sheet (20 Marks).
            </td>
          </tr>
          <tr>
            <td><b>Paper-III</b></td>
            <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
            <td>
              • Constitution of India (Preamble, Fundamental Rights/Duties, DPSP, Judiciary, Art 311, 338).<br>
              • Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS - Sec 1, 2, 84).<br>
              • CAT Act 1985; Revenue Recovery Act 1890; Prevention of Corruption Act 1988; RTI Act 2005.<br>
              • Manuals on Procurement (Goods, Works, Consultancy); GFR 2017 (Ch 2 & 6); FR-SR; P&T FHB Vol I & II.<br>
              • CCS (Pension) Rules 2021; NPS Rules 2021; CCS (Commutation) Rules 1981; POSH Act 2013.<br>
              • English Language (Grammar & Comprehension); General Knowledge & Current Affairs; Reasoning & Aptitude.
            </td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    container.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h3>Scheme & Syllabus for LDCE Postal Service Group 'B'</h3>
        <p class="text-muted">Prescribed syllabus for promotion to Postal Services Group B Administrative Cadre.</p>
      </div>

      <table class="syllabus-table">
        <thead>
          <tr>
            <th style="width: 15%;">Paper</th>
            <th style="width: 25%;">Pattern & Duration</th>
            <th>Detailed Syllabus Coverage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><b>Paper-I</b></td>
            <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
            <td>
              • Post Office Guide Part-I & Part-II.<br>
              • Postal Manuals Vol V, VI (Parts I, II, III), and Vol VII.<br>
              • POSB Manual Volumes I, II & III; POSB CBS guidelines and circulars.<br>
              • Postal Life Insurance (PLI) and Rural Postal Life Insurance (RPLI) guidelines.<br>
              • Mail Network Optimization Project (MNOP), Parcel Network, IT Modernization 2.0.
            </td>
          </tr>
          <tr>
            <td><b>Paper-II</b></td>
            <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
            <td>
              • General Financial Rules 2017 & Financial Handbook (FHB Vol I & II).<br>
              • Fundamental Rules (FR) & Supplementary Rules (SR); Schedule of Financial Powers.<br>
              • CCS (Conduct) Rules 1964 & CCS (CCA) Rules 1965.<br>
              • CCS (Leave) Rules 1972, CCS (Pension) Rules 2021, and NPS Guidelines.<br>
              • RTI Act 2005, Consumer Protection Act, and official vigilance procedures.
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }
}

// 8. Print Syllabus Function
function printSyllabus() {
  window.print();
}

// 9. Premium Modal Handlers
function closeUnlockModal() {
  document.getElementById("unlock-modal").classList.add("hidden");
}

function verifyAccessKey() {
  const entered = document.getElementById("access-key-input").value.trim();
  if (entered === STATE.unlockPasscode) {
    localStorage.setItem("postal_exam_premium", "true");
    STATE.isUnlocked = true;
    alert("Passcode Accepted! All 200 Practice Sets have been unlocked.");
    closeUnlockModal();
    updateTierBadge();
    renderTestGrid();
  } else {
    alert("Invalid Passcode. Please verify the code received after UPI payment confirmation.");
  }
}
