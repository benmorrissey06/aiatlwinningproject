import { GoogleGenAI } from "@google/genai";
import { FlashRequest, SellerProfile } from "../shared/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MASTER_PROMPT = `
You are an expert parsing bot for a campus marketplace.
Convert the user's text into a JSON object that STRICTLY follows this template:
{
  "schema_type": "FLASH_REQUEST",
  "item_meta": {
    "parsed_item": string,
    "category": string,
    "tags": string[]
  },
  "item_attributes": {
    "primary": {
      "size": string | null,
      "color": string | null,
      "condition_requested": string[]
    },
    "secondary": {
      "material": string | null,
      "brand": string | null
    }
  },
  "transaction": {
    "type_preferred": "buy" | "borrow",
    "type_acceptable": ("buy" | "borrow")[],
    "price_max": number | null
  },
  "context": {
    "urgency": "immediate" | "high" | "medium" | "low",
    "reason": string | null,
    "original_text": string
  },
  "location": {
    "text_input": string | null,
    "device_gps": { "lat": number, "lng": number } | null
  }
}
Rules:
- Always provide every field from the template.
- Use null when information is missing.
- For arrays, return [] when no values apply.
- Do NOT include any markdown fences or extra commentary.
- "original_text" must be copied verbatim from the user's text.
User text:
`;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function mergeFlashRequest(
  base: FlashRequest,
  partial: DeepPartial<FlashRequest>,
  originalText: string,
): FlashRequest {
  const transactionPreferred =
    partial.transaction?.type_preferred === "borrow" ? "borrow" : "buy";

  const merged: FlashRequest = {
    schema_type: "FLASH_REQUEST",
    item_meta: {
      parsed_item: partial.item_meta?.parsed_item ?? base.item_meta.parsed_item,
      category: partial.item_meta?.category ?? base.item_meta.category,
      tags: Array.isArray(partial.item_meta?.tags)
        ? partial.item_meta?.tags.filter((tag): tag is string => typeof tag === "string")
        : base.item_meta.tags,
    },
    item_attributes: {
      primary: {
        size:
          typeof partial.item_attributes?.primary?.size === "string" ||
          partial.item_attributes?.primary?.size === null
            ? partial.item_attributes?.primary?.size
            : base.item_attributes.primary.size,
        color:
          typeof partial.item_attributes?.primary?.color === "string" ||
          partial.item_attributes?.primary?.color === null
            ? partial.item_attributes?.primary?.color
            : base.item_attributes.primary.color,
        condition_requested: Array.isArray(partial.item_attributes?.primary?.condition_requested)
          ? partial.item_attributes?.primary?.condition_requested.filter(
              (value): value is string => typeof value === "string",
            )
          : base.item_attributes.primary.condition_requested,
      },
      secondary: {
        material:
          typeof partial.item_attributes?.secondary?.material === "string" ||
          partial.item_attributes?.secondary?.material === null
            ? partial.item_attributes?.secondary?.material
            : base.item_attributes.secondary.material,
        brand:
          typeof partial.item_attributes?.secondary?.brand === "string" ||
          partial.item_attributes?.secondary?.brand === null
            ? partial.item_attributes?.secondary?.brand
            : base.item_attributes.secondary.brand,
      },
    },
    transaction: {
      type_preferred: transactionPreferred,
      type_acceptable:
        Array.isArray(partial.transaction?.type_acceptable) &&
        partial.transaction?.type_acceptable.every((value) => value === "buy" || value === "borrow")
          ? (partial.transaction?.type_acceptable as ("buy" | "borrow")[])
          : transactionPreferred === "borrow"
            ? ["borrow"]
            : ["buy"],
      price_max:
        typeof partial.transaction?.price_max === "number" ||
        partial.transaction?.price_max === null
          ? partial.transaction?.price_max
          : base.transaction.price_max,
    },
    context: {
      urgency:
        partial.context?.urgency === "immediate" ||
        partial.context?.urgency === "high" ||
        partial.context?.urgency === "medium" ||
        partial.context?.urgency === "low"
          ? partial.context.urgency
          : base.context.urgency,
      reason:
        typeof partial.context?.reason === "string" || partial.context?.reason === null
          ? partial.context?.reason
          : base.context.reason,
      original_text: originalText,
    },
    location: {
      text_input:
        typeof partial.location?.text_input === "string" || partial.location?.text_input === null
          ? partial.location?.text_input
          : base.location.text_input,
      device_gps:
        partial.location?.device_gps &&
        typeof partial.location.device_gps.lat === "number" &&
        typeof partial.location.device_gps.lng === "number"
          ? partial.location.device_gps
          : base.location.device_gps,
    },
  };

  if (!merged.item_meta.parsed_item) {
    merged.item_meta.parsed_item = "";
  }
  if (!merged.item_meta.category) {
    merged.item_meta.category = "";
  }
  if (!merged.item_attributes.primary.condition_requested.length) {
    merged.item_attributes.primary.condition_requested = [];
  }
  if (!merged.item_meta.tags.length) {
    merged.item_meta.tags = [];
  }
  if (!merged.transaction.type_acceptable.includes(merged.transaction.type_preferred)) {
    merged.transaction.type_acceptable.unshift(merged.transaction.type_preferred);
  }

  return merged;
}

export async function parseBuyerRequest(text: string): Promise<FlashRequest> {
  const fullPrompt = `${MASTER_PROMPT}\n${text}\n`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    });
    const responseText = result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!responseText.trim()) {
      throw new Error("Gemini API returned an empty response.");
    }

    const cleanJsonText = responseText.replace(/```json/g, "").replace(/```/g, "");

    const parsedJson = JSON.parse(cleanJsonText) as DeepPartial<FlashRequest>;

    const base: FlashRequest = {
      schema_type: "FLASH_REQUEST",
      item_meta: {
        parsed_item: "",
        category: "",
        tags: [],
      },
      item_attributes: {
        primary: {
          size: null,
          color: null,
          condition_requested: [],
        },
        secondary: {
          material: null,
          brand: null,
        },
      },
      transaction: {
        type_preferred: "buy",
        type_acceptable: ["buy"],
        price_max: null,
      },
      context: {
        urgency: "medium",
        reason: null,
        original_text: text,
      },
      location: {
        text_input: null,
        device_gps: null,
      },
    };

    return mergeFlashRequest(base, parsedJson, text);
  } catch (error) {
    console.error("Error parsing request:", error);
    throw error;
  }
}

// --- SELLER PROFILE PARSING ---
const SELLER_PROFILE_PROMPT = `
You are an expert analyst for a campus marketplace.
You will receive a SINGLE free-form text blob containing a seller's bio, major, and a "Past Sales Summary".

Your task is to convert it into JSON that STRICTLY matches this schema:
{
  "schema_type": "SELLER_PROFILE",
  "user_id": string,
  "context": {
    "original_text": string
  },
  "profile_keywords": string[],
  "inferred_major": string | null,
  "inferred_location_keywords": string[],
  "sales_history_summary": [
    {
      "category": string,
      "item_examples": string[],
      "total_items_sold": number,
      "avg_price_per_item": number | null,
      "dominant_transaction_type_in_category": "sell" | "lend" | "mixed"
    }
  ],
  "overall_dominant_transaction_type": "sell" | "lend" | "mixed",
  "related_categories_of_interest": string[]
}

Instructions:
- Parse the bio to extract meaningful keywords (majors, dorms, hobbies, niches) for "profile_keywords".
- Deduce the student's major; use null only if truly absent.
- Capture location hints (dorm names, "off-campus", neighborhoods) in "inferred_location_keywords".
- For each bullet in the "Past Sales Summary":
  * Extract the category name.
  * Summarize concrete item examples (e.g., "GPUs", "textbooks", "jackets").
  * Capture the total number of items and average price (use null if missing).
  * Infer the dominant transaction type: "sell", "lend", or "mixed" based on percentages; if both present, choose "mixed".
- Set "overall_dominant_transaction_type" by combining percentages across all categories.
- Populate "related_categories_of_interest" with category names the seller is active in OR closely related categories they likely own.
- Output ONLY the JSON object with all required fields, no markdown fences or commentary.

Seller text:
`;

export async function parseSellerProfile(text: string, userId: string): Promise<SellerProfile> {
  const fullPrompt = `${SELLER_PROFILE_PROMPT}\n${text}\n`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
        },
      ],
    });

    const responseText =
      result.text ?? result.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!responseText.trim()) {
      throw new Error("Gemini API returned an empty response.");
    }

    const cleanJsonText = responseText.replace(/```json/g, "").replace(/```/g, "");
    const parsedJson = JSON.parse(cleanJsonText) as Partial<SellerProfile>;

    const transactionTypes = new Set(["sell", "lend", "mixed"]);

    const salesHistory =
      Array.isArray(parsedJson.sales_history_summary) && parsedJson.sales_history_summary.length
        ? parsedJson.sales_history_summary.map((entry) => {
            const dominant =
              typeof entry?.dominant_transaction_type_in_category === "string" &&
              transactionTypes.has(entry.dominant_transaction_type_in_category)
                ? (entry.dominant_transaction_type_in_category as SellerProfile["overall_dominant_transaction_type"])
                : "mixed";

            return {
              category: typeof entry?.category === "string" ? entry.category : "",
              item_examples: Array.isArray(entry?.item_examples)
                ? entry.item_examples.filter((value): value is string => typeof value === "string")
                : [],
              total_items_sold:
                typeof entry?.total_items_sold === "number" && Number.isFinite(entry.total_items_sold)
                  ? entry.total_items_sold
                  : 0,
              avg_price_per_item:
                typeof entry?.avg_price_per_item === "number" &&
                Number.isFinite(entry.avg_price_per_item)
                  ? entry.avg_price_per_item
                  : null,
              dominant_transaction_type_in_category: dominant,
            };
          })
        : [];

    const overallDominant =
      typeof parsedJson.overall_dominant_transaction_type === "string" &&
      transactionTypes.has(parsedJson.overall_dominant_transaction_type)
        ? parsedJson.overall_dominant_transaction_type
        : "mixed";

    const sellerProfile: SellerProfile = {
      schema_type: "SELLER_PROFILE",
      user_id: userId,
      context: {
        original_text: text,
      },
      profile_keywords: Array.isArray(parsedJson.profile_keywords)
        ? parsedJson.profile_keywords.filter((value): value is string => typeof value === "string")
        : [],
      inferred_major:
        typeof parsedJson.inferred_major === "string" && parsedJson.inferred_major.trim()
          ? parsedJson.inferred_major
          : null,
      inferred_location_keywords: Array.isArray(parsedJson.inferred_location_keywords)
        ? parsedJson.inferred_location_keywords.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
      sales_history_summary: salesHistory,
      overall_dominant_transaction_type: overallDominant,
      related_categories_of_interest: Array.isArray(parsedJson.related_categories_of_interest)
        ? parsedJson.related_categories_of_interest.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };

    return sellerProfile;
  } catch (error) {
    console.error("Error parsing profile:", error);
    throw new Error("Failed to parse profile with Gemini API.");
  }
}
