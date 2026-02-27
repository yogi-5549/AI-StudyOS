import { useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "./Notes.css";

function Notes() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) {
      alert("Please enter a topic");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate-notes-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, content }),
      });

      const data = await response.json();

      if (data.notes) {
        setNotes(data.notes);
        setShowModal(true);
      } else {
        alert("Error generating notes");
      }

    } catch (error) {
      alert("Backend connection error");
    }

    setLoading(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`AI StudyOS - Revision Notes`, 20, 20);

    doc.setFontSize(14);
    doc.text(`Topic: ${topic}`, 20, 30);

    doc.setFontSize(12);
    let y = 45;

    // Summary
    doc.text("Summary:", 20, y);
    y += 8;

    const summaryLines = doc.splitTextToSize(notes.summary || "", 170);
    doc.text(summaryLines, 20, y);
    y += summaryLines.length * 7;

    y += 10;

    // Key Points
    if (notes.key_points?.length > 0) {
      doc.text("Key Points:", 20, y);
      y += 8;

      notes.key_points.forEach((point) => {
        const lines = doc.splitTextToSize(`• ${point}`, 170);
        doc.text(lines, 20, y);
        y += lines.length * 7;
      });

      y += 10;
    }

    // Formulas
    if (notes.formulas?.length > 0) {
      doc.text("Important Formulas:", 20, y);
      y += 8;

      notes.formulas.forEach((formula) => {
        const lines = doc.splitTextToSize(`• ${formula}`, 170);
        doc.text(lines, 20, y);
        y += lines.length * 7;
      });
    }

    doc.save(`${topic}_Revision_Notes.pdf`);
  };

  return (
    <div className="notes-container">

      <nav className="navbar">
        <div className="logo">AI StudyOS</div>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span>About</span>
          <span>Contact Us</span>
        </div>
      </nav>

      <div className="notes-wrapper">
        <h1>Smart Revision Notes</h1>

        <div className="notes-card">

          <label>Topic</label>
          <input
            type="text"
            placeholder="e.g., Machine Learning"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <label>Optional Detailed Content</label>
          <textarea
            placeholder="Paste lecture notes or leave blank"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="generate-btn"
          >
            {loading ? <div className="spinner"></div> : "Generate Notes"}
          </button>

        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>Revision Notes</h2>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">

              <h3>Summary</h3>
              <p>{notes.summary}</p>

              {notes.key_points?.length > 0 && (
                <>
                  <h3>Key Points</h3>
                  <ul>
                    {notes.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </>
              )}

              {notes.formulas?.length > 0 && (
                <>
                  <h3>Important Formulas</h3>
                  <ul>
                    {notes.formulas.map((formula, index) => (
                      <li key={index}>{formula}</li>
                    ))}
                  </ul>
                </>
              )}

            </div>

            <button className="download-btn" onClick={downloadPDF}>
              Download as PDF
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Notes;