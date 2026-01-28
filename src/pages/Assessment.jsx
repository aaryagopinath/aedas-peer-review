// import React, { useState, useEffect } from "react";
// import { supabase } from "../lib/supabaseClient";

// const Assessment = ({ reviewer }) => {
//   const [colleagues, setColleagues] = useState([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [activeCycleId, setActiveCycleId] = useState(null);
//   const [step, setStep] = useState("loading"); // loading, q1, q2, q3, finished
//   const [currentReview, setCurrentReview] = useState({
//     happy: false,
//     answers: [null, null, null],
//   });

//   useEffect(() => {
//     fetchData();
//   }, [reviewer]);

//   const fetchData = async () => {
//     // 1. Get Active Cycle
//     const { data: cycle } = await supabase
//       .from("assessment_cycles")
//       .select("id")
//       .eq("status", "Active")
//       .single();

//     if (!cycle) {
//       setStep("no-cycle");
//       return;
//     }
//     setActiveCycleId(cycle.id);

//     // 2. Get Completed Reviews
//     const { data: reviews } = await supabase
//       .from("reviews")
//       .select("target_employee_id")
//       .eq("cycle_id", cycle.id)
//       .eq("reviewer_name", reviewer.name);

//     const doneIds = new Set(
//       reviews ? reviews.map((r) => r.target_employee_id) : [],
//     );

//     // 3. Get Colleagues
//     const { data: employees } = await supabase
//       .from("employees")
//       .select("*")
//       .eq("is_active", true)
//       .neq("id", reviewer.id)
//       .order("name");

//     if (employees) {
//       const pending = employees.filter((e) => !doneIds.has(e.id));
//       setColleagues(pending);
//       if (pending.length > 0) setStep("q1");
//       else setStep("finished");
//     }
//   };

//   const handleQ1 = (worked) => {
//     if (!worked) {
//       nextPerson();
//     } else {
//       setStep("q2");
//     }
//   };

//   const handleQ2 = (happy) => {
//     setCurrentReview({ happy, answers: [null, null, null] });
//     setStep("q3");
//   };

//   const toggleQ3 = (index, val) => {
//     const newAnswers = [...currentReview.answers];
//     newAnswers[index] = val;
//     setCurrentReview({ ...currentReview, answers: newAnswers });
//   };

//   const submitReview = async () => {
//     const p = colleagues[currentIndex];
//     const { happy, answers } = currentReview;

//     // Scoring Logic:
//     // If Happy (Yes): Base 40 + (20 per "Yes" on good traits)
//     // If Unhappy (No): Base 0 + (20 per "No" on bad traits - denying a bad trait is good)
//     let score = happy ? 40 : 0;

//     const pts = (answer, isHappy) => {
//       if (answer === null) return 0;
//       // If Happy, YES = 20pts
//       // If Unhappy, NO = 20pts (because saying NO to "Bad Attitude" is good)
//       return isHappy ? (answer ? 20 : 0) : answer ? 0 : 20;
//     };

//     score +=
//       pts(answers[0], happy) + pts(answers[1], happy) + pts(answers[2], happy);

//     await supabase.from("reviews").insert({
//       cycle_id: activeCycleId,
//       target_employee_id: p.id,
//       reviewer_name: reviewer.name,
//       work_again: happy,
//       attitude_flag: answers[0],
//       comm_flag: answers[1],
//       tech_flag: answers[2],
//       total_score: score,
//     });

//     nextPerson();
//   };

//   const nextPerson = () => {
//     const newList = [...colleagues];
//     newList.splice(currentIndex, 1);
//     setColleagues(newList);

//     if (newList.length === 0) setStep("finished");
//     else {
//       setStep("q1");
//       setCurrentIndex(0);
//     }
//   };

//   // --- RENDER HELPERS ---
//   if (step === "loading")
//     return <div style={{ marginTop: 50 }}>Loading Assessment...</div>;
//   if (step === "no-cycle")
//     return (
//       <div style={{ marginTop: 50 }}>
//         No Active Cycle Found. Please contact Admin.
//       </div>
//     );
//   if (step === "finished")
//     return (
//       <div className="input-card">
//         <h1>All Done!</h1>
//         <p>You have reviewed everyone in your queue.</p>
//       </div>
//     );

//   const p = colleagues[currentIndex];
//   const q3Complete = !currentReview.answers.includes(null);

//   // --- DYNAMIC LABELS LOGIC ---
//   const q3Labels = currentReview.happy
//     ? ["Good Attitude", "Effective Comm.", "Strong Tech"]
//     : ["Bad Attitude", "Poor Comm.", "Weak Tech"];

