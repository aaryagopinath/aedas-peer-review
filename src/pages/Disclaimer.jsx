import React from "react";

export default function Disclaimer({ user, onStart }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)", // adjust if your navbar height differs
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 70,
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: "#1e1e1e",
          border: "1px solid #333",
          borderRadius: 14,
          padding: 26,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
      >
        <h2
          style={{
            margin: 0,
            textAlign: "center",
            color: "var(--primary)",
            fontWeight: 800,
            letterSpacing: 0.2,
          }}
        >
          Hello {user?.name || "there"}!
        </h2>

        <p
          style={{
            marginTop: 10,
            textAlign: "center",
            color: "#bdbdbd",
            fontSize: "0.95rem",
          }}
        >
          Your feedback is very important to make Aedas Dxb a better working
          place
        </p>

        <hr style={{ borderColor: "#2d2d2d", margin: "18px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ color: "#eaeaea", fontWeight: 800 }}>1. Honesty</div>
            <div style={{ color: "#bdbdbd", marginTop: 4 }}>
              Please be honest
            </div>
          </div>

          <div>
            <div style={{ color: "#eaeaea", fontWeight: 800 }}>2. Growth</div>
            <div style={{ color: "#bdbdbd", marginTop: 4 }}>
              This assessment will help us identify staff that needs to improve
            </div>
          </div>
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 22 }}
        >
          <button
            className="btn"
            onClick={onStart}
            style={{
              padding: "10px 28px",
              borderRadius: 22,
              fontWeight: 800,
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
