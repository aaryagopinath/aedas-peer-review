// src/pages/EmployeeDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Bar } from "react-chartjs-2";

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [e, c, r] = await Promise.all([
        supabase
          .from("employees")
          .select("id, name, role, image_url")
          .eq("id", id)
          .single(),
        supabase
          .from("assessment_cycles")
          .select("id, name, year, status, created_at")
          .order("year", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("reviews")
          .select(
            "cycle_id,total_score,com_score,tmp_score,res_score,created_at",
          )
          .eq("target_employee_id", id),
      ]);

      if (e.error) {
        setEmployee(null);
        setCycles([]);
        setReviews([]);
        setLoading(false);
        return;
      }

      setEmployee(e.data || null);
      setCycles(c.data || []);
      setReviews(r.data || []);
      setLoading(false);
    };

    load();
  }, [id]);

  // ---------- Helpers ----------
  const cycleById = useMemo(() => {
    const m = new Map();
    (cycles || []).forEach((c) => m.set(String(c.id), c));
    return m;
  }, [cycles]);

  // Aggregate reviews into FY rows:
  // - total_score is already 0..100
  // - com_score/tmp_score/res_score are 0..20, display as 0..100 by *5
  const byYearRowsAsc = useMemo(() => {
    const bucket = {}; // year -> {count,sumOvr,sumCom,sumTmp,sumRes}

    (reviews || []).forEach((rv) => {
      const cyc = cycleById.get(String(rv.cycle_id));
      if (!cyc) return;

      const y = Number(cyc.year);
      if (!bucket[y]) {
        bucket[y] = { count: 0, sumOvr: 0, sumCom: 0, sumTmp: 0, sumRes: 0 };
      }

      bucket[y].count += 1;
      bucket[y].sumOvr += rv.total_score || 0;
      bucket[y].sumCom += rv.com_score || 0; // 0..20
      bucket[y].sumTmp += rv.tmp_score || 0;
      bucket[y].sumRes += rv.res_score || 0;
    });

    const years = Object.keys(bucket)
      .map(Number)
      .sort((a, b) => a - b);

    return years.map((y) => {
      const s = bucket[y];
      const safeDiv = (n) => (s.count ? n / s.count : 0);

      return {
        key: String(y),
        year: y,
        count: s.count,
        ovr: Math.round(safeDiv(s.sumOvr)),
        com: Math.round(safeDiv(s.sumCom) * 5),
        tmp: Math.round(safeDiv(s.sumTmp) * 5),
        res: Math.round(safeDiv(s.sumRes) * 5),
      };
    });
  }, [reviews, cycleById]);

  const byYearRowsDesc = useMemo(() => {
    return byYearRowsAsc.slice().sort((a, b) => b.year - a.year);
  }, [byYearRowsAsc]);

  const currentYearRow = useMemo(() => {
    // Treat most recent FY with data as "CURRENT"
    return byYearRowsAsc.length
      ? byYearRowsAsc[byYearRowsAsc.length - 1]
      : null;
  }, [byYearRowsAsc]);

  const peakRating = useMemo(() => {
    if (!byYearRowsAsc.length) return 0;
    return Math.max(...byYearRowsAsc.map((r) => r.ovr || 0));
  }, [byYearRowsAsc]);

  const yearsActive = useMemo(() => {
    return byYearRowsAsc.length;
  }, [byYearRowsAsc]);

  // ---------- Chart (Yearly rating progression) ----------
  const ratingProgressionChart = useMemo(() => {
    const labels = byYearRowsAsc.map((r) => String(r.year));
    const data = byYearRowsAsc.map((r) => r.ovr);

    return {
      labels,
      datasets: [
        {
          label: "OVR",
          data,
          borderWidth: 0,
          borderRadius: 8,
          barPercentage: 0.75,
          categoryPercentage: 0.7,
        },
      ],
    };
  }, [byYearRowsAsc]);

  const ratingProgressionOptions = useMemo(
    () => ({
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#9aa3ad" },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: "#9aa3ad" },
          grid: { color: "rgba(255,255,255,0.06)" },
        },
      },
    }),
    [],
  );

  // ---------- UI bits ----------
  const imgSrc = employee?.image_url?.startsWith("/")
    ? employee.image_url
    : `/${employee?.image_url || "default.png"}`;

  const StatPill = ({ label, value }) => (
    <div style={{ textAlign: "right" }}>
      <div style={{ color: "#7f8a96", fontSize: 11, letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ color: "var(--primary)", fontSize: 22, fontWeight: 950 }}>
        {value}
      </div>
    </div>
  );

  const AttrBar = ({ label, value }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr 40px",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          color: "#aab3bd",
          fontSize: 12,
          letterSpacing: 1,
          fontWeight: 900,
        }}
      >
        {label}
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`,
            background: "linear-gradient(90deg, #ff4fd8, #ff4fd8)",
            borderRadius: 999,
          }}
        />
      </div>

      <div style={{ color: "#e9eef5", fontWeight: 950, textAlign: "right" }}>
        {Number.isFinite(Number(value)) ? value : "-"}
      </div>
    </div>
  );

  if (loading) return <div style={{ padding: 50 }}>Loading profile...</div>;
  if (!employee) return <div style={{ padding: 50 }}>Employee not found.</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 28,
        background:
          "radial-gradient(1200px 600px at 70% 0%, rgba(0,255,180,0.10), transparent 60%), linear-gradient(180deg, #0b0d10, #07080a)",
        color: "#e9eef5",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* HERO */}
        <div
          style={{
            background:
              "linear-gradient(90deg, rgba(10,12,15,0.92), rgba(10,12,15,0.60))",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            padding: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <img
              src={imgSrc}
              alt=""
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />

            <div>
              <div style={{ color: "#7f8a96", fontSize: 11, letterSpacing: 2 }}>
                HISTORICAL ARCHIVE
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 950,
                  marginTop: 2,
                  lineHeight: 1.1,
                }}
              >
                {employee.name}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginTop: 8,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: 1,
                    fontWeight: 900,
                    padding: "4px 8px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#c7d0db",
                    textTransform: "uppercase",
                  }}
                >
                  {employee.role || "Role"}
                </span>

                <button
                  onClick={() => navigate("/scores")}
                  style={{
                    marginLeft: 2,
                    fontSize: 11,
                    letterSpacing: 1,
                    fontWeight: 900,
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "transparent",
                    color: "#c7d0db",
                    cursor: "pointer",
                  }}
                >
                  Back to Scores
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <StatPill label="PEAK RATING" value={peakRating || "-"} />
            <StatPill label="YEARS ACTIVE" value={yearsActive || "-"} />
          </div>
        </div>

        {/* TWO CARDS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 18,
            marginTop: 18,
          }}
        >
          {/* Rating progression */}
          <div
            style={{
              background: "rgba(15,17,21,0.90)",
              border: "1px solid rgba(0,255,180,0.20)",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 0 0 1px rgba(0,255,180,0.08) inset",
            }}
          >
            <div
              style={{
                color: "#7f8a96",
                fontSize: 11,
                letterSpacing: 2,
                marginBottom: 12,
              }}
            >
              RATING PROGRESSION
            </div>

            <div style={{ height: 260 }}>
              {byYearRowsAsc.length ? (
                <Bar
                  data={ratingProgressionChart}
                  options={ratingProgressionOptions}
                />
              ) : (
                <div style={{ padding: 16, color: "#7f8a96" }}>
                  No yearly data yet.
                </div>
              )}
            </div>
          </div>

          {/* Attribute variance */}
          <div
            style={{
              background: "rgba(15,17,21,0.90)",
              border: "1px solid rgba(255,79,216,0.25)",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 0 0 1px rgba(255,79,216,0.08) inset",
            }}
          >
            <div
              style={{
                color: "#7f8a96",
                fontSize: 11,
                letterSpacing: 2,
                marginBottom: 14,
              }}
            >
              ATTRIBUTE VARIANCE
            </div>

            {currentYearRow ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <AttrBar label="COMMITMENT" value={currentYearRow.com} />
                <AttrBar label="TEAMPLAYER" value={currentYearRow.tmp} />
                <AttrBar label="RESULTS" value={currentYearRow.res} />
              </div>
            ) : (
              <div style={{ padding: 16, color: "#7f8a96" }}>
                No attribute data yet.
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div
          style={{
            marginTop: 18,
            background: "rgba(15,17,21,0.92)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "grid",
              gridTemplateColumns: "240px 120px 120px 120px 120px 1fr",
              gap: 10,
              color: "#7f8a96",
              fontSize: 11,
              letterSpacing: 2,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            <div>Season / Year</div>
            <div>OVR</div>
            <div>COM</div>
            <div>TMP</div>
            <div>RES</div>
            <div></div>
          </div>

          {byYearRowsDesc.length === 0 ? (
            <div style={{ padding: 18, color: "#7f8a96" }}>
              No yearly rows found.
            </div>
          ) : (
            byYearRowsDesc.map((r) => {
              const isCurrent =
                currentYearRow && r.year === currentYearRow.year;

              return (
                <div
                  key={r.key}
                  style={{
                    padding: 14,
                    display: "grid",
                    gridTemplateColumns: "240px 120px 120px 120px 120px 1fr",
                    gap: 10,
                    alignItems: "center",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: isCurrent
                      ? "rgba(0,255,180,0.06)"
                      : "transparent",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ fontWeight: 950 }}>FY {r.year}</div>

                    {isCurrent ? (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 950,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "rgba(0,255,180,0.18)",
                          border: "1px solid rgba(0,255,180,0.25)",
                          color: "#bfffea",
                          letterSpacing: 1,
                        }}
                      >
                        CURRENT
                      </span>
                    ) : null}
                  </div>

                  <div style={{ fontWeight: 950, color: "var(--primary)" }}>
                    {r.ovr}
                  </div>
                  <div style={{ color: "#c7d0db", fontWeight: 900 }}>
                    {r.com}
                  </div>
                  <div style={{ color: "#c7d0db", fontWeight: 900 }}>
                    {r.tmp}
                  </div>
                  <div style={{ color: "#c7d0db", fontWeight: 900 }}>
                    {r.res}
                  </div>

                  <div style={{ color: "#7f8a96", fontSize: 12 }}>
                    Reviews: {r.count}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
