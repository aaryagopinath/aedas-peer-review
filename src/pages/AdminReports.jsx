import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState({
    cycles: [],
    reviews: [],
    employees: [],
  });

  // -- FILTER STATE --
  const [deptFilterType, setDeptFilterType] = useState("cycle"); // 'cycle' or 'year'
  const [deptSelectedId, setDeptSelectedId] = useState(""); // Cycle ID or Year Number

  // --- AUDIT FILTER STATE (NEW) ---
  const [auditSelectedYear, setAuditSelectedYear] = useState("");
  const [auditSelectedCycleId, setAuditSelectedCycleId] = useState("");

  const [trendFilterType, setTrendFilterType] = useState("all-years"); // 'within-year' or 'all-years'
  const [trendSelectedYear, setTrendSelectedYear] = useState(
    new Date().getFullYear(),
  );

  // -- CHART DATA --
  const [deptChartData, setDeptChartData] = useState(null);
  const [trendChartData, setTrendChartData] = useState(null);
  const [auditLogData, setAuditLogData] = useState([]);
  const [auditSort, setAuditSort] = useState("score-desc"); // score-desc | score-asc

  useEffect(() => {
    loadData();
  }, []);

  // Whenever filters change, update charts
  useEffect(() => {
    if (!loading) {
      processDeptChart();
    }
  }, [deptFilterType, deptSelectedId, rawData, loading]);

  useEffect(() => {
    if (!loading) {
      processAuditLog();
    }
  }, [auditSelectedYear, auditSelectedCycleId, rawData, loading, auditSort]);

  useEffect(() => {
    if (!loading) {
      processTrendChart();
    }
  }, [trendFilterType, trendSelectedYear, rawData]);

  const loadData = async () => {
    const r1 = await supabase.from("employees").select("id, name, role");
    const r2 = await supabase.from("reviews").select("*");
    const r3 = await supabase
      .from("assessment_cycles")
      .select("*")
      .order("created_at");

    // Safety check for empty data
    const data = {
      employees: r1.data || [],
      reviews: r2.data || [],
      cycles: r3.data || [],
    };

    setRawData(data);

    // Set Default Filters
    // Set Default Filters
    if (data.cycles.length > 0) {
      const latestCycle = data.cycles[data.cycles.length - 1];

      setDeptSelectedId(latestCycle.id); // Default to latest cycle
      setTrendSelectedYear(latestCycle.year);

      // --- NEW: default audit to latest cycle too ---
      setAuditSelectedYear(latestCycle.year);
      setAuditSelectedCycleId(latestCycle.id);
    }

    setLoading(false);
  };

  // --- 1. DEPARTMENT RANKING LOGIC ---
  const processDeptChart = () => {
    let relevantReviews = [];

    if (deptFilterType === "cycle") {
      // Filter by specific cycle ID
      relevantReviews = rawData.reviews.filter(
        (r) => r.cycle_id == deptSelectedId,
      );
    } else {
      // Filter by Year (Aggregate all cycles in that year)
      const targetYear = parseInt(deptSelectedId);
      const cyclesInYear = rawData.cycles
        .filter((c) => c.year === targetYear)
        .map((c) => c.id);
      relevantReviews = rawData.reviews.filter((r) =>
        cyclesInYear.includes(r.cycle_id),
      );
    }

    // Calculate Averages per Role (Department)
    const roleStats = {};
    relevantReviews.forEach((r) => {
      const target = rawData.employees.find(
        (e) => e.id === r.target_employee_id,
      );
      if (target && target.role) {
        if (!roleStats[target.role])
          roleStats[target.role] = { sum: 0, count: 0 };
        roleStats[target.role].sum += r.total_score;
        roleStats[target.role].count += 1;
      }
    });

    // Format for Chart.js
    const labels = Object.keys(roleStats);
    const data = labels.map((role) =>
      Math.round(roleStats[role].sum / roleStats[role].count),
    );

    // Color Logic: Red if < 50, Teal if >= 50
    const colors = data.map((score) => (score < 50 ? "#ff5252" : "#1de9b6"));

    setDeptChartData({
      labels,
      datasets: [
        {
          label: "Average Score",
          data,
          backgroundColor: colors,
          borderWidth: 1,
        },
      ],
    });
  };

  // --- 2. TREND LINE CHART LOGIC ---
  const processTrendChart = () => {
    let labels = [];
    let data = [];

    if (trendFilterType === "within-year") {
      // Logic: Show cycles Q1, Q2, Q3 for the selected year
      const cyclesInYear = rawData.cycles.filter(
        (c) => c.year == trendSelectedYear,
      );
      labels = cyclesInYear.map((c) => c.name);

      data = cyclesInYear.map((c) => {
        const reviewsInCycle = rawData.reviews.filter(
          (r) => r.cycle_id === c.id,
        );
        if (reviewsInCycle.length === 0) return 0;
        const sum = reviewsInCycle.reduce(
          (acc, curr) => acc + curr.total_score,
          0,
        );
        return Math.round(sum / reviewsInCycle.length);
      });
    } else {
      // Logic: Show Yearly Averages (2024, 2025, 2026...)
      const years = [...new Set(rawData.cycles.map((c) => c.year))].sort();
      labels = years;

      data = years.map((year) => {
        const cyclesInYear = rawData.cycles
          .filter((c) => c.year === year)
          .map((c) => c.id);
        const reviewsInYear = rawData.reviews.filter((r) =>
          cyclesInYear.includes(r.cycle_id),
        );

        if (reviewsInYear.length === 0) return 0;
        const sum = reviewsInYear.reduce(
          (acc, curr) => acc + curr.total_score,
          0,
        );
        return Math.round(sum / reviewsInYear.length);
      });
    }

    setTrendChartData({
      labels,
      datasets: [
        {
          label:
            trendFilterType === "within-year"
              ? `Performance in ${trendSelectedYear}`
              : "Yearly Company Growth",
          data,
          borderColor: "#2979ff",
          backgroundColor: "rgba(41, 121, 255, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    });
  };

  // --- 3. AUDIT LOG LOGIC ---
  // --- 3. AUDIT LOG LOGIC ---
  const processAuditLog = () => {
    if (!auditSelectedCycleId) {
      setAuditLogData([]);
      return;
    }

    const filtered = rawData.reviews
      .filter((r) => r.cycle_id == auditSelectedCycleId)
      .slice(); // avoid mutating rawData

    filtered.sort((a, b) => {
      const sa = a.total_score ?? 0;
      const sb = b.total_score ?? 0;
      return auditSort === "score-asc" ? sa - sb : sb - sa;
    });

    setAuditLogData(filtered);
  };

  if (loading) return <div style={{ padding: 50 }}>Loading Reports...</div>;

  // --- HELPERS FOR DROPDOWNS ---
  const uniqueYears = [...new Set(rawData.cycles.map((c) => c.year))].sort(
    (a, b) => b - a,
  );

  return (
    <div
      style={{
        padding: "12px 14px", // ✅ less side padding
        maxWidth: 1500, // ✅ wider content area
        margin: "0 auto",
        textAlign: "left",
      }}
    >
      <h1 style={{ color: "var(--primary)", marginBottom: 30 }}>
        Admin Reports
      </h1>

      {/* --- CHART 1: DEPT RANKING --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          alignItems: "stretch",
          marginBottom: 16,
        }}
      >
        {/* --- CHART 1: DEPT RANKING --- */}
        <div
          style={{
            background: "#1e1e1e",
            padding: 16,
            borderRadius: 15,
            border: "1px solid #333",
            minHeight: 360,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
              1. Department Performance Ranking
            </h2>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={deptFilterType}
                onChange={(e) => {
                  setDeptFilterType(e.target.value);
                  if (e.target.value === "year")
                    setDeptSelectedId(uniqueYears[0]);
                  else
                    setDeptSelectedId(
                      rawData.cycles[rawData.cycles.length - 1]?.id,
                    );
                }}
                style={{
                  background: "#333",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 5,
                }}
              >
                <option value="cycle">By Cycle</option>
                <option value="year">By Year</option>
              </select>

              <select
                value={deptSelectedId}
                onChange={(e) => setDeptSelectedId(e.target.value)}
                style={{
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #444",
                  padding: "8px 12px",
                  borderRadius: 5,
                }}
              >
                {deptFilterType === "cycle"
                  ? rawData.cycles.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.year})
                      </option>
                    ))
                  : uniqueYears.map((y) => (
                      <option key={y} value={y}>
                        {y} Full Year
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div style={{ height: 280 }}>
            {deptChartData && (
              <Bar
                data={deptChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 100 } },
                }}
              />
            )}
          </div>
        </div>

        {/* --- CHART 2: TREND LINES --- */}
        <div
          style={{
            background: "#1e1e1e",
            padding: 16,
            borderRadius: 15,
            border: "1px solid #333",
            minHeight: 360,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>
              2. Company Performance Trend
            </h2>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                value={trendFilterType}
                onChange={(e) => setTrendFilterType(e.target.value)}
                style={{
                  background: "#333",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: 5,
                }}
              >
                <option value="within-year">Cycle Trend (Within a Year)</option>
                <option value="all-years">Yearly Trend (All Time)</option>
              </select>

              {trendFilterType === "within-year" && (
                <select
                  value={trendSelectedYear}
                  onChange={(e) => setTrendSelectedYear(e.target.value)}
                  style={{
                    background: "#222",
                    color: "#fff",
                    border: "1px solid #444",
                    padding: "8px 12px",
                    borderRadius: 5,
                  }}
                >
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ height: 280 }}>
            {trendChartData && (
              <Line
                data={trendChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, max: 100 } },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* --- 3. AUDIT LOG --- */}
      <h2 style={{ marginBottom: 15 }}>Audit Log (Filtered Data)</h2>
      <div
        style={{
          overflowX: "auto",
          background: "#1e1e1e",
          borderRadius: 10,
          padding: 10,
        }}
      >
        {/* --- 3. AUDIT LOG --- */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
          }}
        >
          <h2 style={{ margin: 0 }}>3. Audit Log</h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* YEAR SELECT */}
            <select
              value={auditSelectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value, 10);
                setAuditSelectedYear(year);

                const cyclesInYear = rawData.cycles.filter(
                  (c) => c.year === year,
                );
                const latestInYear = cyclesInYear[cyclesInYear.length - 1];
                setAuditSelectedCycleId(latestInYear ? latestInYear.id : "");
              }}
              style={{
                background: "#333",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: 5,
              }}
            >
              {uniqueYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {/* CYCLE SELECT */}
            <select
              value={auditSelectedCycleId}
              onChange={(e) => setAuditSelectedCycleId(e.target.value)}
              style={{
                background: "#222",
                color: "#fff",
                border: "1px solid #444",
                padding: "8px 12px",
                borderRadius: 5,
              }}
            >
              {rawData.cycles
                .filter((c) => c.year == auditSelectedYear)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            {/* ✅ SORT SELECT (NEW) */}
            <select
              value={auditSort}
              onChange={(e) => setAuditSort(e.target.value)}
              style={{
                background: "#222",
                color: "#fff",
                border: "1px solid #444",
                padding: "8px 12px",
                borderRadius: 5,
                minWidth: 150,
              }}
            >
              <option value="score-desc">Score: High → Low</option>
              <option value="score-asc">Score: Low → High</option>
            </select>
          </div>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "2px solid #333",
                color: "#888",
                textAlign: "left",
              }}
            >
              <th style={{ padding: 12 }}>Reviewer</th>
              <th style={{ padding: 12 }}>Target Employee</th>
              <th style={{ padding: 12 }}>Details</th>
              <th style={{ padding: 12 }}>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {auditLogData.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{ padding: 20, textAlign: "center", color: "#555" }}
                >
                  No reviews found for this selection.
                </td>
              </tr>
            ) : (
              auditLogData.map((r) => {
                const targetName =
                  rawData.employees.find((e) => e.id === r.target_employee_id)
                    ?.name || "Unknown";
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #333" }}>
                    <td style={{ padding: 12 }}>{r.reviewer_name}</td>
                    <td style={{ padding: 12 }}>{targetName}</td>
                    <td
                      style={{ padding: 12, color: "#aaa", fontSize: "0.8rem" }}
                    >
                      Wait: {r.work_again ? "Y" : "N"} | Att:{" "}
                      {r.attitude_flag ? "Y" : "N"} | Comm:{" "}
                      {r.comm_flag ? "Y" : "N"} | Tech:{" "}
                      {r.tech_flag ? "Y" : "N"}
                    </td>
                    <td
                      style={{
                        padding: 12,
                        fontWeight: "bold",
                        color:
                          r.total_score < 60
                            ? "var(--danger)"
                            : "var(--primary)",
                      }}
                    >
                      {r.total_score}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReports;
