export type PromptType = "text" | "image" | "multimodal";

export interface PromptPayload {
  type: PromptType;
  text?: string;
  imageName?: string;
  imageDataUrl?: string | null;
}

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  modalities: string[];
  strengths: string[];
}

export interface ModelResponseDetail {
  model: ModelDefinition;
  narrative: string;
  highlights: string[];
  guidance: string;
  baseScore: number;
  styleTag: string;
}

export interface PeerAssessment {
  fromId: string;
  toId: string;
  score: number;
  focus: string;
  justification: string;
}

export interface ResponseWithComposite {
  detail: ModelResponseDetail;
  compositeScore: number;
  avgPeerScore: number;
  peerAssessments: PeerAssessment[];
}

export interface MatrixRow {
  from: ModelDefinition;
  entries: {
    to: ModelDefinition;
    score: number;
    focus: string;
    justification: string;
  }[];
}

export interface GeminiRankingEntry {
  rank: number;
  response: ResponseWithComposite;
  score: number;
  rationale: string;
}

export interface SimulationResult {
  prompt: PromptPayload & { fingerprint: string };
  responses: ResponseWithComposite[];
  matrix: MatrixRow[];
  topThree: ResponseWithComposite[];
  geminiRanking: GeminiRankingEntry[];
}

export const AVAILABLE_MODELS: ModelDefinition[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    modalities: ["Text", "Vision", "Audio"],
    strengths: ["balanced reasoning", "tool orchestration", "structured plans"],
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    modalities: ["Text", "Vision"],
    strengths: ["ethical framing", "long-context synthesis", "safety analysis"],
  },
  {
    id: "gemini-2-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    modalities: ["Text", "Vision", "Video"],
    strengths: ["fast iteration", "multimodal grounding", "summarization"],
  },
  {
    id: "llama-4-vision",
    name: "LLaMA 4 Vision",
    provider: "Meta",
    modalities: ["Text", "Vision"],
    strengths: ["open weights", "vision-language fusion", "edge deploy"],
  },
  {
    id: "grok-vision",
    name: "Grok Vision",
    provider: "xAI",
    modalities: ["Text", "Vision"],
    strengths: ["creative elaboration", "contextual humor", "live data"],
  },
  {
    id: "mistral-large",
    name: "Mistral Large 2",
    provider: "Mistral",
    modalities: ["Text"],
    strengths: ["dense knowledge", "concise output", "program synthesis"],
  },
  {
    id: "command-r-plus",
    name: "Cohere Command R+",
    provider: "Cohere",
    modalities: ["Text"],
    strengths: ["retrieval fusion", "enterprise guardrails", "analytics"],
  },
];

const evaluationFacets = [
  "clarity",
  "grounding",
  "factuality",
  "multimodal reasoning",
  "structure",
  "actionability",
];

const styleTags = [
  "tactical strategist",
  "dialectic analyst",
  "vision-first planner",
  "risk-aware architect",
  "precision explainer",
  "multi-turn facilitator",
];

const highlightIntros = [
  "Synthesizes",
  "Prioritizes",
  "Surfaces",
  "Contrasts",
  "Triangulates",
  "Maps",
  "Benchmarks",
];

const highlightFocus = [
  "root causes behind the prompt",
  "visual cues that shift interpretation",
  "user intent into measurable KPIs",
  "temporal dependencies across phases",
  "audience cohorts with tailored hooks",
  "risk vectors requiring mitigation",
  "experimentation avenues for fast feedback",
];

const highlightOutcomes = [
  "delivering an execution-ready blueprint",
  "grounding claims in observable evidence",
  "stressing the critical path to impact",
  "providing narrative arcs for stakeholders",
  "exposing adjacent opportunities",
  "flagging ambiguous instructions early",
  "aligning metrics with desired signals",
];

const guidanceStems = [
  "Double down on",
  "Consider instrumenting",
  "Establish explicit guardrails for",
  "Prototype around",
  "Co-create review loops for",
  "Document fallback paths covering",
  "Calibrate expectations regarding",
];

