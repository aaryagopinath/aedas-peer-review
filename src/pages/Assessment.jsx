import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const Assessment = ({ reviewer }) => {
  const [colleagues, setColleagues] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [step, setStep] = useState("loading"); // loading, q1, q2, q3, comments, finished, no-cycle

  const [currentReview, setCurrentReview] = useState({
    happy: false,
    answers: [null, null, null],
  });

  // New: comment state
  const [commentText, setCommentText] = useState("");
  const [lastInsertedReviewId, setLastInsertedReviewId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const COMMENT_MAX = 50;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // NEW: Submit review but do NOT go next person yet
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
      // if insert fails, stay on q3
      return;
    }

    setLastInsertedReviewId(data?.id || null);
    setCommentText("");
    setStep("comments"); // slide-in comments next
  };

  // NEW: Save comment (optional), then next person
  const submitCommentAndContinue = async () => {
    // If no comment, just continue
    const text = commentText.trim();
    if (!text) {
      nextPerson();
      return;
    }

    // If you have a "comments" column in "reviews", this will work.
    // If not, it will error. In that case, just skip saving comment and continue.
    try {
      setIsSaving(true);

      if (lastInsertedReviewId) {
        const { error } = await supabase
          .from("reviews")
          .update({ comments: text })
          .eq("id", lastInsertedReviewId);

        if (error) {
          console.warn("No comments column found or update failed:", error);
        }
      }
    } finally {
      setIsSaving(false);
      nextPerson();
    }
  };

  const skipCommentAndContinue = () => {
    nextPerson();
  };

  const nextPerson = () => {
    const newList = [...colleagues];
    newList.splice(currentIndex, 1);
    setColleagues(newList);

    setLastInsertedReviewId(null);
    setCommentText("");

    if (newList.length === 0) setStep("finished");
    else {
      setStep("q1");
      setCurrentIndex(0);
    }
  };

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
          <h2 style={{ margin: "0 0 8px" }}>All done</h2>
          <div style={{ color: "var(--text-muted)" }}>
            You have reviewed everyone in your queue.
          </div>
        </div>
      </div>
    );

  const p = colleagues[currentIndex];
  const q3Complete = !currentReview.answers.includes(null);

  const q3Labels = currentReview.happy
    ? ["Good Attitude", "Effective Communication", "Strong Technical Skills"]
    : ["Poor Attitude", "Poor Communication", "Weak Technical Skills"];

  const imgSrc = p.image_url?.startsWith("/") ? p.image_url : `/${p.image_url}`;

  const total = colleagues.length;

  return (
    <div className="page">
      <div className="card assess-header">
        <div className="person">
          <img className="avatar" src={imgSrc} alt={p.name} />
          <div>
            <h2 className="person-name">{p.name}</h2>
            <div className="person-role">{p.role}</div>
          </div>
        </div>
      </div>

      <div className="assess-body">
        <div className="step-wrap">
          <div key={step} className="step-panel">
            {step === "q1" && (
              <div className="question-card">
                <h3 className="question-title">
                  Have you worked with this colleague?
                </h3>
                <p className="question-help">
                  If you have not collaborated directly, you can skip and move
                  to the next person.
                </p>
                <div className="choice-row">
                  <button
                    className="choice"
                    onClick={() => handleQ1(true)}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    className="choice"
                    onClick={() => handleQ1(false)}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {step === "q2" && (
              <div className="question-card">
                <h3 className="question-title">
                  Would you work with them again?
                </h3>
                <p className="question-help">
                  Choose the option that best reflects your willingness to
                  collaborate in future.
                </p>
                <div className="choice-row">
                  <button
                    className="choice"
                    onClick={() => handleQ2(true)}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    className="choice"
                    onClick={() => handleQ2(false)}
                    type="button"
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {step === "q3" && (
              <div className="question-card">
                <h3 className="question-title">Criteria</h3>
                <p className="question-help">
                  Please answer all three criteria. This section is mandatory.
                </p>
                {/* <p
                  style={{
                    margin: "0 0 14px",
                    color: "var(--text-muted)",
                    fontSize: 13,
                  }}
                >
                  Please answer all three criteria. This section is mandatory.
                </p> */}

                <div className="criteria-list">
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

                <div className="actions-row">
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

            {step === "comments" && (
              <div className="question-card comment-card">
                <h3 className="question-title">
                  Additional Comments & Concerns
                </h3>
                <p className="question-help">
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
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;
