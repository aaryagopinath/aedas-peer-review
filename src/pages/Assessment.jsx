import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const Assessment = ({ reviewer }) => {
  const [colleagues, setColleagues] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [step, setStep] = useState("loading"); // loading, q1, q2, q3, comments, finished, no-cycle
  const [workedWith, setWorkedWith] = useState(null); // q1 highlight

  const [currentReview, setCurrentReview] = useState({
    happy: null,
    answers: [null, null, null],
  });

  const [commentText, setCommentText] = useState("");
  const [finalCommentText, setFinalCommentText] = useState("");
  const FINAL_COMMENT_MAX = 50; // pick something realistic

  const [lastInsertedReviewId, setLastInsertedReviewId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const COMMENT_MAX = 50;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewer]);

  const fetchData = async () => {
    setStep("loading");

    const { data: cycle, error: cycleErr } = await supabase
      .from("assessment_cycles")
      .select("id")
      .eq("status", "Active")
      .single();

    if (cycleErr || !cycle) {
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

    const { data: employees, error: empErr } = await supabase
      .from("employees")
      .select("*")
      .eq("is_active", true)
      .neq("id", reviewer.id)
      .order("name");

    if (empErr) {
      console.error(empErr);
      setStep("finished");
      return;
    }

    const { data: finalRow } = await supabase
      .from("reviewer_cycle_feedback")
      .select("id")
      .eq("cycle_id", cycle.id)
      .eq("reviewer_name", reviewer.name)
      .maybeSingle();

    const employeesList = employees || [];
    const pending = employeesList.filter((e) => !doneIds.has(e.id));
    console.info("Assessment fetchData:", {
      reviewer: reviewer.name,
      totalEmployees: employeesList.length,
      reviewedCount: doneIds.size,
      pendingCount: pending.length,
      pendingNames: pending.map((e) => e.name),
    });
    setColleagues(pending);
    setCurrentIndex(0);

    if (pending.length > 0) {
      setStep("q1");
    } else {
      setStep(finalRow ? "finished" : "final-comments");
    }
  };

  const handleQ1 = (worked) => {
    setWorkedWith(worked);

    // let user see the tint, then move
    setTimeout(() => {
      if (!worked) nextPerson();
      else setStep("q2");
    }, 180);
  };

  const handleQ2 = (happy) => {
    // store answer for tint immediately
    setCurrentReview({ happy, answers: [null, null, null] });

    setTimeout(() => {
      setStep("q3");
    }, 180);
  };

  const toggleQ3 = (index, val) => {
    const newAnswers = [...currentReview.answers];
    newAnswers[index] = val;
    setCurrentReview({ ...currentReview, answers: newAnswers });
  };

  const aspectScore = (answer, happy) => {
    if (answer === null) return 0;
    return happy ? (answer ? 20 : 0) : answer ? 0 : 20;
  };

  const submitReview = async () => {
    const p = colleagues[currentIndex];
    const { happy, answers } = currentReview;

    const tmp_score = aspectScore(answers[0], happy);
    const com_score = aspectScore(answers[1], happy);
    const res_score = aspectScore(answers[2], happy);

    const base = happy ? 40 : 0;
    const total_score = base + tmp_score + com_score + res_score;

    setIsSaving(true);

    const { data, error } = await supabase
      .from("reviews")
      .insert({
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
      })
      .select("id")
      .single();

    setIsSaving(false);

    if (error) {
      console.error(error);
      return;
    }

    setLastInsertedReviewId(data?.id || null);
    // setCommentText("");
    // setStep("comments");
    nextPerson(); // ✅ no comments page per employee
  };

  // const submitCommentAndContinue = async () => {
  //   const text = commentText.trim();
  //   if (!text) {
  //     nextPerson();
  //     return;
  //   }

  //   try {
  //     setIsSaving(true);

  //     if (lastInsertedReviewId) {
  //       const { error } = await supabase
  //         .from("reviews")
  //         .update({ comments: text })
  //         .eq("id", lastInsertedReviewId);

  //       if (error) {
  //         console.warn("Comment update failed:", error);
  //       }
  //     }
  //   } finally {
  //     setIsSaving(false);
  //     nextPerson();
  //   }
  // };

  // const skipCommentAndContinue = () => {
  //   nextPerson();
  // };
  const skipFinalComment = async () => {
    // If “Skip” should still mark reviewer as completed, create row with null.
    setIsSaving(true);

    const { error } = await supabase.from("reviewer_cycle_feedback").upsert(
      {
        cycle_id: activeCycleId,
        reviewer_name: reviewer.name,
        final_comment: null,
      },
      { onConflict: "cycle_id,reviewer_name" },
    );

    setIsSaving(false);

    if (error) {
      console.error(error);
      return;
    }

    setStep("finished");
  };

  const submitFinalComment = async () => {
    const text = finalCommentText.trim();

    setIsSaving(true);

    const { error } = await supabase.from("reviewer_cycle_feedback").upsert(
      {
        cycle_id: activeCycleId,
        reviewer_name: reviewer.name,
        final_comment: text || null,
      },
      { onConflict: "cycle_id,reviewer_name" },
    );

    setIsSaving(false);

    if (error) {
      console.error(error);
      return;
    }

    setStep("finished");
  };

  const nextPerson = () => {
    const newList = [...colleagues];
    newList.splice(currentIndex, 1);
    setColleagues(newList);

    setWorkedWith(null); // ✅ reset Q1 highlight
    setCurrentReview({ happy: null, answers: [null, null, null] });

    setLastInsertedReviewId(null);
    setCommentText("");

    if (newList.length === 0) setStep("final-comments");
    else {
      setStep("q1");
      setCurrentIndex(0);
    }
  };
  // const submitFinalComment = async () => {
  //   const text = finalCommentText.trim();

  //   setIsSaving(true);
  //   const { error } = await supabase.from("reviewer_cycle_feedback").upsert(
  //     {
  //       cycle_id: activeCycleId,
  //       reviewer_name: reviewer.name,
  //       final_comment: text || null,
  //     },
  //     { onConflict: "cycle_id,reviewer_name" },
  //   );

  //   setIsSaving(false);

  //   if (error) {
  //     console.error(error);
  //     return;
  //   }

  //   setStep("finished");
  // };

  if (step === "loading")
    return (
      <div className="page">
        <div className="card empty-state">Loading assessment…</div>
      </div>
    );

  if (step === "no-cycle")
    return (
      <div className="page">
        <div className="card empty-state">
          No active cycle found. Please contact Admin.
        </div>
      </div>
    );

  if (step === "finished")
    return (
      <div className="page">
        <div className="card empty-state">
          <h2 style={{ margin: "0 0 8px" }}>All done!</h2>
          <div style={{ color: "var(--text-muted)" }}>
            You have reviewed everyone in your queue.
          </div>
        </div>
      </div>
    );
  const needsPerson = step === "q1" || step === "q2" || step === "q3";

  let p = null;
  let imgSrc = "";

  if (needsPerson) {
    p = colleagues[currentIndex];

    if (!p) {
      return (
        <div className="page">
          <div className="card empty-state">Loading assessment…</div>
        </div>
      );
    }

    imgSrc = p.image_url?.startsWith("/") ? p.image_url : `/${p.image_url}`;
  }

  const PersonHeader = () => {
    if (!p) return null;
    return (
      <>
        <img className="person-avatar-lg" src={imgSrc} alt={p.name} />
        <h2 className="person-name-lg">{p.name}</h2>
        <div className="person-role-lg">{p.role}</div>
        <div className="question-divider" />
      </>
    );
  };

  const q3Complete = !currentReview.answers.includes(null);

  const q3Labels = currentReview.happy
    ? [
        "Good Attitude / Team Player",
        "Good Communication / Leadership",
        "Strong Skills and Knowledge",
      ]
    : [
        "Negative Attitude / Lack of teamwork",
        "Poor Communication / Weak Leadership",
        "Limited Skills and knowledge",
      ];

  // Helper: shared top section (avatar + name + role)

  return (
    <div className="page">
      <div className="assess-body">
        <div className="step-wrap">
          <div key={step} className="step-panel">
            {step === "q1" && (
              <div className="person-question-card">
                <PersonHeader />

                <h3 className="question-title center">
                  Have you worked with this colleague?
                </h3>

                <div className="choice-row center">
                  <button
                    className={`choice ${workedWith === true ? "selected" : ""}`}
                    onClick={() => handleQ1(true)}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    className={`choice ${workedWith === false ? "selected-no" : ""}`}
                    onClick={() => handleQ1(false)}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {step === "q2" && (
              <div className="person-question-card">
                <PersonHeader />

                <h3 className="question-title center">
                  Did you have a positive experience and good results?
                </h3>

                <div className="choice-row center">
                  <button
                    className={`choice ${currentReview.happy === true ? "selected" : ""}`}
                    onClick={() => handleQ2(true)}
                    type="button"
                  >
                    Yes
                  </button>

                  <button
                    className={`choice ${currentReview.happy === false ? "selected-no" : ""}`}
                    onClick={() => handleQ2(false)}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {step === "q3" && (
              <div className="person-question-card wide">
                <PersonHeader />

                <h3 className="question-title center">Why?</h3>

                <div
                  className="criteria-list"
                  style={{ width: "100%", marginTop: 18 }}
                >
                  {q3Labels.map((label, idx) => (
                    <div key={label} className="criteria-row">
                      <div className="criteria-text">{label}</div>
                      <div className="choice-row">
                        <button
                          type="button"
                          className={`choice ${currentReview.answers[idx] === true ? "selected" : ""}`}
                          onClick={() => toggleQ3(idx, true)}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className={`choice ${currentReview.answers[idx] === false ? "selected-no" : ""}`}
                          onClick={() => toggleQ3(idx, false)}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="actions-row"
                  style={{ justifyContent: "center" }}
                >
                  <button
                    className="btn btn-primary"
                    disabled={!q3Complete || isSaving}
                    onClick={submitReview}
                    type="button"
                  >
                    {isSaving ? "Saving…" : "Submit review"}
                  </button>
                </div>
              </div>
            )}

            {/* {step === "comments" && (
              <div className="person-question-card medium comment-card">
                <PersonHeader />

                <h3 className="question-title center">
                  Additional Comments & Concerns
                </h3>

                <p className="question-help" style={{ textAlign: "center" }}>
                  Is there anything else you would like to share? If there are
                  specific incidents, conflicts, or concerns you have been
                  afraid to raise personally, please write them here. We are
                  listening, and your identity will remain protected.
                </p>

                <textarea
                  className="comment-box"
                  value={commentText}
                  onChange={(e) =>
                    setCommentText(e.target.value.slice(0, COMMENT_MAX))
                  }
                  placeholder="Write your comments here (optional)…"
                  rows={6}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Max {COMMENT_MAX} characters.
                  </div>
                  <div style={{ fontSize: 15, color: "var(--text-muted)" }}>
                    {commentText.length}/{COMMENT_MAX}
                  </div>
                </div>

                <div className="actions-row">
                  <button
                    className="btn btn-secondary"
                    onClick={skipCommentAndContinue}
                    type="button"
                  >
                    Skip
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitCommentAndContinue}
                    disabled={isSaving || commentText.trim().length === 0}
                    type="button"
                  >
                    {isSaving ? "Saving…" : "Continue"}
                  </button>
                </div>
              </div>
            )} */}
            {step === "final-comments" && (
              <div className="person-question-card wide">
                <h3 className="question-title center">
                  Additional Comments & Concerns​
                </h3>

                <p className="question-help" style={{ textAlign: "center" }}>
                  Would you like to add some extra comments ?
                </p>

                <textarea
                  className="comment-box"
                  value={finalCommentText}
                  onChange={(e) =>
                    setFinalCommentText(
                      e.target.value.slice(0, FINAL_COMMENT_MAX),
                    )
                  }
                  // placeholder="Write your final comments here (optional)…"
                  rows={6}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Max {FINAL_COMMENT_MAX} characters.
                  </div>
                  <div style={{ fontSize: 15, color: "var(--text-muted)" }}>
                    {finalCommentText.length}/{FINAL_COMMENT_MAX}
                  </div>
                </div>

                <div
                  className="actions-row"
                  style={{ justifyContent: "center" }}
                >
                  <button
                    className="btn btn-secondary"
                    onClick={skipFinalComment}
                    type="button"
                  >
                    Skip
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitFinalComment}
                    disabled={isSaving || finalCommentText.trim().length === 0}
                    type="button"
                  >
                    {isSaving ? "Saving…" : "Continue"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
