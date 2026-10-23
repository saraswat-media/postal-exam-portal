// 1. स्टेट मैनेजमेंट और 3 Free + Paid सिस्टम
const SECRET_ACCESS_KEY = "PSGB2026PASS"; // इस कोड से प्रीमियम अनलॉक होगा
let isPaidUser = localStorage.getItem("ps_premium_unlocked") === "true";

let currentTest = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval = null;
let timeLeft = 0;

// 200 मॉडल पेपर्स की सूची तैयार करना
const TOTAL_PAPERS = 200;
const testGrid = document.getElementById("test-grid");
const userStatusBadge = document.getElementById("user-status");

function updateStatus() {
  if (isPaidUser) {
    userStatusBadge.innerText = "Premium Unlocked (All 200)";
    userStatusBadge.style.background = "#38a169";
  } else {
    userStatusBadge.innerText = "Free User (3 Free Tests)";
  }
}
updateStatus();

// 200 टेस्ट कार्ड्स रेंडर करना
function renderTestGrid() {
  testGrid.innerHTML = "";
  for (let i = 1; i <= TOTAL_PAPERS; i++) {
    const isFree = i <= 3;
    const canAccess = isFree || isPaidUser;

    const card = document.createElement("div");
    card.className = `card ${canAccess ? "free" : "locked"}`;
    card.innerHTML = `
      <div>
        <h4>Model Paper #${i}</h4>
        <span class="card-tag ${canAccess ? "tag-free" : "tag-locked"}">
          ${isFree ? "✔ FREE PRACTICE" : isPaidUser ? "✔ UNLOCKED" : "🔒 PAID"}
        </span>
      </div>
      <button class="btn-primary" onclick="handleTestClick(${i}, ${canAccess})">
        ${canAccess ? "Start Practice" : "Unlock Test"}
      </button>
    `;
    testGrid.appendChild(card);
  }
}
renderTestGrid();

// टेस्ट शुरू करने या पेमेंट मॉडल खोलने का लॉजिक
window.handleTestClick = function(testId, canAccess) {
  if (!canAccess) {
    document.getElementById("pay-modal").classList.remove("hidden");
    return;
  }
  loadAndStartTest(testId);
};

// मॉक टेस्ट डेटा लोड करना (डेमो के लिए डमी सवाल अगर JSON नहीं मिला)
function loadAndStartTest(testId) {
  // वास्तविक फाइल: fetch(`data/test_${testId}.json`)
  // फॉलबैक सैंपल डेटा:
  currentTest = {
    testId: testId,
    title: `PS Group B - Model Paper #${testId}`,
    durationMinutes: 30,
    questions: [
      {
        id: 1,
        question: "Under Postal Manual Vol IV, who is authorized to issue appointment orders of Postal Assistants?",
        options: ["Postmaster General", "Superintendent of Post Offices", "Inspector of Posts", "Director of Postal Services"],
        correct: 1,
        explanation: "Superintendent of Post Offices is the appointing authority for Postal Assistants."
      },
      {
        id: 2,
        question: "What is the maximum limit for booking of Senior Citizen Savings Scheme (SCSS)?",
        options: ["₹15 Lakh", "₹30 Lakh", "₹20 Lakh", "₹50 Lakh"],
        correct: 1,
        explanation: "The maximum deposit limit for SCSS has been increased to ₹30 Lakh."
      },
      {
        id: 3,
        question: "Leave Travel Concession (LTC) rules are governed under which CCS rules?",
        options: ["CCS (Leave) Rules, 1972", "CCS (LTC) Rules, 1988", "CCS (Conduct) Rules, 1964", "CCS (CCA) Rules, 1965"],
        correct: 1,
        explanation: "LTC is regulated by CCS (LTC) Rules, 1988."
      }
    ]
  };

  currentQuestionIndex = 0;
  userAnswers = {};
  startQuiz();
}

