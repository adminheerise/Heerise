import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/router";

export default function Step() {
  const router = useRouter();
  const step = parseInt((router.query.step as string) || "1", 10);
  const [flow, setFlow] = useState<any>(null);
  const [qs, setQs] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [answer, setAnswer] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const f = await api.currentFlow(); setFlow(f);
        const list = await api.questions(f.id); setQs(list);
      } catch (e: any) { setErr(e.message); }
    })();
  }, []);

  if (err) return <p style={{ color: "crimson" }}>{err}</p>;
  if (!qs.length) return <p>Loading...</p>;

  const q = qs[step - 1];
  if (!q) return <p>No such step.</p>;

  const isSkills = q.code === "top_skills";

  const toggleMulti = (val: string) => {
    const prev = new Set(answer.values || []);
    if (prev.has(val)) prev.delete(val); else {
      if (isSkills && prev.size >= 5) {
        alert("Please select up to 5 skills.");
        return;
      }
      prev.add(val);
    }
    setAnswer({ values: Array.from(prev), other: answer.other || "" });
  };

  const next = async () => {
    try {
      await api.saveAnswer(q.id, answer);
      if (step < qs.length) router.push(`/onboarding/${step + 1}`);
      else {
        await api.completeOnboarding();
        router.push("/dashboard");
      }
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto", padding: "0 12px" }}>
      <h2>Onboarding ({step}/{qs.length})</h2>
      <h3 style={{ marginTop: 8 }}>{q.label}</h3>

      {/* short_text */}
      {q.type === "short_text" && (
        <>
          <label>Your answer</label>
          <input
            onChange={(e) => setAnswer({ text: e.target.value })}
            style={{ display: "block", width: "100%", marginTop: 6 }}
          />
        </>
      )}

      {/* single_choice */}
      {q.type === "single_choice" && (
        <>
          <select
            defaultValue=""
            onChange={(e) => setAnswer({ value: e.target.value })}
            style={{ marginTop: 6 }}
          >
            <option value="" disabled>-- choose --</option>
            {q.options.map((o: any) => (
              <option key={o.id} value={o.value}>{o.label}</option>
            ))}
          </select>
          {/* “Other” 额外文本 */}
          {answer?.value?.toLowerCase?.().includes("other") && (
            <div style={{ marginTop: 8 }}>
              <input
                placeholder="Please specify"
                onChange={(e) => setAnswer({ ...answer, other: e.target.value })}
                style={{ width: "100%" }}
              />
            </div>
          )}
        </>
      )}

      {/* multi_choice */}
      {q.type === "multi_choice" && (
        <div style={{ marginTop: 6 }}>
          {q.options.map((o: any) => {
            const checked = (answer.values || []).includes(o.value);
            return (
              <label key={o.id} style={{ display: "block", margin: "6px 0" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMulti(o.value)}
                />{" "}
                {o.label}
              </label>
            );
          })}
          {/* 选了 Other/Not sure 时给一个自由文本 */}
          {((answer.values || []).some((v: string) => v.toLowerCase().includes("other"))
            || (answer.values || []).some((v: string) => v.toLowerCase().startsWith("not sure"))) && (
              <div style={{ marginTop: 8 }}>
                <input
                  placeholder="Tell us more..."
                  value={answer.other || ""}
                  onChange={(e) => setAnswer({ ...answer, other: e.target.value })}
                  style={{ width: "100%" }}
                />
              </div>
            )}
          {isSkills && (
            <div style={{ color: "#666", marginTop: 6 }}>
              You can select up to 5 skills. Selected: {(answer.values || []).length}
            </div>
          )}
        </div>
      )}

      {/* scale（保留，可不触发） */}
      {q.type === "scale" && (
        <>
          <label>Years</label>
          <input
            type="number"
            min={0}
            onChange={(e) => setAnswer({ value: parseInt(e.target.value || "0", 10) })}
            style={{ display: "block", marginTop: 6 }}
          />
        </>
      )}

      <div style={{ marginTop: 16 }}>
        {step > 1 && <button onClick={() => router.push(`/onboarding/${step - 1}`)}>Back</button>}
        <button onClick={next} style={{ marginLeft: 8 }}>Next</button>
      </div>
    </div>
  );
}
