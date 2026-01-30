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
  // Replace the old [bookAnswer, setBookAnswer] line with:
  const [bookAnswers, setBookAnswers] = useState({
    mindset: null,
    moonwalking: null,
  });
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewer]);

  const fetchData = async () => {
    setStep("loading");

    const { data, error } = await supabase.rpc("get_assessment_state", {
      p_reviewer_name: reviewer.name,
      p_reviewer_employee_id: reviewer.id,
    });

    if (error) {
      console.error("get_assessment_state failed:", error);
      setStep("no-cycle");
      return;
    }

    const cycleId = data?.cycle_id;
    if (!cycleId) {
      setStep("no-cycle");
      return;
    }

    // ... inside fetchData ...
    setActiveCycleId(cycleId);

    const { data: feedbackRow, error: fbErr } = await supabase
      .from("reviewer_cycle_feedback")
      .select("read_mindset, read_moonwalking") // <--- Select new columns
      .eq("cycle_id", cycleId)
      .eq("reviewer_name", reviewer.name)
      .maybeSingle();

    if (fbErr) console.warn("feedback fetch failed", fbErr);

    // Set state for both books
    setBookAnswers({
      mindset: feedbackRow?.read_mindset ?? null,
      moonwalking: feedbackRow?.read_moonwalking ?? null,
    });

    // Logic to determine which step to show
    const pending = data?.pending || [];
    setColleagues(pending);
    setCurrentIndex(0);

    if (pending.length > 0) setStep("q1");
    else if (!data?.final_done) setStep("final-comments");
    // Check if BOTH books have an answer (true or false, just not null)
    else if (
      feedbackRow?.read_mindset == null ||
      feedbackRow?.read_moonwalking == null
    )
      setStep("book-question");
    else setStep("finished");
  };

  const handleQ1 = async (worked) => {
    setWorkedWith(worked);

    // If they didn't work with the colleague, persist it immediately.
    if (!worked) {
      const p = colleagues[currentIndex];
      if (!p || !activeCycleId) return;

      try {
        setIsSaving(true);

        const { error } = await supabase.from("reviews").upsert(
          {
            cycle_id: activeCycleId,
            target_employee_id: p.id,
            reviewer_name: reviewer.name,
            worked_with: false,

            // optional: make scores explicit 0
            work_again: null,
            attitude_flag: null,
            comm_flag: null,
            tech_flag: null,
            tmp_score: 0,
            com_score: 0,
            res_score: 0,
            total_score: 0,
          },
          { onConflict: "cycle_id,reviewer_name,target_employee_id" },
        );

        if (error) {
          console.error("Saving Q1=No failed:", error);
          return;
        }

        nextPerson(); // move on
      } finally {
        setIsSaving(false);
      }

      return;
    }

    // If worked == true, continue normal flow
    setTimeout(() => setStep("q2"), 180);
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

  const skipFinalComment = async () => {
    setIsSaving(true);

    const { error } = await supabase.from("reviewer_cycle_feedback").upsert(
      {
        cycle_id: activeCycleId,
        reviewer_name: reviewer.name,
        final_comment: null,
        // keep existing read_book value if already set (don’t overwrite)
      },
      { onConflict: "cycle_id,reviewer_name" },
    );

    setIsSaving(false);
    if (error) {
      console.error(error);
      return;
    }

    setStep("book-question"); // ✅ instead of finished
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

    setStep("book-question"); // ✅ instead of finished
  };

  const nextPerson = () => {
    const newList = [...colleagues];
    newList.splice(currentIndex, 1);
    setColleagues(newList);

    setWorkedWith(null); // ✅ reset Q1 highlight
    setCurrentReview({ happy: null, answers: [null, null, null] });

    setLastInsertedReviewId(null);
    // setCommentText("");

    if (newList.length === 0) setStep("final-comments");
    else {
      setStep("q1");
      setCurrentIndex(0);
    }
  };
  // Helper to update state instantly for UI feedback
  const handleBookClick = (bookKey, val) => {
    setBookAnswers((prev) => ({ ...prev, [bookKey]: val }));
  };

  // Final submit function
  const submitBooks = async () => {
    setIsSaving(true);

    const { error } = await supabase.from("reviewer_cycle_feedback").upsert(
      {
        cycle_id: activeCycleId,
        reviewer_name: reviewer.name,
        read_mindset: bookAnswers.mindset,
        read_moonwalking: bookAnswers.moonwalking,
      },
      { onConflict: "cycle_id,reviewer_name" },
    );

    setIsSaving(false);

    if (error) {
      console.error("Saving books failed:", error);
      return;
    }

    setStep("finished");
  };
  // const submitBookAnswer = async (answer) => {
  //   setBookAnswer(answer); // <-- enables tint immediately
  //   setIsSaving(true);

  //   const { error } = await supabase.from("reviewer_cycle_feedback").upsert(
  //     {
  //       cycle_id: activeCycleId,
  //       reviewer_name: reviewer.name,
  //       read_book: answer,
  //     },
  //     { onConflict: "cycle_id,reviewer_name" },
  //   );

  //   setIsSaving(false);

  //   if (error) {
  //     console.error("Saving book answer failed:", error);
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
          <h2 style={{ margin: "0 0 8px" }}>Thank you!</h2>
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
                    disabled={isSaving}
                    className={`choice ${workedWith === true ? "selected" : ""}`}
                    onClick={() => handleQ1(true)}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    disabled={isSaving}
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
            {step === "book-question" && (
              <div className="person-question-card wide">
                <h3 className="question-title center">
                  Have you read the books we gave out?
                </h3>

                <div className="books-grid">
                  {/* --- Book 1: Mindset --- */}
                  <div className="book-column">
                    <img
                      className="book-cover"
                      src="mindset.png" // Update with your actual path
                      alt="Mindset"
                    />
                    <div className="book-label">Mindset</div>

                    <div className="choice-row center">
                      <button
                        type="button"
                        className={`choice ${bookAnswers.mindset === true ? "selected" : ""}`}
                        onClick={() => handleBookClick("mindset", true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={`choice ${bookAnswers.mindset === false ? "selected-no" : ""}`}
                        onClick={() => handleBookClick("mindset", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* --- Book 2: Moonwalking --- */}
                  <div className="book-column">
                    <img
                      className="book-cover"
                      src="Moonwalking.png" // Update with your actual path
                      alt="Moonwalking"
                    />
                    <div className="book-label">Moonwalking with Einstein</div>

                    <div className="choice-row center">
                      <button
                        type="button"
                        className={`choice ${bookAnswers.moonwalking === true ? "selected" : ""}`}
                        onClick={() => handleBookClick("moonwalking", true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className={`choice ${bookAnswers.moonwalking === false ? "selected-no" : ""}`}
                        onClick={() => handleBookClick("moonwalking", false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                {/* Finish Button */}
                <div
                  className="actions-row"
                  style={{ justifyContent: "center", marginTop: 32 }}
                >
                  <button
                    className="btn btn-primary"
                    onClick={submitBooks}
                    // Disable until BOTH books have an answer (true or false)
                    disabled={
                      isSaving ||
                      bookAnswers.mindset === null ||
                      bookAnswers.moonwalking === null
                    }
                  >
                    {isSaving ? "Saving..." : "Finish Assessment"}
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
