import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Doubt.css";
import API_BASE from "../api";

function Doubt() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    if (!question) {
      alert("Please enter your doubt");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/solve-doubt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (data.explanation) {
        setAnswer(data.explanation);
        setShowModal(true);
      } else {
        alert("Error solving doubt");
      }

    } catch (error) {
      alert("Backend connection error");
    }

    setLoading(false);
  };

  return (
    <div className="doubt-container">

      <nav className="navbar">
        <div className="logo">AI StudyOS</div>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
        </div>
      </nav>

      <div className="doubt-wrapper">
        <h1>AI Doubt Solver</h1>

        <div className="doubt-card">
          <textarea
            placeholder="Type your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            onClick={handleSolve}
            disabled={loading}
            className="generate-btn"
          >
            {loading ? <div className="spinner"></div> : "Solve Doubt"}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>Doubt Explanation</h2>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">

              <h3>Summary</h3>
              <p>{answer.summary}</p>

              <h3>Step-by-Step Explanation</h3>
              <p>{answer.step_by_step}</p>

              <h3>Example</h3>
              <p>{answer.example}</p>

              <h3>Key Takeaway</h3>
              <p>{answer.key_takeaway}</p>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Doubt;