const guidanceObjects = [
  "fail-fast experiments",
  "cross-modal evidence capture",
  "stakeholder briefings",
  "model critique prompts",
  "evaluation rubrics",
  "progressive disclosure strategies",
  "alignment checkpoints",
];

const crossJustifications = [
  "keeps terminology consistent with the prompt’s framing",
  "anchors claims in the shared evidence set",
  "over-indexes on narrative flair at the expense of facts",
  "misses an opportunity to weave the visual cues in",
  "balances creativity with grounded risk mitigation",
  "would benefit from clearer prioritization of next steps",
  "elevates the most unique insight from the cohort",
  "could expand on calibration between modalities",
];

const geminiAngles = [
  "trustworthiness under cross-model scrutiny",
  "factual cohesion with the source context",
  "decision-readiness for stakeholders",
  "multimodal attribution depth",
  "clarity for downstream automation",
  "alignment with human preference signals",
];

function hashString(source: string) {
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function pickFrom<T>(items: T[], seed: string) {
  if (items.length === 0) return undefined;
  const index = hashString(seed) % items.length;
  return items[index];
}

function clampScore(score: number) {
  return Math.round(Math.min(100, Math.max(40, score)));
}

function buildNarrative(model: ModelDefinition, prompt: PromptPayload, seed: string) {
  const intro = pickFrom(highlightIntros, `${seed}-intro`);
  const focus = pickFrom(highlightFocus, `${seed}-focus`);
  const outcome = pickFrom(highlightOutcomes, `${seed}-outcome`);
  const threads = [
    `${intro} ${focus}, translating intent into cross-modal checkpoints.`,
    `Connects signal across text and visuals to surface ${outcome}.`,
    `Augments ${model.name}'s strengths by sequencing reasoning phases.`,
  ];

  if (prompt.type === "image") {
    threads.splice(
      1,
      0,
      "Extracts composition cues—contrast, depth, and subject framing—to position the visual story.",
    );
  }

  if (prompt.type === "multimodal") {
    threads.push(
      "Aligns linguistic hypotheses with visual anchors, highlighting where each channel validates the other.",
    );
  }

  return threads.join(" ");
}

function buildHighlights(seed: string) {
  const bullets: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const intro = pickFrom(highlightIntros, `${seed}-highlight-${i}`);
    const focus = pickFrom(highlightFocus, `${seed}-focus-${i}`);
    const outcome = pickFrom(highlightOutcomes, `${seed}-outcome-${i}`);
    bullets.push(`${intro} ${focus}, ${outcome}.`);
  }
  return Array.from(new Set(bullets));
}

function buildGuidance(seed: string) {
  const stem = pickFrom(guidanceStems, `${seed}-stem`);
  const object = pickFrom(guidanceObjects, `${seed}-obj`);
  return `${stem} ${object} to maintain momentum between evaluation rounds.`;
}

function generateBaseScore(model: ModelDefinition, promptSeed: string) {
  const quality = 68 + (hashString(`${model.id}-${promptSeed}`) % 18);
  const grounding = 64 + (hashString(`${promptSeed}-${model.id}`) % 22);
  const creativity = 60 + (hashString(`${promptSeed}-${model.provider}`) % 26);
  const weighted = quality * 0.45 + grounding * 0.35 + creativity * 0.2;
  return clampScore(weighted);
}

function buildPeerAssessment(
  from: ModelDefinition,
  to: ModelDefinition,
  promptSeed: string,
): PeerAssessment {
  const salt = `${from.id}->${to.id}-${promptSeed}`;
  const focus = pickFrom(evaluationFacets, `${salt}-facet`) ?? "clarity";
  const justification =
    pickFrom(crossJustifications, `${salt}-why`) ??
    "provides a balanced take that covers the requested dimensions.";
  const base = 58 + (hashString(`${salt}-score`) % 38);
  const modifier =
    from.id === to.id ? 0 : (from.id < to.id ? 4 : -2) + (hashString(`${salt}-mod`) % 6);
  const score = clampScore(base + modifier);
  return {
    fromId: from.id,
    toId: to.id,
    score,
    focus,
    justification,
  };
}

