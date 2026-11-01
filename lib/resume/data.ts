import type { Database, Json } from "@/lib/supabase/types"

/**
 * The shape Gemini extracts from a resume and the shape the Profile form edits.
 * Keeping one shape means parsing, storing, and editing all speak the same
 * language — no per-feature remapping.
 */
export type ResumeExperience = {
  company: string
  jobTitle: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  highlights: string[]
}

export type ResumeEducation = {
  institution: string
  degree: string
  fieldOfStudy: string
  location: string
  startDate: string
  endDate: string
  grade: string
  highlights: string[]
}

export type ResumeProject = {
  name: string
  description: string
  url: string
  technologies: string[]
}

export type ResumeCertification = {
  name: string
  issuer: string
  issueDate: string
  credentialUrl: string
}

export type ResumeLink = {
  label: string
  url: string
}

export type ResumeData = {
  fullName: string
  headline: string
  contactEmail: string
  phone: string
  location: string
  website: string
  linkedinUrl: string
  githubUrl: string
  summary: string
  skills: string[]
  experience: ResumeExperience[]
  education: ResumeEducation[]
  projects: ResumeProject[]
  certifications: ResumeCertification[]
  links: ResumeLink[]
  languages: string[]
  achievements: string[]
}

export function emptyResumeData(): ResumeData {
  return {
    fullName: "",
    headline: "",
    contactEmail: "",
    phone: "",
    location: "",
    website: "",
    linkedinUrl: "",
    githubUrl: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    links: [],
    languages: [],
    achievements: [],
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function bool(value: unknown): boolean {
  return value === true
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map(text).filter(Boolean)))
}

function recordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  )
}

function normalizeExperience(value: unknown): ResumeExperience[] {
  return recordList(value)
    .map((item) => ({
      company: text(item.company),
      jobTitle: text(item.jobTitle),
      location: text(item.location),
      startDate: text(item.startDate),
      endDate: text(item.endDate),
      isCurrent: bool(item.isCurrent),
      highlights: stringList(item.highlights),
    }))
    .filter(
      (item) =>
        item.company || item.jobTitle || item.startDate || item.highlights.length
    )
}

function normalizeEducation(value: unknown): ResumeEducation[] {
  return recordList(value)
    .map((item) => ({
      institution: text(item.institution),
      degree: text(item.degree),
      fieldOfStudy: text(item.fieldOfStudy),
      location: text(item.location),
      startDate: text(item.startDate),
      endDate: text(item.endDate),
      grade: text(item.grade),
      highlights: stringList(item.highlights),
    }))
    .filter(
      (item) =>
        item.institution || item.degree || item.fieldOfStudy || item.highlights.length
    )
}

function normalizeProjects(value: unknown): ResumeProject[] {
  return recordList(value)
    .map((item) => ({
      name: text(item.name),
      description: text(item.description),
      url: text(item.url),
      technologies: stringList(item.technologies),
    }))
    .filter((item) => item.name || item.description || item.url)
}

function normalizeCertifications(value: unknown): ResumeCertification[] {
  return recordList(value)
    .map((item) => ({
      name: text(item.name),
      issuer: text(item.issuer),
      issueDate: text(item.issueDate),
      credentialUrl: text(item.credentialUrl),
    }))
    .filter((item) => item.name || item.issuer || item.credentialUrl)
}

function normalizeLinks(value: unknown): ResumeLink[] {
  return recordList(value)
    .map((item) => ({
      label: text(item.label),
      url: text(item.url),
    }))
    .filter((item) => item.url || item.label)
}

/**
 * Coerces anything (Gemini output, a form payload, a JSONB column) into a
 * complete `ResumeData`. Never throws, so a partial response cannot crash a
 * server action.
 */
export function normalizeResumeData(value: unknown): ResumeData {
  const record =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  return {
    fullName: text(record.fullName),
    headline: text(record.headline),
    contactEmail: text(record.contactEmail),
    phone: text(record.phone),
    location: text(record.location),
    website: text(record.website),
    linkedinUrl: text(record.linkedinUrl),
    githubUrl: text(record.githubUrl),
    summary: text(record.summary),
    skills: stringList(record.skills),
    experience: normalizeExperience(record.experience),
    education: normalizeEducation(record.education),
    projects: normalizeProjects(record.projects),
    certifications: normalizeCertifications(record.certifications),
    links: normalizeLinks(record.links),
    languages: stringList(record.languages),
    achievements: stringList(record.achievements),
  }
}

