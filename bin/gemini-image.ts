/**
 * Direct Gemini image-generation client.
 *
 * Bypasses the Gemini CLI (which is an agentic coding tool that doesn't expose
 * image generation as a built-in tool). Calls the REST API directly so the
 * asset-enrichment skill's auto-mode dispatch can produce binary images.
 *
 * Usage:
 *   tsx bin/gemini-image.ts "<prompt>" <output-path>
 *
 * Env: GEMINI_API_KEY must be set. The key needs billing enabled on its AI
 * Studio account — gemini-2.5-flash-image (Nano Banana) has no free tier.
 *
 * Exit codes: 0 = success, 1 = error (message on stderr).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const MODEL = 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface InlineData {
  mimeType: string;
  data: string;
}

interface Part {
  text?: string;
  inlineData?: InlineData;
}

interface Candidate {
  content?: { parts?: Part[] };
  finishReason?: string;
}

interface ApiResponse {
  candidates?: Candidate[];
  error?: { code: number; message: string; status: string };
}

async function main() {
  const [, , prompt, outputPath] = process.argv;

  if (!prompt || !outputPath) {
    console.error('Usage: tsx bin/gemini-image.ts "<prompt>" <output-path>');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not set');
    process.exit(1);
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as ApiResponse;

  if (!res.ok || json.error) {
    const msg = json.error?.message ?? `HTTP ${res.status}`;
    console.error(`API error: ${msg}`);
    process.exit(1);
  }

  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p): p is Part & { inlineData: InlineData } =>
    p.inlineData !== undefined && p.inlineData.mimeType.startsWith('image/'),
  );

  if (!imagePart) {
    const textParts = parts
      .map((p) => p.text)
      .filter((t): t is string => Boolean(t))
      .join(' ');
    console.error(
      `No image in response. Finish reason: ${json.candidates?.[0]?.finishReason ?? 'unknown'}. ${textParts ? `Text: ${textParts}` : ''}`,
    );
    process.exit(1);
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  console.log(`OK ${outputPath} (${buffer.length} bytes, ${imagePart.inlineData.mimeType})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
