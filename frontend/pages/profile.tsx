// frontend/pages/profile.tsx
import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { useRouter } from "next/router";

type Profile = {
  email: string;
  name?: string | null;
  username?: string | null;

  headline?: string | null;
  location?: string | null;
  major_of_study?: string | null;
  current_career_stage?: string | null;
  commitment_level?: string | null;

  date_of_birth?: string | null;
  about_you?: string | null;
  interested_work_professions?: string | null;
  goals_objectives?: string | null;
  learning_progress?: string | null;
  learning_achievement?: string | null;

  country?: string | null;
  state?: string | null;
  current_city?: string | null;
  visa?: string | null;

  target_role?: string | null;
  target_industry?: string | null;
  years_experience?: number | null;
  learning_style?: string | null;
  ai_readiness_score?: number | null;
  about_me?: string | null;
};

const MAJOR_OPTIONS = [
  "Early Childhood Education",
  "K–12 Education Teaching (Teacher Education)",
  "Higher Education Administration",
  "Special Education",
  "Education Technology",
  "Non-profit / Social Work",
  "Professional Counseling",
  "Education Entrepreneurship",
  "Education Policy",
  "Data Analytics",
];

const CAREER_STAGE_OPTIONS = [
  "Student",
  "Recent Graduate (less than 2 years out)",
  "Early Career (2–5 years experience)",
  "Mid-Career (6–15 years experience)",
  "Experienced Professional (15+ years experience)",
  "Looking to Re-enter Workforce",
];