//   return (
//     <div className="input-card">
//       <div className="profile-img-wrap">
//         <img
//           src={p.image_url?.startsWith("/") ? p.image_url : `/${p.image_url}`}
//           alt="Profile"
//           className="profile-img"
//         />
//       </div>
//       <h2>{p.name}</h2>
//       <p style={{ color: "var(--text-dim)" }}>{p.role}</p>
//       <hr style={{ borderColor: "#333", margin: "20px 0" }} />

//       {step === "q1" && (
//         <>
//           <h3>Have you worked with them?</h3>
//           <button className="btn" onClick={() => handleQ1(true)}>
//             YES
//           </button>
//           <button className="btn secondary" onClick={() => handleQ1(false)}>
//             NO
//           </button>
//         </>
//       )}

//       {step === "q2" && (
//         <>
//           <h3>Would you work with them again?</h3>
//           <button className="btn" onClick={() => handleQ2(true)}>
//             YES
//           </button>
//           <button className="btn secondary" onClick={() => handleQ2(false)}>
//             NO
//           </button>
//         </>
//       )}

//       {step === "q3" && (
//         <>
//           <h3>Why?</h3>
//           <div style={{ textAlign: "left" }}>
//             {q3Labels.map((label, idx) => (
//               <div
//                 key={idx}
//                 style={{
//                   display: "flex",
//                   justifyContent: "space-between",
//                   margin: "10px 0",
//                   background: "#2a2a2a",
//                   padding: 10,
//                   borderRadius: 8,
//                 }}
//               >
//                 <span style={{ fontWeight: "bold", alignSelf: "center" }}>
//                   {label}
//                 </span>
//                 <div>
//                   <button
//                     className={`btn-sm ${currentReview.answers[idx] === true ? "btn-start" : ""}`}
//                     style={{
//                       border: "1px solid #555",
//                       borderRadius: 15,
//                       cursor: "pointer",
//                       background:
//                         currentReview.answers[idx] === true
//                           ? "var(--primary)"
//                           : "transparent",
//                       color:
//                         currentReview.answers[idx] === true ? "black" : "#777",
//                     }}
//                     onClick={() => toggleQ3(idx, true)}
//                   >
//                     YES
//                   </button>
//                   <button
//                     className={`btn-sm ${currentReview.answers[idx] === false ? "btn-stop" : ""}`}
//                     style={{
//                       border: "1px solid #555",
//                       borderRadius: 15,
//                       cursor: "pointer",
//                       marginLeft: 5,
//                       background:
//                         currentReview.answers[idx] === false
//                           ? "var(--danger)"
//                           : "transparent",
//                       color:
//                         currentReview.answers[idx] === false ? "white" : "#777",
//                     }}
//                     onClick={() => toggleQ3(idx, false)}
//                   >
//                     NO
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <button
//             className="btn"
//             style={{
//               width: "100%",
//               marginTop: 20,
//               opacity: q3Complete ? 1 : 0.3,
//             }}
//             disabled={!q3Complete}
//             onClick={submitReview}
//           >
//             Submit Review
//           </button>
//         </>
//       )}
//     </div>
//   );
// };

