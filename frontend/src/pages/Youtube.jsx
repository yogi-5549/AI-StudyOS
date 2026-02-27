import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Youtube.css";
import API_BASE from "../api";

function Youtube() {
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!url) {
      alert("Please enter a YouTube URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/summarize-youtube`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.summary) {
        setSummary(data);
        setShowModal(true);
      } else if (data.error) {
        alert(data.error);
      } else {
        alert("Error generating summary");
      }

    } catch (error) {
      alert("Backend connection error");
    }

    setLoading(false);
  };

  return (
    <div className="youtube-container">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">AI StudyOS</div>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span>About</span>
          <span>Contact Us</span>
        </div>
      </nav>

      {/* MAIN */}
      <div className="youtube-wrapper">
        <h1>YouTube AI Summarizer</h1>

        <div className="youtube-card">
          <input
            type="text"
            placeholder="Paste YouTube video link here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <button
            onClick={handleSummarize}
            disabled={loading}
            className="generate-btn"
          >
            {loading ? <div className="spinner"></div> : "Generate Summary"}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>Video Summary</h2>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">

              <h3>Summary</h3>
              <p>{summary.summary}</p>

              {summary.key_points?.length > 0 && (
                <>
                  <h3>Key Points</h3>
                  <ul>
                    {summary.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </>
              )}

              {summary.takeaways?.length > 0 && (
                <>
                  <h3>Takeaways</h3>
                  <ul>
                    {summary.takeaways.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Youtube;