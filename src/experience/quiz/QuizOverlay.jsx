import { useState, useEffect, useCallback, useRef } from "react";
import "./quiz.css";

const TIMER = 15;

const QUESTIONS = [
  {
    question: "Which university did Matthew graduate from with a B.S. in Computer Science?",
    options: ["Rice University", "Tulane University", "University of Houston", "University of Texas"],
    correct: 2,
  },
  {
    question: "KartoCars NFTs were minted on which blockchain network?",
    options: ["Solana", "Ethereum", "Polygon", "Cardano"],
    correct: 1,
  },
  {
    question: "What Google service powers GJHMail's instant email ingestion without polling?",
    options: ["Firebase Realtime DB", "Google Cloud Run", "Google Pub/Sub", "Google Cloud Scheduler"],
    correct: 2,
  },
];

export const QuizOverlay = ({ active, alreadyComplete, onSuccess, onFail }) => {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER);
  const [phase, setPhase] = useState("quiz");
  const onSuccessRef = useRef(onSuccess);
  const onFailRef = useRef(onFail);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onFailRef.current = onFail; }, [onFail]);

  useEffect(() => {
    if (active && !alreadyComplete) {
      setIndex(0);
      setTimeLeft(TIMER);
      setPhase("quiz");
    }
  }, [active, alreadyComplete]);

  // Countdown
  useEffect(() => {
    if (!active || alreadyComplete || phase !== "quiz") return;
    if (timeLeft <= 0) {
      setPhase("fail");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, active, alreadyComplete, phase]);

  // Exit delay after result — refs prevent re-firing when callback identity changes
  useEffect(() => {
    if (phase === "success") {
      const t = setTimeout(() => onSuccessRef.current(), 2500);
      return () => clearTimeout(t);
    }
    if (phase === "fail") {
      const t = setTimeout(() => onFailRef.current(), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleAnswer = useCallback(
    (optionIndex) => {
      if (phase !== "quiz") return;
      if (QUESTIONS[index].correct !== optionIndex) {
        setPhase("fail");
        return;
      }
      if (index === QUESTIONS.length - 1) {
        setPhase("success");
      } else {
        setIndex((i) => i + 1);
        setTimeLeft(TIMER);
      }
    },
    [index, phase]
  );

  if (!active) return null;

  if (alreadyComplete) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-box">
          <div className="quiz-header">TRIAL GATE</div>
          <div className="quiz-already-done">Left half of the Master Key already obtained.</div>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[index];
  const timerPct = (timeLeft / TIMER) * 100;

  return (
    <div className="quiz-overlay">
      <div className="quiz-box">
        <div className="quiz-header">
          TRIAL GATE — Question {index + 1} / {QUESTIONS.length}
        </div>

        {phase === "quiz" && (
          <>
            <div className="quiz-timer-bar">
              <div
                className="quiz-timer-fill"
                style={{
                  width: `${timerPct}%`,
                  background:
                    timerPct > 50 ? "#49ffb6" : timerPct > 25 ? "#f8c82a" : "#ff4f4f",
                }}
              />
            </div>
            <div className="quiz-timer-text">{timeLeft}s</div>
            <div className="quiz-question">{q.question}</div>
            <div className="quiz-options">
              {q.options.map((opt, i) => (
                <button key={i} className="quiz-option" onClick={() => handleAnswer(i)}>
                  {opt}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "success" && (
          <div className="quiz-result quiz-result--success">
            <div>All three answered correctly.</div>
            <div>Left Half of the Master Key obtained.</div>
            <div className="quiz-result-sub">Returning to Nexus...</div>
          </div>
        )}

        {phase === "fail" && (
          <div className="quiz-result quiz-result--fail">
            <div>Trial failed.</div>
            <div className="quiz-result-sub">Returning to Nexus...</div>
          </div>
        )}
      </div>
    </div>
  );
};
