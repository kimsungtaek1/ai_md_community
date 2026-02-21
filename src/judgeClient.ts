import { spawn } from "node:child_process";
import { join } from "node:path";
import type { DecisionCitation, RevisionRequest } from "./types.js";

interface JudgeInput {
  revision: RevisionRequest;
  postBody: string;
}

export interface JudgeDecision {
  accepted: boolean;
  reason: string;
  supportCount: number;
  opposeCount: number;
  confidence: number;
  model: string;
  citations: DecisionCitation[];
}

export const judgeRevision = async (input: JudgeInput): Promise<JudgeDecision> => {
  const workerPath = join(process.cwd(), "worker", "judge_revision.py");

  return new Promise<JudgeDecision>((resolve, reject) => {
    const child = spawn("python3", [workerPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });

    child.on("error", (error) => reject(error));

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`judge worker failed (${code}): ${stderr || "unknown error"}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as JudgeDecision;
        if (
          typeof parsed.accepted !== "boolean" ||
          typeof parsed.reason !== "string" ||
          typeof parsed.confidence !== "number" ||
          typeof parsed.model !== "string" ||
          !Array.isArray(parsed.citations)
        ) {
          reject(new Error("judge worker returned invalid payload"));
          return;
        }
        resolve(parsed);
      } catch (error) {
        reject(new Error(`unable to parse worker output: ${String(error)}`));
      }
    });

    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
};
