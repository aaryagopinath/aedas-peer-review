import React from "react";

const ScoreCard = ({ employee }) => {
  const { stats, name, role, image_url } = employee;

  const isLow = typeof stats?.ovr === "number" && stats.ovr < 60;
  const color = isLow ? "var(--danger)" : "var(--primary)";

  return (
    <div
      className="fifa-card-border"
      style={{
        width: 190,
        height: 305,
        background: color,
        clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
        padding: 2,
        position: "relative",
        transition: "transform 0.2s",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(180deg, #1a2a2a 0%, #080808 100%)",
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* OVR */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 2,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "2.05rem",
              fontWeight: 900,
              lineHeight: 1,
              color,
            }}
          >
            {stats?.ovr ?? "--"}
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: 1,
              fontWeight: 900,
              opacity: 0.85,
              color,
            }}
          >
            OVR
          </div>
        </div>

        {/* Image area (smaller so ROLE always fits) */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            position: "relative",
            marginTop: 14,
            paddingLeft: 14,
            paddingRight: 14,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 170, // ✅ reduced (was 200)
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={image_url}
              alt={name}
              style={{
                height: 170,
                width: "100%", // ✅ fill width, no fat square
                objectFit: "cover",
                objectPosition: "50% 12%", // ✅ keeps head visible
                filter: "drop-shadow(0px 6px 12px rgba(0,0,0,0.9))",
              }}
            />
          </div>
        </div>

        {/* Bottom */}
        <div style={{ paddingBottom: 16, textAlign: "center", width: "100%" }}>
          <div
            style={{
              fontSize: "1.0rem", // ✅ smaller name
              fontWeight: 900,
              textTransform: "uppercase",
              marginBottom: 3,
              color: "white",
              paddingLeft: 10,
              paddingRight: 10,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>

          <div
            style={{
              width: 22,
              height: 3,
              background: "var(--primary)",
              margin: "0 auto 8px auto",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 18, // ✅ tighter
              marginBottom: 3, // ✅ tighter
            }}
          >
            {[
              ["COM", stats?.com],
              ["TMP", stats?.tmp],
              ["RES", stats?.res],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: "center", minWidth: 50 }}>
                <div
                  style={{
                    fontSize: "0.75rem", // ✅ smaller label
                    fontWeight: 900,
                    letterSpacing: 1,
                    color: "#9a9a9a",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "1.35rem", // ✅ smaller numbers
                    fontWeight: 950,
                    lineHeight: 1.05,
                    color,
                  }}
                >
                  {val ?? "-"}
                </div>
              </div>
            ))}
          </div>

          {/* ROLE (now guaranteed visible) */}
          <div
            style={{
              display: "inline-block",
              background: "#1a1a1a",
              border: "1px solid #333",
              padding: "6px 12px", // ✅ slightly smaller pill
              borderRadius: 12,
              fontSize: "0.5rem",
              fontWeight: 800,
              color: "#ddd",
              textTransform: "uppercase",
              maxWidth: 220,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={role}
          >
            {role || "—"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
