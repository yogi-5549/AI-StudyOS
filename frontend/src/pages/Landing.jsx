import { useNavigate } from "react-router-dom";
import "./Landing.css";

function Landing({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  return (
    <div className="landing-container">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">AI StudyOS</div>

        <div className="nav-links">
          <span>Home</span>
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

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-left">
          <h4 className="sub-heading">Learn Smarter with AI</h4>

          <h1 className="main-heading">
            Your Personal Study
            <br />
            Operating System
          </h1>

          <p className="description">
            Boost your academic success with intelligent and personalized AI
            tools designed to help you study, plan, and revise smarter.
          </p>

          <button
            className="cta-button"
            onClick={() => navigate("/dashboard")}
          >
            Let’s Get Started →
          </button>
        </div>

        <div className="hero-right">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135755.png"
            alt="Student"
          />
        </div>
      </div>

    </div>
  );
}

export default Landing;