function startQuiz() {
  document.getElementById("dashboard-view").classList.add("hidden");
  document.getElementById("result-view").classList.add("hidden");
  document.getElementById("quiz-view").classList.remove("hidden");

  document.getElementById("quiz-title").innerText = currentTest.title;
  timeLeft = currentTest.durationMinutes * 60;
  startTimer();
  showQuestion(currentQuestionIndex);
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    document.getElementById("timer").innerText = `⏱ Time: ${min}:${sec < 10 ? '0' : ''}${sec}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function showQuestion(index) {
  const q = currentTest.questions[index];
  document.getElementById("q-number").innerText = `Question ${index + 1} of ${currentTest.questions.length}`;
  document.getElementById("q-text").innerText = q.question;

  const optionsContainer = document.getElementById("options-list");
  optionsContainer.innerHTML = "";

  q.options.forEach((opt, optIndex) => {
    const div = document.createElement("div");
    div.className = "option-item" + (userAnswers[index] === optIndex ? " selected" : "");
    div.innerText = `${String.fromCharCode(65 + optIndex)}. ${opt}`;
    div.onclick = () => {
      userAnswers[index] = optIndex;
      showQuestion(index);
    };
    optionsContainer.appendChild(div);
  });

  document.getElementById("prev-btn").disabled = index === 0;
  document.getElementById("next-btn").disabled = index === currentTest.questions.length - 1;
}

document.getElementById("prev-btn").onclick = () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
  }
};

document.getElementById("next-btn").onclick = () => {
  if (currentQuestionIndex < currentTest.questions.length - 1) {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
  }
};

document.getElementById("exit-btn").onclick = () => {
  if (confirm("क्या आप टेस्ट छोड़कर वापस जाना चाहते हैं?")) {
    clearInterval(timerInterval);
    document.getElementById("quiz-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
  }
};

document.getElementById("submit-btn").onclick = () => {
  if (confirm("क्या आप टेस्ट सबमिट करना चाहते हैं?")) {
    submitQuiz();
  }
};

// 3. रिजल्ट कैलकुलेशन और उत्तर + स्पष्टीकरण (Review) दिखाना
function submitQuiz() {
  clearInterval(timerInterval);
  document.getElementById("quiz-view").classList.add("hidden");
  document.getElementById("result-view").classList.remove("hidden");

  let correctCount = 0;
  let wrongCount = 0;
  const reviewList = document.getElementById("review-list");
  reviewList.innerHTML = "";

  currentTest.questions.forEach((q, index) => {
    const userSelected = userAnswers[index];
    const isCorrect = userSelected === q.correct;
    
    if (userSelected !== undefined) {
      if (isCorrect) correctCount++;
      else wrongCount++;
    }

    const reviewCard = document.createElement("div");
    reviewCard.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;
    reviewCard.innerHTML = `
      <p><b>Q${index + 1}: ${q.question}</b></p>
      <p>आपका उत्तर: <b>${userSelected !== undefined ? q.options[userSelected] : "Not Attempted"}</b></p>
      <p style="color: #276749;">सही उत्तर: <b>${q.options[q.correct]}</b></p>
      <div class="explanation-box">
        📘 <b>स्पष्टीकरण:</b> ${q.explanation || "No explanation available."}
      </div>
    `;
    reviewList.appendChild(reviewCard);
  });

  document.getElementById("res-score").innerText = `${correctCount} / ${currentTest.questions.length}`;
  document.getElementById("res-correct").innerText = correctCount;
  document.getElementById("res-wrong").innerText = wrongCount;
  const acc = currentTest.questions.length > 0 ? ((correctCount / currentTest.questions.length) * 100).toFixed(1) : 0;
  document.getElementById("res-accuracy").innerText = `${acc}%`;
}

document.getElementById("restart-btn").onclick = () => {
  document.getElementById("result-view").classList.add("hidden");
  document.getElementById("dashboard-view").classList.remove("hidden");
};

// 4. पेमेंट और अनलॉक की (Access Key) लॉजिक
document.getElementById("close-modal").onclick = () => {
  document.getElementById("pay-modal").classList.add("hidden");
};

document.getElementById("unlock-btn").onclick = () => {
  const enteredKey = document.getElementById("access-key-input").value.trim();
  if (enteredKey === SECRET_ACCESS_KEY) {
    localStorage.setItem("ps_premium_unlocked", "true");
    isPaidUser = true;
    alert("बधाई हो! सभी 200 मॉडल पेपर्स अनलॉक हो गए हैं।");
    document.getElementById("pay-modal").classList.add("hidden");
    updateStatus();
    renderTestGrid();
  } else {
    alert("अमान्य (Invalid) एक्सेस कोड! कृपया सही कोड दर्ज करें।");
  }
};
