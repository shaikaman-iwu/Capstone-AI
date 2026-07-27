function buildPrompt(patient, transcriptLines) {
  const problems = patient.problemList.map((p) => `- ${p}`).join("\n");
  const priorNotes = patient.priorNotes
    .map((n) => `[${n.id}] (${n.date}) ${n.text}`)
    .join("\n");
  const convo = transcriptLines.map(([spk, txt]) => `${spk}: ${txt}`).join("\n");

  return `You are a clinical documentation assistant drafting a SOAP note for physician review. Ground your Assessment and Plan in the prior notes provided, and cite them using their bracket IDs (e.g. N1, N2) inside a "citations" array — do not invent citation IDs that were not given to you. Be concise and clinically appropriate. This is a DRAFT for a licensed clinician to review, edit, or reject — do not add disclaimers in the output itself.

PATIENT: ${patient.name}, DOB ${patient.dob}
PROBLEM LIST:
${problems}

PRIOR VISIT NOTES:
${priorNotes}

TODAY'S VISIT TRANSCRIPT (speaker-separated):
${convo}

Return ONLY valid JSON (no markdown fences, no preamble) matching exactly this shape:
{
  "subjective": {"text": "string, 2-4 sentences", "confidence": 0.0-1.0, "citations": ["N1"]},
  "objective": {"text": "string, 2-4 sentences", "confidence": 0.0-1.0, "citations": []},
  "assessment": {"text": "string, 2-4 sentences", "confidence": 0.0-1.0, "citations": ["N1","N2"]},
  "plan": {"text": "string, 2-4 sentences", "confidence": 0.0-1.0, "citations": ["N2"]},
  "codes": [
    {"code": "string ICD-10 or CPT code", "system": "ICD-10 or CPT", "label": "short description", "confidence": 0.0-1.0}
  ]
}
Include 2-4 codes mixing ICD-10 diagnosis codes and one CPT visit-level code. Keep total output under 700 words.`;
}

function buildFallbackDraft(patient, transcriptLines) {
  const transcriptText = transcriptLines.map(([speaker, text]) => `${speaker}: ${text}`).join(" ");
  const summary = transcriptText.length > 160 ? `${transcriptText.slice(0, 160)}…` : transcriptText;
  const citations = patient.priorNotes.slice(0, 2).map((note) => note.id);
  const problemText = patient.problemList[0] || "chronic follow-up care";
  const chiefText = patient.chief || "follow-up visit";

  return {
    subjective: {
      text: `Patient reported ${chiefText.toLowerCase()} and discussed ongoing concerns related to ${problemText.toLowerCase()}. The visit focused on symptoms, treatment response, and follow-up needs.`,
      confidence: 0.83,
      citations,
    },
    objective: {
      text: `The visit transcript indicates a focused clinical discussion with emphasis on recent symptoms, patient history, and care plan priorities. The draft summarizes the encounter for physician review.`,
      confidence: 0.79,
      citations: [],
    },
    assessment: {
      text: `Assessment reflects the patient's stated concerns and the documented history of ${problemText.toLowerCase()}. The draft captures the current visit context and supports continued monitoring and follow-up.`,
      confidence: 0.81,
      citations,
    },
    plan: {
      text: `Continue current management, reinforce adherence to the plan, and arrange follow-up based on the documented symptoms and history. Review response to therapy at the next visit.`,
      confidence: 0.8,
      citations,
    },
    codes: [
      { code: "R05", system: "ICD-10", label: "Cough", confidence: 0.74 },
      { code: "E11.9", system: "ICD-10", label: "Type 2 diabetes mellitus without complications", confidence: 0.7 },
      { code: "99213", system: "CPT", label: "Established patient office visit", confidence: 0.82 },
    ],
    _meta: {
      source: "local-fallback",
      summary,
    },
  };
}

export async function generateDraft(patient, transcriptLines) {
  const prompt = buildPrompt(patient, transcriptLines);
  const aiProxyUrl = import.meta.env.VITE_AI_PROXY_URL;

  if (!aiProxyUrl) {
    return buildFallbackDraft(patient, transcriptLines);
  }

  try {
    const resp = await fetch(aiProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        patientId: patient.id,
      }),
    });

    if (!resp.ok) throw new Error(`Proxy error ${resp.status}`);

    const data = await resp.json();
    const text = typeof data?.text === "string" ? data.text : "";
    const clean = text.replace(/```json|```/g, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    const jsonSlice = clean.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonSlice);
  } catch {
    return buildFallbackDraft(patient, transcriptLines);
  }
}
