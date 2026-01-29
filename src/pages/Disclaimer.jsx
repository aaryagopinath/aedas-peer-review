import React from "react";

export default function Disclaimer({ user, onStart }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 80,
        paddingLeft: 16,
        paddingRight: 16,
        background: "var(--bg-soft)",
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: "white",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-lg)",
          padding: 32,
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <h2
          style={{
            margin: 0,
            textAlign: "center",
            color: "var(--text-primary)",
            fontWeight: 600,
          }}
        >
          Hello {user?.name || "there"}!
        </h2>

        <p
          style={{
            marginTop: 12,
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Your feedback is very important to making Aedas DXB a better place to
          work.
        </p>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--border-light)",
            margin: "24px 0",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              Anonymity & Confidentiality
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              This assessment is anonymous and confidential. Please be honest.
              We all have room to grow, and your feedback helps identify where
              improvements can be made.
            </div>
          </div>

          <div>
            <div
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            >
              Open Feedback Culture
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                marginTop: 6,
                lineHeight: 1.6,
              }}
            >
              Directors and senior leaders are included in this process as well,
              so please feel free to share your feedback openly and
              constructively.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <button
            className="button-primary"
            onClick={onStart}
            style={{
              padding: "10px 32px",
              borderRadius: 22,
              fontWeight: 500,
            }}
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
