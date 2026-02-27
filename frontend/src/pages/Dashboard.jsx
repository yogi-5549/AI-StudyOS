import { useNavigate } from "react-router-dom";
import {
  FaBrain,
  FaCalendarAlt,
  FaYoutube,
  FaStickyNote
} from "react-icons/fa";

import "./Dashboard.css";

function Dashboard({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">AI StudyOS</div>

        <div className="nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span>About</span>
          <span>Contact Us</span>

          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      {/* Feature Cards */}
      <div className="cards-wrapper">

        <div className="card mint" onClick={() => navigate("/doubt")}>
          <FaBrain className="card-icon" />
          <div>AI Doubt Solver</div>
        </div>

        <div className="card peach" onClick={() => navigate("/planner")}>
          <FaCalendarAlt className="card-icon" />
          <div>Smart Exam Planner</div>
        </div>

        <div className="card lavender" onClick={() => navigate("/youtube")}>
          <FaYoutube className="card-icon" />
          <div>YouTube AI Summarizer</div>
        </div>

        <div className="card sky" onClick={() => navigate("/notes")}>
          <FaStickyNote className="card-icon" />
          <div>Smart Revision Notes</div>
        </div>

      </div>

    </div>
  );
}

export default Dashboard;