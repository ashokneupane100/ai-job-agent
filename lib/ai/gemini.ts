import { GoogleGenAI } from "@google/genai"

import { normalizeResumeData, type ResumeData } from "@/lib/resume/data"

const DEFAULT_MODEL = "gemini-3.8-flash"

/**
 * JSON Schema for structured output. The Interactions API accepts plain JSON
 * Schema (no `Type` enum), and every property is required so the model always
 * returns a complete object — missing information comes back as "" or [].
 */
const resumeJsonSchema = {
  type: "object",
  properties: {
    fullName: {
      type: "string",
      description: "The candidate's full name.",
    },
    headline: {
      type: "string",
      description: "A short professional headline, e.g. 'Full Stack Developer'.",
    },
    contactEmail: { type: "string", description: "Email address." },
    phone: {
      type: "string",
      description: "Phone number, digits and symbols only.",
    },
    location: {
      type: "string",
      description: "City / country, or 'Remote'.",
    },
    website: {
      type: "string",
      description: "Personal website or portfolio URL.",
    },
    linkedinUrl: { type: "string", description: "LinkedIn profile URL." },
    githubUrl: { type: "string", description: "GitHub profile URL." },
    summary: {
      type: "string",
      description:
        "The professional summary / objective, verbatim or lightly cleaned.",
    },
    skills: {
      type: "array",
      items: { type: "string" },
      description: "Technical and professional skills, one per item.",
    },
    experience: {
      type: "array",
      description: "Work experience, most recent first.",
      items: {
        type: "object",
        properties: {
          company: { type: "string", description: "Employer name." },
          jobTitle: { type: "string", description: "Role title." },
          location: { type: "string", description: "Work location." },
          startDate: {
            type: "string",
            description: "As written, e.g. 'Jan 2022'.",
          },
          endDate: {
            type: "string",
            description:
              "'Present' when the role is current, otherwise as written.",
          },
          isCurrent: {
            type: "boolean",
            description: "True when this is the current role.",
          },
          highlights: {
            type: "array",
            items: { type: "string" },
            description:
              "Responsibilities and achievements, one bullet per item.",
          },
        },
        required: [
          "company",
          "jobTitle",
          "location",
          "startDate",
          "endDate",
          "isCurrent",
          "highlights",
        ],
      },
    },
    education: {
      type: "array",
      description: "Education entries.",
      items: {
        type: "object",
        properties: {
          institution: {
            type: "string",
            description: "School or university.",
          },
          degree: { type: "string", description: "Degree, e.g. 'BSc'." },
          fieldOfStudy: { type: "string", description: "Major / field." },
          location: { type: "string", description: "Institution location." },
          startDate: { type: "string" },
          endDate: { type: "string" },
          grade: {
            type: "string",
            description: "GPA, percentage, or classification.",
          },
          highlights: {
            type: "array",
            items: { type: "string" },
            description: "Notable coursework, honours, or activities.",
          },
        },
        required: [
          "institution",
          "degree",
          "fieldOfStudy",
          "location",
          "startDate",
          "endDate",
          "grade",
          "highlights",
        ],
      },
    },
    projects: {
      type: "array",
      description: "Personal or professional projects.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: {
            type: "string",
            description: "What it does and the impact.",
          },
          url: {
            type: "string",
            description: "Repository or live demo URL.",
          },
          technologies: { type: "array", items: { type: "string" } },
        },
        required: ["name", "description", "url", "technologies"],
      },
    },
    certifications: {
      type: "array",
      description: "Certifications and licences.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          issuer: { type: "string" },
          issueDate: { type: "string" },
          credentialUrl: { type: "string" },
        },
        required: ["name", "issuer", "issueDate", "credentialUrl"],
      },
    },
    links: {
      type: "array",
      description: "Any other links shown on the resume.",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "e.g. 'Portfolio', 'Blog'.",
          },
          url: { type: "string" },
        },
        required: ["label", "url"],
      },
    },
    languages: {
      type: "array",
      items: { type: "string" },
      description: "Spoken/written languages, optionally with proficiency.",
    },
    achievements: {
      type: "array",
      items: { type: "string" },
      description:
        "Awards, honours, publications, volunteering, or other notable details.",
    },
  },
  required: [
    "fullName",
    "headline",
    "contactEmail",
    "phone",
    "location",
    "website",
    "linkedinUrl",
    "githubUrl",
    "summary",
    "skills",
    "experience",
    "education",
    "projects",
    "certifications",
    "links",
    "languages",
    "achievements",
  ],
}

