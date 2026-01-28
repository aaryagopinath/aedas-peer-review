// import React, { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabaseClient';
// import ScoreCard from '../components/ScoreCard'; // We will create this small sub-component below
// import { useNavigate } from 'react-router-dom';

// const Scoreboard = () => {
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     loadScores();
//   }, []);

//   const loadScores = async () => {
//     // 1. Get active cycle
//     const { data: cycle } = await supabase.from('assessment_cycles').select('id').eq('status', 'Active').single();
//     if (!cycle) {
//       setLoading(false);
//       return;
//     }

//     // 2. Get Data
//     const { data: emps } = await supabase.from('employees').select('*').eq('is_active', true);
//     const { data: reviews } = await supabase.from('reviews').select('*').eq('cycle_id', cycle.id);

//     // 3. Calculate Scores
//     const scoredEmployees = emps.map(emp => {
//       const myRevs = reviews.filter(r => r.target_employee_id === emp.id);
//       let stats = { ovr: "--", com: "-", tmp: "-", res: "-" };

//       if (myRevs.length > 0) {
//         const avg = Math.round(myRevs.reduce((a, b) => a + b.total_score, 0) / myRevs.length);
//         stats.ovr = avg;
//         // Mock sub-stats based on overall
//         stats.com = avg > 80 ? 90 : (avg > 60 ? 75 : 50);
//         stats.tmp = avg > 80 ? 92 : (avg > 60 ? 70 : 55);
//         stats.res = avg > 80 ? 88 : (avg > 60 ? 72 : 45);
//       }
//       return { ...emp, stats };
//     });

//     setEmployees(scoredEmployees);
//     setLoading(false);
//   };

//   if (loading) return <div style={{marginTop:50}}>Loading Scores...</div>;
//   if (employees.length === 0) return <div style={{marginTop:50}}>No Active Cycle</div>;

//   return (
//     <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 25, padding: 20 }}>
//       {employees.map(emp => (
//             <div onClick={() => navigate(`/employee/${emp.id}`)} style={{ cursor: 'pointer' }}>

//         <ScoreCard key={emp.id} employee={emp} />
//             </div>

//       ))}
//     </div>
//   );
// };

// export default Scoreboard;
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import ScoreCard from "../components/ScoreCard";
import { useNavigate } from "react-router-dom";

const Scoreboard = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLoading(true);

    // 1) Active cycle
    const { data: cycle, error: cycleErr } = await supabase
      .from("assessment_cycles")
      .select("id")
      .eq("status", "Active")
      .single();

    if (cycleErr || !cycle) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    // 2) Employees
    const { data: emps, error: empErr } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true);

    // 3) Reviews for active cycle
    const { data: reviews, error: revErr } = await supabase
      .from("reviews")
      .select("target_employee_id,total_score,com_score,tmp_score,res_score")
      .eq("cycle_id", cycle.id);

    if (empErr || revErr) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const scoredEmployees = (emps || []).map((emp) => {
      const myRevs = (reviews || []).filter(
        (r) => r.target_employee_id === emp.id,
      );

      let stats = { ovr: "--", com: "-", tmp: "-", res: "-" };

      if (myRevs.length > 0) {
        const avgOvr = Math.round(
          myRevs.reduce((a, r) => a + (r.total_score || 0), 0) / myRevs.length,
        );

        // avg 0..20 then *5 to display 0..100
        const avgTo100 = (key) => {
          const avg20 =
            myRevs.reduce((a, r) => a + (r[key] || 0), 0) / myRevs.length;
          return Math.round(avg20 * 5);
        };

        stats.ovr = avgOvr;
        // stats.com = "com_score";
        // stats.tmp = "tmp_score";
        // stats.res = "res_score";
        stats.com = avgTo100("com_score");
        stats.tmp = avgTo100("tmp_score");
        stats.res = avgTo100("res_score");
      }

      return { ...emp, stats };
    });

    setEmployees(scoredEmployees);
    setLoading(false);
  };

  if (loading) return <div style={{ marginTop: 50 }}>Loading Scores...</div>;
  if (employees.length === 0)
    return <div style={{ marginTop: 50 }}>No Active Cycle</div>;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 25,
        padding: 20,
      }}
    >
      {employees.map((emp) => (
        <div
          key={emp.id}
          onClick={() => navigate(`/employee/${emp.id}`)}
          style={{ cursor: "pointer" }}
        >
          <ScoreCard employee={emp} />
        </div>
      ))}
    </div>
  );
};

export default Scoreboard;
