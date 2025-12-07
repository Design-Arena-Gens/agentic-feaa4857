"use client";

import { ChangeEvent, FormEvent, useMemo, useState, useTransition } from "react";
import styles from "./page.module.css";
import {
  AVAILABLE_MODELS,
  buildSimulation,
  MatrixRow,
  PromptPayload,
  PromptType,
  SimulationResult,
} from "@/lib/simulation";

export default function Home() {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(
    AVAILABLE_MODELS.slice(0, 4).map((entry) => entry.id),
  );
  const [promptType, setPromptType] = useState<PromptType>("text");
  const [promptText, setPromptText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedModels = useMemo(
    () =>
      AVAILABLE_MODELS.filter((model) => selectedModelIds.includes(model.id)),
    [selectedModelIds],
  );

  const canSubmit =
    selectedModels.length >= 4 &&
    selectedModels.length <= 5 &&
    (promptType === "image"
      ? Boolean(imagePreview)
      : promptType === "multimodal"
        ? Boolean(imagePreview) || promptText.trim().length > 0
        : promptText.trim().length > 0);

  const geminiTopId = result?.geminiRanking[0]?.response.detail.model.id ?? null;

  function toggleModelSelection(modelId: string) {
    setError(null);
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= 5) {
        setError("Select up to five models per evaluation.");
        return prev;
      }
      return [...prev, modelId];
    });
  }

  function handlePromptTypeChange(type: PromptType) {
    setPromptType(type);
    if (type === "text") {
      setImagePreview(null);
      setImageName(undefined);
    }
  }

  function parseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageName(undefined);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported for visual prompts.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
        setImageName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleEvaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError(
        "Provide the required prompt inputs and select between four and five models before evaluating.",
      );
      return;
    }
    setError(null);
    startTransition(() => {
      const prompt: PromptPayload = {
        type: promptType,
        text: promptText.trim() ? promptText.trim() : undefined,
        imageDataUrl: imagePreview,
        imageName,
      };
      const simulation = buildSimulation(selectedModels, prompt);
      setResult(simulation);
      setUserChoice(null);
    });
  }

  function renderMatrix(matrix: MatrixRow[]) {
    if (matrix.length === 0) return null;
    const columns = matrix[0]?.entries ?? [];
    return (
      <div className={styles.matrix}>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th>Model →</th>
              {columns.map((entry) => (
                <th key={entry.to.id}>{entry.to.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.from.id}>
                <th>{row.from.name}</th>
                {row.entries.map((entry) => (
                  <td key={`${row.from.id}-${entry.to.id}`}>
                    <div>{entry.score}</div>
                    <div className={styles.subtle}>{entry.focus}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function handleChoiceSelect(modelId: string) {
    setUserChoice((prev) => (prev === modelId ? null : modelId));
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Multimodal Arena: Test, Cross-Evaluate, and Rank AI Model Responses
          </h1>
          <p className={styles.heroSubtitle}>
            Pick a cohort of foundation models, submit a text or visual prompt,
            and watch the platform orchestrate peer review, surface the top three
            responses, and benchmark them against Gemini-3-Pro’s final judgement.
          </p>
        </section>

        <form className={styles.panels} onSubmit={handleEvaluate}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Model Cohort</h2>
              <p className={styles.panelDescription}>
                Choose four to five models to include in this evaluation round.
              </p>
            </div>
            <div className={styles.modelGrid}>
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = selectedModelIds.includes(model.id);
                return (
                  <button
                    key={model.id}
                    type="button"
                    className={`${styles.modelOption} ${
                      isSelected ? styles.modelSelected : ""
                    }`}
                    onClick={() => toggleModelSelection(model.id)}
                  >
                    <input
                      className={styles.modelCheckbox}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleModelSelection(model.id)}
                      aria-label={`Toggle ${model.name}`}
                    />
                    <div className={styles.modelInfo}>
                      <div className={styles.modelName}>
                        {model.name}
                        <span className={styles.modelBadge}>{model.provider}</span>
                      </div>
                      <div className={styles.modelCapabilities}>
                        Modalities: {model.modalities.join(", ")}
                      </div>
                      <div className={styles.badgeList}>
                        {model.strengths.map((strength) => (
                          <span className={styles.miniBadge} key={strength}>
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Prompt Inputs</h2>
              <p className={styles.panelDescription}>
                Configure the stimulus. Toggle prompt type and add text, visuals, or
                both to stress-test model reasoning.
              </p>
            </div>

            <div className={styles.promptToggle}>
              {(["text", "image", "multimodal"] as PromptType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.toggleButton} ${
                    promptType === type ? styles.toggleButtonActive : ""
                  }`}
                  onClick={() => handlePromptTypeChange(type)}
                >
                  {type === "text" && "Text"}
                  {type === "image" && "Image"}
                  {type === "multimodal" && "Mixed"}
                </button>
              ))}
            </div>

            {(promptType === "text" || promptType === "multimodal") && (
              <textarea
                className={styles.textarea}
                placeholder="Describe the scenario you'd like each AI model to address..."
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
              />
            )}

            {(promptType === "image" || promptType === "multimodal") && (
              <label className={styles.fileDrop}>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={parseFile}
                />
                {imagePreview ? (
                  <>
                    <strong>{imageName ?? "uploaded-asset"}</strong>
                    <div>Click to replace the image asset.</div>
                    <div className={styles.filePreview}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Prompt preview" />
                    </div>
                  </>
                ) : (
                  <>
                    <strong>Drop or click to upload a reference image.</strong>
                    <div>PNG, JPG, or GIF up to 5&nbsp;MB.</div>
                  </>
                )}
              </label>
            )}

            <button
              type="submit"
              className={styles.evaluateButton}
              disabled={!canSubmit || isPending}
            >
              {isPending ? "Synthesizing peer review..." : "Run evaluation"}
            </button>
            {error && <div className={styles.error}>{error}</div>}
          </section>
        </form>

        {result && (
          <section className={styles.results}>
            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Model Responses</h3>
                <div className={styles.subtle}>
                  Prompt fingerprint: {result.prompt.fingerprint}
                </div>
              </div>
              <div className={styles.responseGrid}>
                {result.responses.map((response) => (
                  <article
                    className={styles.responseCard}
                    key={response.detail.model.id}
                  >
                    <div className={styles.responseHeader}>
                      <div>
                        <div className={styles.modelName}>
                          {response.detail.model.name}
                        </div>
                        <div className={styles.miniBadge}>
                          {response.detail.styleTag}
                        </div>
                      </div>
                      <div className={styles.scorePill}>
                        {response.compositeScore}
                      </div>
                    </div>
                    <p>{response.detail.narrative}</p>
                    <div className={styles.bulletList}>
                      {response.detail.highlights.map((highlight) => (
                        <span key={highlight}>• {highlight}</span>
                      ))}
                    </div>
                    <div className={styles.subtle}>
                      Peer average: {response.avgPeerScore}
                    </div>
                    <p>{response.detail.guidance}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Cross-Model Scoring Matrix</h3>
                <div className={styles.subtle}>
                  Each model rates every other model on the leading evaluation facet.
                </div>
              </div>
              {renderMatrix(result.matrix)}
            </div>

            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Top Three Candidates</h3>
                <div className={styles.subtle}>
                  Derived from composite blend of base performance and peer review.
                </div>
              </div>
              <div className={styles.rankingList}>
                {result.topThree.map((entry, index) => (
                  <div className={styles.rankingItem} key={entry.detail.model.id}>
                    <span className={styles.rankBadge}>#{index + 1}</span>
                    <div>
                      <div className={styles.modelName}>
                        {entry.detail.model.name}
                      </div>
                      <div className={styles.subtle}>
                        Composite {entry.compositeScore} · Peer {entry.avgPeerScore}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Gemini-3-Pro Final Ranking</h3>
                <div className={styles.subtle}>
                  Independent pass focused on cross-model alignment signals.
                </div>
              </div>
              <div className={styles.rankingList}>
                {result.geminiRanking.map((entry) => (
                  <div className={styles.rankingItem} key={entry.response.detail.model.id}>
                    <span className={styles.rankBadge}>#{entry.rank}</span>
                    <div>
                      <div className={styles.modelName}>
                        {entry.response.detail.model.name}
                      </div>
                      <div className={styles.subtle}>{entry.rationale}</div>
                    </div>
                    <div className={styles.scorePill}>{entry.score}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.resultSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Your Preference</h3>
                <div className={styles.subtle}>
                  Review any model’s output and mark the one that best matches your
                  intent.
                </div>
              </div>
              <div className={styles.userChoiceGrid}>
                {result.responses.map((response) => {
                  const isSelected = userChoice === response.detail.model.id;
                  return (
                    <button
                      key={`choice-${response.detail.model.id}`}
                      type="button"
                      className={`${styles.choiceCard} ${
                        isSelected ? styles.choiceSelected : ""
                      }`}
                      onClick={() => handleChoiceSelect(response.detail.model.id)}
                    >
                      <div className={styles.modelName}>
                        {response.detail.model.name}
                      </div>
                      <div className={styles.subtle}>
                        Composite {response.compositeScore} · Peer {response.avgPeerScore}
                      </div>
                      <div className={styles.bulletList}>
                        {response.detail.highlights.slice(0, 2).map((highlight) => (
                          <span key={`${response.detail.model.id}-${highlight}`}>
                            • {highlight}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              {userChoice && geminiTopId && (
                <div
                  className={`${styles.alignmentBanner} ${
                    userChoice === geminiTopId ? "" : styles.misalignmentBanner
                  }`}
                >
                  {userChoice === geminiTopId
                    ? "You and Gemini-3-Pro agree on the top response."
                    : "Your selection diverges from Gemini-3-Pro’s top pick—perfect for further analysis."}
                </div>
              )}
              {!userChoice && (
                <span className={styles.pendingNote}>
                  Select a favorite to compare against Gemini-3-Pro.
                </span>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
