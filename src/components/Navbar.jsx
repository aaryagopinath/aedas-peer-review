import React from "react";

const Navbar = ({ activeTab, setActiveTab, isAdmin }) => {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-brand" role="banner">
          <img src="/LogoPNG.png" alt="AEDAS" className="nav-logo" />
          <div className="nav-titlewrap">
            <div className="nav-title">Aedas Performance Review</div>
            {/* <div className="nav-subtitle">AEDAS DXB</div> */}
          </div>
        </div>

        <nav className="nav-links" aria-label="Primary">
          <button
            className={`nav-link ${activeTab === "assessment" ? "active" : ""}`}
            onClick={() => setActiveTab("assessment")}
            type="button"
          >
            Assessment
          </button>

          {isAdmin && (
            <>
              <button
                className={`nav-link ${activeTab === "reports" ? "active" : ""}`}
                onClick={() => setActiveTab("reports")}
                type="button"
              >
                Reports
              </button>
              <button
                className={`nav-link ${activeTab === "cycles" ? "active" : ""}`}
                onClick={() => setActiveTab("cycles")}
                type="button"
              >
                Cycles
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
