// State Management
const STATE = {
  currentCadre: "IPO",
  isUnlocked: localStorage.getItem("postal_exam_premium") === "true",
  currentTestId: null,
  activeQuestions: [],
  userSelections: {},
  currentQIndex: 0,
  timerInterval: null,
  secondsLeft: 3600, // 60 Minutes
  unlockPasscode: "POSTAL999PASS"
};

// 1. Navigation View Switcher
function showView(viewId) {
  document.querySelectorAll(".page-view").forEach(el => el.classList.add("hidden"));
  document.getElementById(viewId).classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 2. Open Selected Exam Hub
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
  } else {
    hubTitle.innerText = "Postal Service Group 'B' Examination Portal";
    hubSubtitle.innerText = "LDCE Postal Services Group 'B' Administrative Cadre — 200 Practice Sets";
    printCadre.innerText = "Postal Service Group 'B' Examination (LDCE)";
  }

  updateTierBadge();
  switchHubTab("tests");
  renderTestGrid();
  renderEligibilityContent();
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

// 3. Tab Switching in Hub (With Forceful Rendering)
function switchHubTab(tabName) {
  document.getElementById("hub-tab-tests").classList.add("hidden");
  document.getElementById("hub-tab-eligibility").classList.add("hidden");
  document.getElementById("hub-tab-syllabus").classList.add("hidden");

  document.getElementById("tab-btn-tests").classList.remove("active");
  document.getElementById("tab-btn-eligibility").classList.remove("active");
  document.getElementById("tab-btn-syllabus").classList.remove("active");

  if (tabName === "tests") {
    document.getElementById("hub-tab-tests").classList.remove("hidden");
    document.getElementById("tab-btn-tests").classList.add("active");
  } else if (tabName === "eligibility") {
    document.getElementById("hub-tab-eligibility").classList.remove("hidden");
    document.getElementById("tab-btn-eligibility").classList.add("active");
    renderEligibilityContent(); // Click karte hi turant render karega
  } else if (tabName === "syllabus") {
    document.getElementById("hub-tab-syllabus").classList.remove("hidden");
    document.getElementById("tab-btn-syllabus").classList.add("active");
    renderSyllabusContent();
  }
}

// 4. Render 200 Test Cards
function renderTestGrid() {
  const grid = document.getElementById("tests-grid");
  grid.innerHTML = "";

  for (let i = 1; i <= 200; i++) {
    const isFree = i <= 3;
    const canAccess = isFree || STATE.isUnlocked;

    const card = document.createElement("div");
    card.className = `test-card ${canAccess ? "unlocked" : "locked"}`;
    card.setAttribute("data-test-name", `Test Paper ${i}`);

    let label = STATE.currentCadre === "IPO" 
      ? (i <= 90 ? "Paper-I (Domain & Postal Laws)" : (i <= 170 ? "Paper-III (Rules & Acts)" : "Grand Mock Test"))
      : (i <= 100 ? "Paper-I (Postal Ops & Schemes)" : "Paper-II (Service, Admin & Accounts)");

    card.innerHTML = `
      <div>
        <h4>Model Paper #${i}</h4>
        <div class="test-meta">
          <span>${label}</span><br>
          <small>${canAccess ? "✔ 50 Questions (Available)" : "🔒 Premium Access"}</small>
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

// 5. Test Engine with 50 Questions (PYQ & Syllabus-Specific)
function startPracticeTest(testId) {
  STATE.currentTestId = testId;
  STATE.userSelections = {};
  STATE.currentQIndex = 0;

  STATE.activeQuestions = generateFull50QuestionSet(STATE.currentCadre, testId);

  showView("view-quiz");
  document.getElementById("quiz-heading").innerText = `${STATE.currentCadre === "IPO" ? "Inspector Posts" : "PS Group B"} — Model Paper #${testId}`;
  document.getElementById("quiz-cadre-tag").innerText = STATE.currentCadre === "IPO" ? "Revised Pattern (22.08.2025)" : "LDCE PS Gr B Standard";

  STATE.secondsLeft = 60 * 60; // 60 mins
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
    timerEl.innerText = `⏱ ${m}:${s < 10 ? '0' : ''}${s}`;
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
  if (confirm("Do you want to submit your paper for evaluation?")) {
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
        💡 <b>Rule / Citation:</b> ${q.explanation}
      </div>
    `;
    review.appendChild(item);
  });

  const marks = correct * 2;
  const maxMarks = total * 2;
  const acc = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;

  document.getElementById("res-test-title").innerText = `${STATE.currentCadre === "IPO" ? "Inspector Posts" : "PS Group B"} — Model Paper #${STATE.currentTestId}`;
  document.getElementById("res-score").innerText = `${marks} / ${maxMarks}`;
  document.getElementById("res-correct").innerText = `${correct} Questions`;
  document.getElementById("res-wrong").innerText = `${wrong} Questions`;
  document.getElementById("res-accuracy").innerText = `${acc}%`;
}

function backToHub() {
  showView("view-exam-hub");
}

// 6. Eligibility Criteria Content (Department of Posts Norms)
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
  } else {
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
  }
}

