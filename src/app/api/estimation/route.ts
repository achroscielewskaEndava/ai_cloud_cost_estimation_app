import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const CURRENCY = "USD";
const REGION = "EU-WEST-1";

const SYSTEM_PROMPT = [
  "You are a cloud cost estimation assistant.",
  "Return ONLY valid JSON matching the requested schema.",
  "Do NOT include markdown, code fences, or extra text.",
  "You do NOT have access to live pricing. Clearly label prices as estimates.",
  "Include pricing page links for each provider (general official pricing pages).",
  `Use region ${REGION} for all estimates.`,
  `Currency is always ${CURRENCY}.`,
].join(" ");

export const SCHEMA_OPEN_AI = {
  type: "object",
  additionalProperties: false,
  required: ["asOf", "estimates"],
  properties: {
    asOf: {
      type: "string",
      description: "Date of estimation in YYYY-MM-DD format",
    },
    estimates: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "provider",
          "currency",
          "monthlyTotal",
          "dailyTotal",
          "confidence",
          "assumptions",
          "breakdown",
          "recommendation",
          "pricingLinks",
        ],
        properties: {
          provider: {
            type: "string",
            description: "Cloud provider name",
          },
          currency: {
            type: "string",
            description: "Currency code, default USD",
          },
          monthlyTotal: {
            type: "number",
            minimum: 0,
          },
          dailyTotal: {
            type: "number",
            minimum: 0,
          },
          confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
          assumptions: {
            type: "array",
            items: {
              type: "string",
            },
          },
          breakdown: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["item", "monthly", "notes"],
              properties: {
                item: {
                  type: "string",
                },
                monthly: {
                  type: "number",
                  minimum: 0,
                },
                notes: {
                  type: "string",
                },
              },
            },
          },
          recommendation: {
            type: "string",
          },
          pricingLinks: {
            type: "array",
            minItems: 1,
            items: {
              type: "string",
              format: "uri",
            },
          },
        },
      },
    },
  },
};
export interface EstimateResponse {
  asOf: string;
  estimates: {
    provider: string;
    currency: string;
    monthlyTotal: number;
    dailyTotal: number;
    confidence: "low" | "medium" | "high";
    assumptions: string[];
    breakdown: {
      item: string;
      monthly: number;
      notes: string;
    }[];
    recommendation: string;
    pricingLinks: string[];
  }[];
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { body } = await req.json();

    const today = new Date().toISOString().slice(0, 10);

    // Tell the model EXACTLY what JSON to output
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Estimate infrastructure costs for the given project for each selected provider.",
            asOf: today,
            request: body,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "spec_draft",
          strict: false, // allow the model some flexibility, but it should still try to follow the schema
          schema: SCHEMA_OPEN_AI,
        },
      },
    });

    const text = response.output_text;
    if (!text) {
      return NextResponse.json(
        { error: "OpenAI returned empty output." },
        { status: 502 },
      );
    }

    // Ensure we return JSON (and fail loudly if the model didn't comply)
    const json = JSON.parse(text);

    return NextResponse.json(json, {
      status: 200,
      headers: {
        // Optional: helps if you want the browser to download it as a file
        "Content-Disposition": `attachment; filename="cost-estimate-${today}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Bad Request", message: err?.message ?? String(err) },
      { status: 400 },
    );
  }
}
