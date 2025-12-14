import { useEffect, useState } from "react";
import { api, apiGet } from "@/lib/api";

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, p] = await Promise.all([api.me(), apiGet("/me/profile", true)]);
        setMe(m);
        setProfile(p);
      } catch (e: any) {
        setErr(e.message);
      }
    })();
  }, []);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!me || !profile) return <p>Loading...</p>;

  const displayName = profile.name || profile.username || profile.email;

  // --- MVP: 先用可用字段/占位数据，把 UI 做到位 ---
  const pathwayTitle = profile.target_role
    ? `${profile.target_role}${profile.target_industry ? ` (${profile.target_industry})` : ""}`
    : "Instructional Designer for AI Tools";

  const v = Number(profile.ai_readiness_score);
  const readinessScore =
    Number.isFinite(v) && v >= 0 ? Math.min(100, Math.max(0, v)) : 65;

  const weeklyDone = 2;
  const weeklyTotal = 5;
  const weeklyPct = Math.round((weeklyDone / weeklyTotal) * 100);

  return (
    <div className="grid2">
      {/* Left main */}
      <div className="sideStack">
        <div className="card">
          <div className="cardHeader">
            <div>
              <h2 className="pageTitle">Hi {displayName}, Welcome Back!</h2>
              <div className="muted">
                Let's make today count for your career transition.
              </div>
            </div>
            <div className="pill">Dashboard</div>
          </div>

          <div className="metricRow">
            <div>
              <div className="metricLabel">Current Pathway</div>
              <div className="metricValue">{pathwayTitle}</div>
            </div>

            <div>
              <div className="metricLabel">Job Readiness Score</div>
              <div className="metricValue">{readinessScore}%</div>
            </div>

            <div>
              <div className="metricLabel">Weekly Goal</div>
              <div className="metricValue">
                {weeklyDone}/{weeklyTotal}
              </div>
              <div className="progressOuter" style={{ marginTop: 8 }}>
                <div
                  className="progressInner"
                  style={{ width: `${weeklyPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Next Steps</div>
          <ul className="list">
            <li>
              <div>
                <div style={{ fontWeight: 700 }}>Resume needs update</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Your resume should reflect your latest goals & skills.
                </div>
              </div>
              <div className="btnRow" style={{ justifyContent: "flex-end" }}>
                <a className="sideButton" href="/profile" style={{ padding: "8px 10px" }}>
                  <strong>Optimize Resume</strong>
                </a>
              </div>
            </li>

            <li>
              <div>
                <div style={{ fontWeight: 700 }}>
                  Continue Module — "Data Literacy for Educators"
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  (MVP placeholder — course module coming next)
                </div>
              </div>
              <div className="btnRow" style={{ justifyContent: "flex-end" }}>
                <a className="sideButton" href="/onboarding/1" style={{ padding: "8px 10px" }}>
                  <strong>Resume Learning</strong>
                </a>
              </div>
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="cardTitle">Skill Gap Analysis</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            (MVP placeholder — will be driven by skills & assessments later)
          </div>
          <div className="barWrap">
            <div className="barCol">
              <h4>Acquired</h4>
              <div style={{ fontWeight: 700 }}>Curriculum Design</div>
              <div className="muted" style={{ fontSize: 12 }}>
                Public Speaking
              </div>
              <div className="progressOuter" style={{ marginTop: 10 }}>
                <div className="progressInner" style={{ width: "72%" }} />
              </div>
            </div>
            <div className="barCol">
              <h4>To Improve</h4>
              <div style={{ fontWeight: 700 }}>AI Fundamentals</div>
              <div className="muted" style={{ fontSize: 12 }}>
                Prompt Engineering
              </div>
              <div className="progressOuter" style={{ marginTop: 10 }}>
                <div className="progressInner" style={{ width: "38%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="sideStack">
        <div className="card">
          <div className="cardTitle">Quick Access</div>
          <div style={{ marginTop: 10 }} className="sideStack">
            <a className="sideButton" href="#">
              <div>
                <strong>Start Mock Interview</strong>
                <div>
                  <span>Coming soon</span>
                </div>
              </div>
              <span>→</span>
            </a>
            <a className="sideButton" href="/profile">
              <div>
                <strong>Resume & Cover Letter Tool</strong>
                <div>
                  <span>Edit your profile & materials</span>
                </div>
              </div>
              <span>→</span>
            </a>
            <a className="sideButton" href="#">
              <div>
                <strong>Daily Career Insight</strong>
                <div>
                  <span>Coming soon</span>
                </div>
              </div>
              <span>→</span>
            </a>
          </div>
        </div>

        <div className="card">
          <div className="cardTitle">Your Snapshot</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <div>
              <span className="muted">Location:</span>{" "}
              {profile.location || "Not set"}
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="muted">Major of Study:</span>{" "}
              {profile.major_of_study || "Not set"}
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="muted">Career Stage:</span>{" "}
              {profile.current_career_stage || "Not set"}
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="muted">Commitment Level:</span>{" "}
              {profile.commitment_level || "Not set"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