export function generateResponses(
  models: ModelDefinition[],
  prompt: PromptPayload,
): ModelResponseDetail[] {
  const seed = `${prompt.type}-${prompt.text ?? ""}-${prompt.imageName ?? "no-image"}`;
  return models.map((model) => {
    const styleTag =
      pickFrom(styleTags, `${model.id}-${seed}-style`) ?? "structured synthesize";
    const narrative = buildNarrative(model, prompt, `${model.id}-${seed}`);
    const highlights = buildHighlights(`${model.id}-${seed}`);
    const guidance = buildGuidance(`${seed}-${model.id}`);
    const baseScore = generateBaseScore(model, seed);
    return {
      model,
      narrative,
      highlights,
      guidance,
      baseScore,
      styleTag,
    };
  });
}

export function buildSimulation(
  selectedModels: ModelDefinition[],
  prompt: PromptPayload,
): SimulationResult {
  const promptSeed = `${prompt.type}-${prompt.text ?? ""}-${prompt.imageName ?? "image"}`;
  const promptFingerprint = hashString(promptSeed).toString(16).slice(0, 10);

  const baseResponses = generateResponses(selectedModels, prompt);

  const peerAssessments: PeerAssessment[] = [];
  selectedModels.forEach((fromModel) => {
    selectedModels.forEach((toModel) => {
      if (fromModel.id === toModel.id) {
        // Self score to capture self-evaluation trend
        peerAssessments.push(
          buildPeerAssessment(fromModel, toModel, `${promptSeed}-self`),
        );
      } else {
        peerAssessments.push(
          buildPeerAssessment(fromModel, toModel, `${promptSeed}-peer`),
        );
      }
    });
  });

  const responsesWithComposite: ResponseWithComposite[] = baseResponses.map((detail) => {
    const peers = peerAssessments.filter((p) => p.toId === detail.model.id);
    const avgPeer =
      peers.reduce((acc, curr) => acc + curr.score, 0) / (peers.length || 1);
    const composite =
      detail.baseScore * 0.55 + avgPeer * 0.45 + (hashString(`${promptSeed}-${detail.model.id}-bonus`) % 6);
    return {
      detail,
      avgPeerScore: Math.round(avgPeer * 10) / 10,
      compositeScore: Math.round(composite * 10) / 10,
      peerAssessments: peers,
    };
  });

  const matrix: MatrixRow[] = selectedModels.map((fromModel) => {
    const entries = selectedModels.map((toModel) => {
      const assessment = peerAssessments.find(
        (p) => p.fromId === fromModel.id && p.toId === toModel.id,
      );
      return {
        to: toModel,
        score: assessment?.score ?? 0,
        focus: assessment?.focus ?? "clarity",
        justification:
          assessment?.justification ??
          "uses default calibration because no assessment was recorded.",
      };
    });
    return { from: fromModel, entries };
  });

  const topThree = [...responsesWithComposite]
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 3);

  const geminiRanking: GeminiRankingEntry[] = topThree
    .map((response) => {
      const geminiSeed = `${promptSeed}-gemini-${response.detail.model.id}`;
      const lens = pickFrom(geminiAngles, geminiSeed) ?? "overall balance";
      const score =
        response.compositeScore * 0.6 +
        response.avgPeerScore * 0.3 +
        (hashString(`${geminiSeed}-delta`) % 12);
      return {
        response,
        score: Math.round(score * 10) / 10,
        rationale: `Gemini-3-Pro prioritizes ${lens} and notes the framing as ${
          response.detail.styleTag
        }.`,
        rank: 0,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    prompt: {
      ...prompt,
      fingerprint: promptFingerprint,
    },
    responses: responsesWithComposite.sort(
      (a, b) => b.compositeScore - a.compositeScore,
    ),
    matrix,
    topThree,
    geminiRanking,
  };
}