const WEEKLY_TIME_OPTIONS = [
  "0-2 hours",
  "3-5 hours",
  "6-10 hours",
  "10+ hours",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const p = await apiGet("/me/profile", true);
        setProfile(p);
        setDraft(p);
      } catch (e: any) {
        setErr(e.message ?? "Failed to load profile");
        if (e.message?.includes("401")) {
          router.push("/login");
        }
      }
    })();
  }, [router]);

  const onChange = (field: keyof Profile, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setErr(null);
    try {
      const payload: any = { ...draft };
      // 后端接受 ISO 日期字符串；空字符串转成 undefined
      if (payload.date_of_birth === "") payload.date_of_birth = undefined;
      const updated = await apiPut("/me/profile", payload, true);
      setProfile(updated);
      setDraft(updated);
      setEditing(false);
    } catch (e: any) {
      setErr(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!profile || !draft) {
    return <p>Loading…</p>;
  }

  const displayName = profile.name || profile.username || profile.email;
  const initials = (displayName || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const headline =
    profile.headline ||
    `${profile.major_of_study ? `${profile.major_of_study} ` : ""}${
      profile.current_career_stage ? `${profile.current_career_stage} ` : ""
    }${profile.target_role ? `| Aspiring ${profile.target_role}` : ""}`.trim() ||
    "Aspiring Professional";

  const locationText = profile.location || [profile.current_city, profile.state].filter(Boolean).join(", ") || "—";

  return (
    <div style={{ maxWidth: 1120, margin: "24px auto", padding: "0 12px" }}>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* Header card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="cardHeader">
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "linear-gradient(135deg, rgba(79,70,229,.25), rgba(45,212,191,.25))",
                border: "1px solid rgba(0,0,0,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
              }}
              aria-label="avatar"
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
                {displayName}
              </div>
              <div className="muted" style={{ marginTop: 4 }}>
                {headline}
              </div>
              <div className="muted" style={{ marginTop: 2, fontSize: 13 }}>
                {locationText}
              </div>
            </div>
          </div>

          <button
            className="btnGhost"
            onClick={() => setEditing((v) => !v)}
            disabled={saving}
            title="Edit"
            aria-label="edit"
            style={{ fontSize: 18, marginTop: 0 }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Body layout: left content + right learning profile */}
      <div className="grid2" style={{ gridTemplateColumns: "1fr 360px" }}>
        <div className="sideStack">
          <div className="card">
            <div className="cardTitle">About Me</div>
            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              {profile.about_you || profile.about_me || (
                <span className="muted">Add a short introduction about yourself.</span>
              )}
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Details</div>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              <div>
                <span className="muted">User Name:</span> {profile.username || "—"}
              </div>
              <div>
                <span className="muted">Date of Birth:</span>{" "}
                {profile.date_of_birth || "—"}
              </div>
              <div>
                <span className="muted">Major of Study:</span>{" "}
                {profile.major_of_study || "—"}
              </div>
              <div>
                <span className="muted">Interested Professions:</span>{" "}
                {profile.interested_work_professions || "—"}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Goals</div>
            <div style={{ marginTop: 8, lineHeight: 1.5 }}>
              {profile.goals_objectives || (
                <span className="muted">Add your goals/objectives to personalize recommendations.</span>
              )}
            </div>
          </div>

          {/* Edit form (expand under cards) */}
          {editing && (
            <div className="card">
              <div className="cardHeader">
                <div>
                  <div className="cardTitle">Edit Profile</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    Save will update your profile immediately.
                  </div>
                </div>
                <button
                  className="btnGhost"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  style={{ marginTop: 0 }}
                >
                  Close
                </button>
              </div>

          <label>Date of Birth</label>
          <input
            type="date"
            value={draft.date_of_birth ?? ""}
            onChange={(e) => onChange("date_of_birth", e.target.value)}
          />

          <label>Headline</label>
          <input
            placeholder="Short tagline about you"
            value={draft.headline ?? ""}
            onChange={(e) => onChange("headline", e.target.value)}
          />

          <label>About you</label>
          <textarea
            value={draft.about_you ?? ""}
            onChange={(e) => onChange("about_you", e.target.value)}
          />

          {/* Major of Study (select) */}
          <label>Major of Study</label>
          <select
            value={draft.major_of_study ?? ""}
            onChange={(e) => onChange("major_of_study", e.target.value || null)}
          >
            <option value="">Select…</option>
            {MAJOR_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <label>Interested work professions</label>
          <textarea
            value={draft.interested_work_professions ?? ""}
            onChange={(e) =>
              onChange("interested_work_professions", e.target.value)
            }
          />

          <label>Goals / Objectives</label>
          <textarea
            value={draft.goals_objectives ?? ""}
            onChange={(e) => onChange("goals_objectives", e.target.value)}
          />

          <label>Learning progress</label>
          <textarea
            value={draft.learning_progress ?? ""}
            onChange={(e) => onChange("learning_progress", e.target.value)}
          />

          <label>Learning achievement</label>
          <textarea
            value={draft.learning_achievement ?? ""}
            onChange={(e) =>
              onChange("learning_achievement", e.target.value)
            }
          />

          {/* Commitment level (weekly time) */}
          <label>Commitment level</label>
          <select
            value={draft.commitment_level ?? ""}
            onChange={(e) =>
              onChange("commitment_level", e.target.value || null)
            }
          >
            <option value="">Select…</option>
            {WEEKLY_TIME_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Current career stage */}
          <label>Current career stage</label>
          <select
            value={draft.current_career_stage ?? ""}
            onChange={(e) =>
              onChange("current_career_stage", e.target.value || null)
            }
          >
            <option value="">Select…</option>
            {CAREER_STAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <label>Country / State / City</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ flex: 1 }}
              placeholder="Country"
              value={draft.country ?? ""}
              onChange={(e) => onChange("country", e.target.value)}
            />
            <input
              style={{ flex: 1 }}
              placeholder="State"
              value={draft.state ?? ""}
              onChange={(e) => onChange("state", e.target.value)}
            />
            <input
              style={{ flex: 1 }}
              placeholder="City"
              value={draft.current_city ?? ""}
              onChange={(e) => onChange("current_city", e.target.value)}
            />
          </div>

          <label>Visa</label>
          <input
            placeholder="none / F1 / H1B…"
            value={draft.visa ?? ""}
            onChange={(e) => onChange("visa", e.target.value)}
          />

          <label>Preferred learning style</label>
          <input
            value={draft.learning_style ?? ""}
            onChange={(e) => onChange("learning_style", e.target.value)}
          />

          <label>Target industry</label>
          <input
            value={draft.target_industry ?? ""}
            onChange={(e) => onChange("target_industry", e.target.value)}
          />

          <label>Target role</label>
          <input
            value={draft.target_role ?? ""}
            onChange={(e) => onChange("target_role", e.target.value)}
          />

          <label>Years of experience</label>
          <input
            type="number"
            min={0}
            value={draft.years_experience ?? ""}
            onChange={(e) =>
              onChange(
                "years_experience",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />

          <label>AI readiness score</label>
          <input
            type="number"
            value={draft.ai_readiness_score ?? ""}
            onChange={(e) =>
              onChange(
                "ai_readiness_score",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />

          <label>Additional notes</label>
          <textarea
            value={draft.about_me ?? ""}
            onChange={(e) => onChange("about_me", e.target.value)}
          />

          <div style={{ marginTop: 16 }}>
            <button className="btnPrimary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
            </div>
          )}
        </div>

        <div className="sideStack">
          <div className="card">
            <div className="cardTitle">Learning Profile</div>
            <div style={{ marginTop: 10 }}>
              <div>
                <span className="muted">Current Level:</span>{" "}
                {profile.learning_progress || "Phase 2"}
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Badges
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["AI Literacy", "Resume", "Interview", "Networking"].map((b) => (
                    <div
                      key={b}
                      title={b}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,.10)",
                        background: "rgba(79,70,229,.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#3730a3",
                        textAlign: "center",
                        padding: 6,
                      }}
                    >
                      {b.split(" ").map((w) => w[0]).join("")}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <span className="muted">Commitment Level:</span>{" "}
                {profile.commitment_level || "—"}
              </div>

              {profile.learning_achievement && (
                <div style={{ marginTop: 10, lineHeight: 1.5 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Achievements
                  </div>
                  <div style={{ marginTop: 4 }}>{profile.learning_achievement}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
