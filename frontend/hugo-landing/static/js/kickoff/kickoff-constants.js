/**
 * Phase 5 kickoff — shared constants (v2.3 spec).
 */
(function (global) {
  "use strict";

  var K = {
    STATE_KEY: "heerise_phase5_state",
    RESULT_KEY: "heerise_kickoff_result",
    NOTES_KEY: "heerise_lumina_sim_notes_v1",
    TTL_HOURS: 6,
    TTL_WRAPPER_KEY: "heerise_lumina_sim_ttl_v1",
    SAMPLE_AGENDA_MARKER: "[Sample Agenda · 14 minutes]",
    SAMPLE_AGENDA_TAB: "stakeholder-kickoff-kickoff-intro",
    KICKOFF_INTRO_PATH: "/acc/stakeholder-kickoff/kickoff/intro/",
    MANAGER_BRIEF_PATH: "/acc/stakeholder-kickoff/manager-brief/",
    MAX_LLM_CALLS: 30,
    MAX_AGENT_CALLS_PER_TURN: 2,
    RETRY_ON_FAILURE: 1,
    API_TIMEOUT_MS: 3600000,
    SCENES: ["S5.02", "S5.03", "S5.04", "S5.05", "S5.06", "S5.07", "S5.08", "S5.09"],
    AGENDA: [
      { id: 1, label: "Introductions & project brief assumptions", durationSec: 120, scenes: ["S5.02", "S5.03", "S5.04"], dp: "DP5" },
      { id: 2, label: "Learner audience: constraints, gaps, access", durationSec: 180, scenes: ["S5.05"] },
      { id: 3, label: "Scope and boundaries", durationSec: 300, scenes: ["S5.06", "S5.07"], dp: "DP6" },
      { id: 4, label: "Next steps", durationSec: 240, scenes: ["S5.08", "S5.09"], dp: "DP7" },
    ],
    OPENING: {
      "S5.02": { speaker: "Jordan Kim", text: "Thanks for setting this up. Over to you — what do we need to cover today?" },
    },
    SCENE_ENTRY: {
      "S5.06": { speaker: "Jordan Kim", text: "Actually, now that I think about it — could we also add a product comparison module? And a separate module on Aria demos? We'd love three modules total." },
      "S5.08": { speaker: "Dr. Priya Nair", text: "You're the designer — just tell us what you're going to build. What's your recommendation?" },
    },
    TIERS: {
      strong: {
        label: "STRONG",
        stars: 3,
        feedback:
          "You ran a focused and well-structured kickoff call. You used the agenda to set expectations, confirmed stakeholder roles, and asked targeted questions that uncovered what success really means for both Jordan and Priya. Most importantly, you noticed the tension between speed, accuracy, audience needs, and scope, and you turned that tension into clear next steps with owners and dates. This shows strong discovery thinking and meeting leadership.",
      },
      partial: {
        label: "PARTIAL",
        stars: 2,
        feedback:
          "You gathered useful information during the kickoff call, but some parts of the conversation could have been more structured or better connected to the project goals. You asked good questions and moved the discussion forward, but you may have missed chances to clarify priorities, align success metrics, or set clear next steps. The meeting was productive overall, but a few open questions remain that could create confusion later in the project.",
      },
      weak: {
        label: "WEAK",
        stars: 1,
        feedback:
          "The kickoff call did not create enough clarity or alignment. Instead of using the meeting to uncover stakeholder goals, audience needs, constraints, and decision owners, the conversation either moved too quickly into solutions or stayed too vague. As a result, the project direction, scope, and success criteria remain unclear. Before moving forward, you need to revisit the key questions and confirm what success looks like, what constraints matter most, and who needs to make decisions.",
      },
    },
    NON_ENGLISH_PROMPT: "Please continue in English for this kickoff simulation.",
  };

  function sampleAgendaBlock() {
    return (
      K.SAMPLE_AGENDA_MARKER +
      "\n\nSample Agenda (14 minutes)\n\n" +
      "01 Introductions & project brief assumptions · 2 min\n" +
      "02 Learner audience: constraints, gaps, access · 3 min\n" +
      "03 Scope and boundaries · 5 min\n" +
      "04 Next steps · 4 min"
    );
  }

  global.HeeriseKickoffConstants = K;
  global.HeeriseKickoffConstants.sampleAgendaBlock = sampleAgendaBlock;
})(typeof window !== "undefined" ? window : globalThis);