const PROMPT = `You are an expert resume parser. Read the attached resume PDF and extract every relevant detail into the provided JSON schema.

Rules:
- Only use information that is present in the resume. Never invent employers, dates, degrees, or metrics.
- Keep dates in the format written on the resume (for example "Jan 2022", "2020", "Spring 2023"). For a current role, put "Present" in endDate and set isCurrent to true.
- Copy responsibilities as separate, concise bullet points. Do not merge distinct bullets.
- Use "" for missing strings and [] for missing lists. Do not use null.
- Put LinkedIn and GitHub URLs in their dedicated fields, and also add them to links when they appear on the resume.
- Capture projects, certifications, languages, awards, and any other notable details.
- Return only the JSON object.`

type ApiErrorLike = {
  status?: number
  statusCode?: number
  body?: unknown
  error?: unknown
  cause?: { statusCode?: number; body?: unknown; error?: unknown }
}

/** Pulls the human-readable message out of the SDK's nested error shapes. */
function readApiMessage(value: unknown): string | undefined {
  if (!value) return undefined

  if (typeof value === "string") {
    const trimmed = value.trim()

    // Some SDK paths hand back the response body as a JSON string.
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed = readApiMessage(JSON.parse(trimmed))
        if (parsed) return parsed
      } catch {
        // Not JSON — fall through and use the string as-is.
      }
    }

    return value
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = readApiMessage(item)
      if (message) return message
    }
    return undefined
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>
    if (typeof record.message === "string" && record.message) {
      return record.message
    }
    if (typeof record.error === "string" && record.error) {
      return record.error
    }
    if (record.error) {
      return readApiMessage(record.error)
    }
  }

  return undefined
}

/**
 * The Interactions API wraps failures as `APIError: 402 API error occurred:
 * {"httpMeta":{...}}`, which hides the actual reason. The real message lives in
 * `error.body` / `error.cause`, so surface that instead.
 */
function describeGeminiError(error: unknown) {
  const apiError = (error ?? {}) as ApiErrorLike

  const message = (
    readApiMessage(apiError.body) ??
    readApiMessage(apiError.error) ??
    readApiMessage(apiError.cause?.body) ??
    readApiMessage(apiError.cause?.error) ??
    (error instanceof Error ? error.message : undefined) ??
    "Unknown Gemini API error"
  ).trim()

  const status =
    apiError.status ?? apiError.statusCode ?? apiError.cause?.statusCode

  if (status === 402) {
    return `${message} Add prepayment credits or enable billing in Google AI Studio, then retry the parse.`
  }
  if (status === 429) {
    return `${message} Gemini rate limit hit — wait a moment and retry the parse.`
  }
  if (status === 401 || status === 403) {
    return `${message} Check that GEMINI_API_KEY in .env.local belongs to a project with the Gemini API enabled.`
  }
  if (status === 404) {
    return `${message} Check GEMINI_MODEL — the configured model may not be available to this key.`
  }

  return message
}

/**
 * Sends the PDF straight to Gemini through the Interactions API. Gemini reads
 * PDFs natively, so no text-extraction dependency is needed. `store: false`
 * keeps resume contents out of Google's interaction history.
 */
export async function parseResumePdf(bytes: Uint8Array): Promise<ResumeData> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local and restart the dev server."
    )
  }

  const ai = new GoogleGenAI({ apiKey })

  let interaction
  try {
    interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      input: [
        { type: "text", text: PROMPT },
        {
          type: "document",
          mime_type: "application/pdf",
          data: Buffer.from(bytes).toString("base64"),
        },
      ],
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: resumeJsonSchema,
      },
      generation_config: {
        max_output_tokens: 65536,
        thinking_level: "medium",
      },
      // Do not retain resumes in Google's interaction history.
      store: false,
    })
  } catch (error) {
    throw new Error(`Gemini request failed: ${describeGeminiError(error)}`)
  }

  const text = interaction.output_text
  if (!text) {
    throw new Error("Gemini returned an empty response.")
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error("Gemini returned malformed JSON.")
  }

  const data = normalizeResumeData(json)

  if (
    !data.fullName &&
    !data.summary &&
    !data.skills.length &&
    !data.experience.length &&
    !data.education.length &&
    !data.projects.length
  ) {
    throw new Error(
      "Gemini could not find resume content in this PDF. Is it a scanned image?"
    )
  }

  return data
}
