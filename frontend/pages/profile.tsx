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

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <h1>User Profile</h1>

      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {/* Top summary card */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem 1.5rem",
          marginBottom: "1.5rem",
          background: "#fafafa",
        }}
      >
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Full Name:</strong> {profile.name ?? "—"}
        </p>
        <p>
          <strong>User Name:</strong> {profile.username ?? "—"}
        </p>
        <p>
          <strong>Headline:</strong> {profile.headline ?? "—"}
        </p>
        <p>
          <strong>Location:</strong> {profile.location ?? "—"}
        </p>
        <p>
          <strong>Major of Study:</strong> {profile.major_of_study ?? "—"}
        </p>
        <p>
          <strong>Current Career Stage:</strong>{" "}
          {profile.current_career_stage ?? "—"}
        </p>
        <p>
          <strong>Commitment Level:</strong> {profile.commitment_level ?? "—"}
        </p>

        <button onClick={() => setEditing((v) => !v)} disabled={saving}>
          {editing ? "Cancel" : "Edit profile"}
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "1rem 1.5rem",
          }}
        >
          <h2>Edit Details</h2>

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
            <button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