/** True once the profile has real content (a Google name alone does not count). */
export function hasProfileContent(data: ResumeData | null | undefined) {
  if (!data) return false

  return Boolean(
    data.headline ||
      data.summary ||
      data.skills.length ||
      data.experience.length ||
      data.education.length ||
      data.projects.length ||
      data.certifications.length ||
      data.links.length ||
      data.languages.length ||
      data.achievements.length
  )
}

type ProfileRow = {
  full_name: string | null
  headline: string | null
  contact_email: string | null
  phone: string | null
  location: string | null
  website: string | null
  linkedin_url: string | null
  github_url: string | null
  summary: string | null
  skills: string[] | null
  experience: unknown
  education: unknown
  projects: unknown
  certifications: unknown
  links: unknown
  languages: string[] | null
  achievements: string[] | null
}

export function profileToResumeData(
  profile: ProfileRow | null | undefined
): ResumeData {
  if (!profile) return emptyResumeData()

  return normalizeResumeData({
    fullName: profile.full_name,
    headline: profile.headline,
    contactEmail: profile.contact_email,
    phone: profile.phone,
    location: profile.location,
    website: profile.website,
    linkedinUrl: profile.linkedin_url,
    githubUrl: profile.github_url,
    summary: profile.summary,
    skills: profile.skills,
    experience: profile.experience,
    education: profile.education,
    projects: profile.projects,
    certifications: profile.certifications,
    links: profile.links,
    languages: profile.languages,
    achievements: profile.achievements,
  })
}

/**
 * Partial patch used after parsing a resume: only non-empty values are written,
 * so a sparse resume cannot erase details the user already typed.
 */
export function resumeDataToProfilePatch(
  data: ResumeData
): Database["public"]["Tables"]["profiles"]["Update"] {
  const patch: Database["public"]["Tables"]["profiles"]["Update"] = {}

  if (data.fullName) patch.full_name = data.fullName
  if (data.headline) patch.headline = data.headline
  if (data.contactEmail) patch.contact_email = data.contactEmail
  if (data.phone) patch.phone = data.phone
  if (data.location) patch.location = data.location
  if (data.website) patch.website = data.website
  if (data.linkedinUrl) patch.linkedin_url = data.linkedinUrl
  if (data.githubUrl) patch.github_url = data.githubUrl
  if (data.summary) patch.summary = data.summary

  if (data.skills.length) patch.skills = data.skills
  if (data.experience.length) {
    patch.experience = data.experience as unknown as Json
  }
  if (data.education.length) {
    patch.education = data.education as unknown as Json
  }
  if (data.projects.length) patch.projects = data.projects as unknown as Json
  if (data.certifications.length) {
    patch.certifications = data.certifications as unknown as Json
  }
  if (data.links.length) patch.links = data.links as unknown as Json
  if (data.languages.length) patch.languages = data.languages
  if (data.achievements.length) patch.achievements = data.achievements

  return patch
}

/** Full update used by the editable Profile form: empty values clear fields. */
export function resumeDataToProfileUpdate(
  data: ResumeData
): Database["public"]["Tables"]["profiles"]["Update"] {
  return {
    full_name: data.fullName || null,
    headline: data.headline || null,
    contact_email: data.contactEmail || null,
    phone: data.phone || null,
    location: data.location || null,
    website: data.website || null,
    linkedin_url: data.linkedinUrl || null,
    github_url: data.githubUrl || null,
    summary: data.summary || null,
    skills: data.skills,
    experience: data.experience as unknown as Json,
    education: data.education as unknown as Json,
    projects: data.projects as unknown as Json,
    certifications: data.certifications as unknown as Json,
    links: data.links as unknown as Json,
    languages: data.languages,
    achievements: data.achievements,
  }
}

/** "React, TypeScript" -> ["React", "TypeScript"] */
export function parseCommaList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

/** One bullet per line. */
export function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
}