// export default Assessment;
// src/pages/Assessment.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const Assessment = ({ reviewer }) => {
  const [colleagues, setColleagues] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [step, setStep] = useState("loading"); // loading, q1, q2, q3, finished
  const [currentReview, setCurrentReview] = useState({
    happy: false,
    answers: [null, null, null],
  });

  useEffect(() => {
    fetchData();
  }, [reviewer]);

  const fetchData = async () => {
    const { data: cycle } = await supabase
      .from("assessment_cycles")
      .select("id")
      .eq("status", "Active")
      .single();

    if (!cycle) {
      setStep("no-cycle");
      return;
    }
    setActiveCycleId(cycle.id);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("target_employee_id")
      .eq("cycle_id", cycle.id)
      .eq("reviewer_name", reviewer.name);

    const doneIds = new Set(
      reviews ? reviews.map((r) => r.target_employee_id) : [],
    );

    const { data: employees } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .neq("id", reviewer.id)
      .order("name");

    if (employees) {
      const pending = employees.filter((e) => !doneIds.has(e.id));
      setColleagues(pending);
      if (pending.length > 0) setStep("q1");
      else setStep("finished");
    }
  };

  const handleQ1 = (worked) => {
    if (!worked) nextPerson();
    else setStep("q2");
  };

  const handleQ2 = (happy) => {
    setCurrentReview({ happy, answers: [null, null, null] });
    setStep("q3");
  };

  const toggleQ3 = (index, val) => {
    const newAnswers = [...currentReview.answers];
    newAnswers[index] = val;
    setCurrentReview({ ...currentReview, answers: newAnswers });
  };

  // Stored sub-scores: 0 or 20 each
  const aspectScore = (answer, happy) => {
    if (answer === null) return 0;
    return happy ? (answer ? 20 : 0) : answer ? 0 : 20;
  };

  const submitReview = async () => {
    const p = colleagues[currentIndex];
    const { happy, answers } = currentReview;

    const tmp_score = aspectScore(answers[0], happy); // attitude_flag
    const com_score = aspectScore(answers[1], happy); // comm_flag
    const res_score = aspectScore(answers[2], happy); // tech_flag

    const base = happy ? 40 : 0;
    const total_score = base + tmp_score + com_score + res_score;

    await supabase.from("reviews").insert({
      cycle_id: activeCycleId,
      target_employee_id: p.id,
      reviewer_name: reviewer.name,
      work_again: happy,
      attitude_flag: answers[0],
      comm_flag: answers[1],
      tech_flag: answers[2],
      tmp_score,
      com_score,
      res_score,
      total_score,
    });

    nextPerson();
  };

  const nextPerson = () => {
    const newList = [...colleagues];
    newList.splice(currentIndex, 1);
    setColleagues(newList);

    if (newList.length === 0) setStep("finished");
    else {
      setStep("q1");
      setCurrentIndex(0);
    }
  };

  if (step === "loading")
    return <div style={{ marginTop: 50 }}>Loading Assessment...</div>;
  if (step === "no-cycle")
    return (
      <div style={{ marginTop: 50 }}>
        No Active Cycle Found. Please contact Admin.
      </div>
    );
  if (step === "finished")
    return (
      <div className="input-card">
        <h1>All Done!</h1>
        <p>You have reviewed everyone in your queue.</p>
      </div>
    );

  const p = colleagues[currentIndex];
  const q3Complete = !currentReview.answers.includes(null);

  const q3Labels = currentReview.happy
    ? ["Good Attitude", "Effective Comm.", "Strong Tech"]
    : ["Bad Attitude", "Poor Comm.", "Weak Tech"];

  const imgSrc = p.image_url?.startsWith("/") ? p.image_url : `/${p.image_url}`;

  return (
    <div className="input-card">
      <div className="profile-img-wrap">
        <img src={imgSrc} alt="Profile" className="profile-img" />
      </div>

      <h2>{p.name}</h2>
      <p style={{ color: "var(--text-dim)" }}>{p.role}</p>
      <hr style={{ borderColor: "#333", margin: "20px 0" }} />

      {step === "q1" && (
        <>
          <h3>Have you worked with them?</h3>
          <button className="btn" onClick={() => handleQ1(true)}>
            YES
          </button>
          <button className="btn secondary" onClick={() => handleQ1(false)}>
            NO
          </button>
        </>
      )}

      {step === "q2" && (
        <>
          <h3>Would you work with them again?</h3>
          <button className="btn" onClick={() => handleQ2(true)}>
            YES
          </button>
          <button className="btn secondary" onClick={() => handleQ2(false)}>
            NO
          </button>
        </>
      )}

      {step === "q3" && (
        <>
          <h3>Why?</h3>
          <div style={{ textAlign: "left" }}>
            {q3Labels.map((label, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  margin: "10px 0",
                  background: "#2a2a2a",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <span style={{ fontWeight: "bold", alignSelf: "center" }}>
                  {label}
                </span>
                <div>
                  <button
                    className="btn-sm"
                    style={{
                      border: "1px solid #555",
                      borderRadius: 15,
                      cursor: "pointer",
                      background:
                        currentReview.answers[idx] === true
                          ? "var(--primary)"
                          : "transparent",
                      color:
                        currentReview.answers[idx] === true ? "black" : "#777",
                    }}
                    onClick={() => toggleQ3(idx, true)}
                  >
                    YES
                  </button>
                  <button
                    className="btn-sm"
                    style={{
                      border: "1px solid #555",
                      borderRadius: 15,
                      cursor: "pointer",
                      marginLeft: 5,
                      background:
                        currentReview.answers[idx] === false
                          ? "var(--danger)"
                          : "transparent",
                      color:
                        currentReview.answers[idx] === false ? "white" : "#777",
                    }}
                    onClick={() => toggleQ3(idx, false)}
                  >
                    NO
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn"
            style={{
              width: "100%",
              marginTop: 20,
              opacity: q3Complete ? 1 : 0.3,
            }}
            disabled={!q3Complete}
            onClick={submitReview}
          >
            Submit Review
          </button>
        </>
      )}
    </div>
  );
};

export default Assessment;
