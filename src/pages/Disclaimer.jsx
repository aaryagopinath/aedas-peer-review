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
          width: "min(690px, 100%)",
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
          We want Aedas DXB to be one of the best practices in the Middle
          East.{" "}
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
            We need your honest feedback to improve how we work together. Some
            behaviors and attitudes must change, and your input will help us act
            in the right way.
          </div>

          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "18px",
              lineHeight: 1.75,
            }}
          >
            All responses are confidential. Individual comments will not be
            shared. Feedback will be used to support improvement through
            coaching and training. Please be honest.
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
