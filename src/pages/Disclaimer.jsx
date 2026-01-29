import React from "react";

export default function Disclaimer({ user, onStart }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 100,
        paddingLeft: 20,
        paddingRight: 20,
        background: "var(--bg-soft)",
      }}
    >
      <div
        style={{
          width: "min(680px, 100%)",
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: 44,
          boxShadow: "var(--shadow)",
        }}
      >
        <h2
          style={{
            margin: 0,
            textAlign: "center",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: "26px",
          }}
        >
          Hello {user?.name || "there"}!
        </h2>

        <p
          style={{
            marginTop: 16,
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "18px",
            fontWeight: "Bold",
            lineHeight: 1.7,
          }}
        >
          Your feedback is very important to make Aedas DXB a better place.
        </p>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--border)",
            margin: "32px 0",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "18px",
              lineHeight: 1.75,
            }}
          >
            Please be honest—this is confidential. We all have room to grow.
            This assessment helps identify where improvements can be made.
          </div>

          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "18px",
              lineHeight: 1.75,
            }}
          >
            Directors and senior leaders are included as well, so please feel
            free to speak openly.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 44,
          }}
        >
          <button
            className="btn btn-primary"
            onClick={onStart}
            style={{
              padding: "14px 42px",
              borderRadius: 28,
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
