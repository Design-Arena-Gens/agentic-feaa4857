# Agentic Multimodal Arena

An interactive platform for stress-testing prompts across leading multimodal AI models. Select a cohort of 4–5 models, submit text, image, or mixed prompts, and watch the system simulate response generation, cross-model scoring, and a final Gemini-3-Pro ranking. Compare your manual preference to Gemini’s judgement to measure alignment in each evaluation round.

## Local Development

Install dependencies and start the local dev server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` – launch the local development server.
- `npm run build` – create a production build.
- `npm run start` – serve the production build.
- `npm run lint` – run ESLint checks.

## Features

- Curated catalog of frontier multimodal models with capability tags.
- Text, image, and mixed prompt inputs with inline asset preview.
- Deterministic simulation of model narratives, highlights, and guidance.
- Cross-model peer scoring matrix with facet-level rationales.
- Automatic top-three aggregation plus Gemini-3-Pro final ranking simulation.
- Manual reviewer workflow to compare human preference against Gemini’s pick.

## Deployment

Deploy straight to Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-feaa4857
```

After deployment verifies, the production URL is `https://agentic-feaa4857.vercel.app`.

## Notes

- All scoring logic uses deterministic hashing so repeated runs with the same prompt and model selection remain stable.
- Replace the simulation layer with real model and evaluator APIs by swapping the helpers in `src/lib/simulation.ts`.
