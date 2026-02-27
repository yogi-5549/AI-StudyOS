import { useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "./Planner.css";
import API_BASE from "../api";

function Planner() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [studyPlan, setStudyPlan] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!subjects || !syllabus || !examDate || !hoursPerDay) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/generate-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjects,
          syllabus,
          exam_date: examDate,
          hours_per_day: parseInt(hoursPerDay),
        }),
      });

      const data = await response.json();

      if (data.plan) {
        setStudyPlan(data.plan);
        setShowModal(true);
      } else {
        alert("Error generating plan");
      }

    } catch (error) {
      alert("Backend connection error");
    }

    setLoading(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AI StudyOS - Smart Exam Plan", 20, 20);

    doc.setFontSize(12);

    let yPosition = 35;

    studyPlan.forEach((item) => {
      doc.text(`Day ${item.day} → ${item.task}`, 20, yPosition);
      yPosition += 8;

      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });

    doc.save("Study_Plan.pdf");
  };

  return (
    <div className="planner-container">

      <nav className="navbar">
        <div className="logo">AI StudyOS</div>
        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span>About</span>
          <span>Contact Us</span>
        </div>
      </nav>

      <div className="planner-wrapper">
        <h1>Smart Exam Planner</h1>

        <div className="planner-card">

          <label>Subjects</label>
          <textarea
            placeholder="Enter subjects"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
          />

          <label>Syllabus Topics (comma separated)</label>
          <textarea
            placeholder="Algebra, Calculus, Optics"
            value={syllabus}
            onChange={(e) => setSyllabus(e.target.value)}
          />

          <label>Exam Date</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />

          <label>Study Hours Per Day</label>
          <input
            type="number"
            placeholder="e.g., 3"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
          />

          <button onClick={handleGenerate} disabled={loading} className="generate-btn">
            {loading ? (
              <div className="spinner"></div>
            ) : (
              "Generate Study Plan"
              )}
              </button>

        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">

            <div className="modal-header">
              <h2>Your Study Plan</h2>
              <button
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              {studyPlan.map((item, index) => (
                <div key={index} className="plan-item">
                  Day {item.day} → {item.task}
                </div>
              ))}
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

export default Planner;