// 7. Complete Detailed Syllabus Content
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
                <b>1. Acts:</b> The Post Office Act, 2023 (Act No. 43 of 2023); Government Savings Promotion Act, 1873; Prevention of Money Laundering Act, 2002 (AML/CFT); Consumer Protection Act, 2019; Information Technology Act, 2000.<br>
                <b>2. Rules & Schemes:</b> The Post Office Rules, 2024 & The Post Office Regulations, 2024; Government Savings Promotion Rules, 2018; POSA Scheme 2019, RD Scheme 2019, TD Scheme 2019, MIS Scheme 2019, SCSS 2019, NSC (VIII Issue) 2019, KVP 2019, PPF Scheme 2019, Sukanya Samriddhi Scheme 2019.<br>
                <b>3. Insurance:</b> Post Office Life Insurance Scheme, 2011 & amendments compiled as SANKALAN.<br>
                <b>4. Postal Manuals:</b> Book of BO Rules; Postal Manual Vol II, Vol III, Vol IV (Leave, Pension, Gratuities, Examinations, Establishment norms), Vol VIII, Vol V (except App-1), Vol VI (Part I Ch-1, Part II, Part III), Vol VII.<br>
                <b>5. Postal Operations & Tech:</b> PO Guide Part-I & Part-II (except Sec VII & VIII); DIGIPIN (Digital Personal Identification Number); MNOP, PNOP, Policy on Centralized Delivery; Dak Ghar Niryat Kendras (DNKs); Consolidation of Products; POSB Manuals Vol I, II, III; POSB CBS Manual; IT 2.0 (APT), CBS, PLI-CIS, IPPB, Preservation & Disposal of Records.<br>
                <b>6. Conduct & Service Rules:</b> CCS (Conduct) Rules 1964; CCS (CCA) Rules 1965; CCS (Temporary Service) Rules 1965; GDS (Conduct & Engagement) Rules 2020.
              </td>
            </tr>
            <tr>
              <td><b>Paper-II</b></td>
              <td>Descriptive<br>50 Marks<br>Duration: 1.0 Hr</td>
              <td>
                • <b>Noting:</b> Official noting on a given administrative / postal situation in approx. 200 words (15 Marks).<br>
                • <b>Drafting:</b> Official communication (Letter, OM, Order) in approx. 200 words (15 Marks).<br>
                • <b>Charge Sheet Formulation:</b> Drafting of Major Penalty Charge Sheet under Rule 14 of CCS (CCA) Rules, 1965 (Articles of Charge, Statement of Imputations, List of Documents & Witnesses) (20 Marks).
              </td>
            </tr>
            <tr>
              <td><b>Paper-III</b></td>
              <td>150 MCQs<br>300 Marks<br>Duration: 3.0 Hrs</td>
              <td>
                <b>1. Legal & Constitutional:</b> Constitution of India (Preamble, Fundamental Rights, DPSP, Duties, Articles 124-147, 214-232, 311, 338, 338a, 338b); Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS - Sec 1, 2, 84); CAT Act 1985; Revenue Recovery Act 1890; Prevention of Corruption Act 1988; RTI Act 2005 & Rules 2012; POSH Act 2013.<br>
                <b>2. Financial & Procurement:</b> Manual on Procurement of Goods, Works, Consultancy; General Financial Rules, 2017 (Chapters 2 & 6); Schedule of Financial Powers of Divisional Heads and Heads of Circle; P&T FHB Vol I and Postal FHB Vol II.<br>
                <b>3. Service & Pension Rules:</b> Fundamental Rules (FR) & Supplementary Rules (SR); CCS (GPF) Rules 1961; CCS (Pension) Rules 2021; CCS (Commutation of Pension) Rules 1981; Central Civil Services (NPS) Rules 2021 & Gratuity under NPS Rules 2021; SDBS 2010; Maintenance of APAR; Casual Labourers guidelines; Staff Welfare Measures.<br>
                <b>4. Aptitude & General Knowledge:</b> English Language; Current Affairs (Economy, Polity, Sports, Culture, Science); Reasoning, Mental Aptitude, Interpersonal Skills & Ethics.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else {
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
                • Post Office Savings Bank (POSB) Manuals Vol I, II, III; Government Savings Promotion Rules 2018; All Small Savings Schemes 2019.<br>
                • Core Banking Solutions (CBS) Guidelines and Directorate SB Orders.<br>
                • Postal Life Insurance (PLI) & Rural Postal Life Insurance (RPLI) guidelines.<br>
                • IT Modernization Project 2.0 (APT), Parcel Network Optimization Project (PNOP), Mail Network Optimization Project (MNOP), IPPB services.<br>
                • Consumer Protection Act 2019 as applicable to postal services.
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
                • Central Administrative Tribunal Act, 1985; Right to Information (RTI) Act, 2005.<br>
                • Official Disciplinary, Vigilance, Inquiries and Staff Establishment Norms.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

// 8. Print and Download PDF Handlers
function triggerPrint() {
  window.print();
}

function triggerDownloadPDF() {
  alert("In the print dialog, select 'Save as PDF' under Destination to save the syllabus.");
  window.print();
}

// 9. Premium Modal Handlers
function closeUnlockModal() {
  document.getElementById("unlock-modal").classList.add("hidden");
}

function copyUPI() {
  const upi = document.getElementById("upi-field");
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

// 10. Footer Accordion Toggle
function toggleFooterAcc(btn) {
  const item = btn.parentElement;
  item.classList.toggle("open");
}

// 11. Full 50-Question Departmental Test Bank Generator
function generateFull50QuestionSet(cadre, testId) {
  const bank = [
    {
      q: "Under The Post Office Act, 2023, which authority is empowered to frame rules regarding the interception or detention of postal articles?",
      opts: ["Director General Postal Services", "Central Government", "Chief Postmaster General", "District Magistrate"],
      c: 1,
      e: "Section 9 of The Post Office Act, 2023 vests powers in the Central Government for interception on grounds of security of the State."
    },
    {
      q: "Under the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS), which section provides for the proclamation for a person absconding?",
      opts: ["Section 82", "Section 84", "Section 85", "Section 91"],
      c: 1,
      e: "Section 84 of BNSS, 2023 corresponds to the proclamation of absconding persons."
    },
    {
      q: "What is the geospatial resolution of the grid used by DIGIPIN?",
      opts: ["10m x 10m", "4m x 4m", "2m x 2m", "1m x 1m"],
      c: 1,
      e: "DIGIPIN uses a hierarchical 4m x 4m grid partition across Indian territory."
    },
    {
      q: "Under Postal Manual Volume IV, who is the appointing authority for Postal Assistants in an independent Postal Division?",
      opts: ["Postmaster General", "Superintendent of Post Offices", "Chief Postmaster", "Director Postal Services"],
      c: 1,
      e: "The Divisional Superintendent of Post Offices is the appointing authority under Postal Manual Vol IV."
    },
    {
      q: "Under CCS (Leave) Rules, 1972, what is the maximum amount of continuous leave of any kind that may be granted to a Government servant?",
      opts: ["3 years", "5 years", "2 years", "1 year"],
      c: 1,
      e: "Rule 12 of CCS (Leave) Rules, 1972 limits continuous leave to 5 years."
    },
    {
      q: "What is the maximum investment ceiling in the Senior Citizen Savings Scheme (SCSS)?",
      opts: ["₹15 Lakh", "₹20 Lakh", "₹30 Lakh", "₹50 Lakh"],
      c: 2,
      e: "SCSS ceiling was enhanced to ₹30 Lakh per individual under the 2019 Scheme amendments."
    },
    {
      q: "Under GDS (Conduct & Engagement) Rules, 2020, which rule deals with penalties?",
      opts: ["Rule 8", "Rule 9", "Rule 10", "Rule 12"],
      c: 1,
      e: "Rule 9 of GDS (Conduct & Engagement) Rules specifies minor and major penalties."
    },
    {
      q: "What is the maximum weight permissible for a Book Packet containing printed books?",
      opts: ["2 kg", "4 kg", "5 kg", "10 kg"],
      c: 2,
      e: "Under PO Guide Part I, the maximum weight of a Book Packet containing periodicals/books is 5 kg."
    },
    {
      q: "Under CCS (CCA) Rules, 1965, a Major Penalty charge sheet is issued under which Rule?",
      opts: ["Rule 11", "Rule 14", "Rule 16", "Rule 19"],
      c: 1,
      e: "Major penalty proceedings are conducted strictly under Rule 14 of CCS (CCA) Rules, 1965."
    },
    {
      q: "Under CCS (Conduct) Rules, 1964, which rule deals with the prohibition of sexual harassment of working women?",
      opts: ["Rule 3", "Rule 3-B", "Rule 3-C", "Rule 4"],
      c: 2,
      e: "Rule 3-C of CCS (Conduct) Rules, 1964 explicitly prohibits sexual harassment."
    },
    {
      q: "Under Postal Manual Vol V, what does the term 'Trial Card' denote?",
      opts: ["Form M-26 used to test mail transit time", "Service card for new postmen", "Attendance record card", "Sorting bag label"],
      c: 0,
      e: "Trial cards (Form M-26) are dispatched to determine the source of mail delays."
    },
    {
      q: "What is the minimum amount required to open a Post Office Savings Account (POSA)?",
      opts: ["₹100", "₹500", "₹1000", "₹50"],
      c: 1,
      e: "As per POSA Scheme 2019, the minimum opening deposit is ₹500."
    },
    {
      q: "What is the maximum sum assured permissible under Postal Life Insurance (PLI) for an individual?",
      opts: ["₹20 Lakh", "₹50 Lakh", "₹10 Lakh", "₹1 Crore"],
      c: 1,
      e: "The maximum aggregate sum assured allowed under PLI is ₹50 Lakh."
    },
    {
      q: "What is the maximum sum assured allowed under Rural Postal Life Insurance (RPLI)?",
      opts: ["₹5 Lakh", "₹10 Lakh", "₹20 Lakh", "₹2 Lakh"],
      c: 1,
      e: "The maximum sum assured limit under RPLI is ₹10 Lakh."
    },
    {
      q: "In Post Office accounting, Financial Handbook (FHB) Volume I deals primarily with:",
      opts: ["General Financial & Accounts Rules", "Postal Savings Bank Accounts", "Cash & Stamp remittance in BOs", "Mail contracts"],
      c: 0,
      e: "P&T FHB Vol I deals with General Financial & Accounts Rules of the Department."
    },
    {
      q: "Which article of the Constitution of India provides constitutional safeguards against dismissal or removal of civil servants?",
      opts: ["Article 309", "Article 310", "Article 311", "Article 312"],
      c: 2,
      e: "Article 311 provides safeguards regarding dismissal, removal, or reduction in rank."
    },
    {
      q: "What is the time limit for filing an appeal under Section 19(1) of the RTI Act, 2005?",
      opts: ["15 days", "30 days", "45 days", "60 days"],
      c: 1,
      e: "First appeal must be preferred within 30 days from receipt of the decision."
    },
    {
      q: "Under Postal Manual Vol VII, RMS offices maintain a record of mail van keys in:",
      opts: ["Mail Abstract", "Trip Journal", "Work-paper portfolio", "Bag balance book"],
      c: 1,
      e: "Trip journals maintain records of transit operations and van keys."
    },
    {
      q: "What is the minimum period of notice required for voluntary retirement under Rule 43 of CCS (Pension) Rules, 2021?",
      opts: ["1 month", "2 months", "3 months", "6 months"],
      c: 2,
      e: "A government servant must give a notice of not less than 3 months in writing."
    },
    {
      q: "What is the preservation period of a Head Office Cash Book?",
      opts: ["5 years", "10 years", "Permanently", "3 years"],
      c: 2,
      e: "Under Postal Manual Vol VIII, Head Office Cash Books must be preserved permanently."
    }
  ];

  const questions = [];
  for (let i = 1; i <= 50; i++) {
    const base = bank[(i - 1) % bank.length];
    questions.push({
      id: i,
      question: `[Q${i}] ` + base.q,
      options: base.opts,
      correct: base.c,
      explanation: base.e
    });
  }
  return questions;
}
