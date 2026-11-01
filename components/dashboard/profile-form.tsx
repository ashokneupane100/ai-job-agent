"use client"

import { useActionState, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Award01Icon,
  Briefcase01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Folder01Icon,
  GraduationCapIcon,
  Link01Icon,
  PlusSignIcon,
  SparklesIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import { saveProfile } from "@/app/dashboard/profile/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { FormActionState } from "@/lib/auth"
import {
  parseCommaList,
  parseLines,
  type ResumeData,
} from "@/lib/resume/data"

/*
 * The form keeps list-like values as plain strings (one comma- or
 * newline-separated text field each) so typing never fights the parser. They
 * are converted back into arrays when the payload is submitted.
 */
type ExperienceForm = {
  company: string
  jobTitle: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  highlights: string
}

type EducationForm = {
  institution: string
  degree: string
  fieldOfStudy: string
  location: string
  startDate: string
  endDate: string
  grade: string
  highlights: string
}

type ProjectForm = {
  name: string
  description: string
  url: string
  technologies: string
}

type ProfileFormState = {
  fullName: string
  headline: string
  contactEmail: string
  phone: string
  location: string
  website: string
  linkedinUrl: string
  githubUrl: string
  summary: string
  skills: string
  experience: ExperienceForm[]
  education: EducationForm[]
  projects: ProjectForm[]
  certifications: ResumeData["certifications"]
  links: ResumeData["links"]
  languages: string
  achievements: string
}

function toFormState(data: ResumeData): ProfileFormState {
  return {
    fullName: data.fullName,
    headline: data.headline,
    contactEmail: data.contactEmail,
    phone: data.phone,
    location: data.location,
    website: data.website,
    linkedinUrl: data.linkedinUrl,
    githubUrl: data.githubUrl,
    summary: data.summary,
    skills: data.skills.join(", "),
    experience: data.experience.map((item) => ({
      company: item.company,
      jobTitle: item.jobTitle,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
      highlights: item.highlights.join("\n"),
    })),
    education: data.education.map((item) => ({
      institution: item.institution,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy,
      location: item.location,
      startDate: item.startDate,
      endDate: item.endDate,
      grade: item.grade,
      highlights: item.highlights.join("\n"),
    })),
    projects: data.projects.map((item) => ({
      name: item.name,
      description: item.description,
      url: item.url,
      technologies: item.technologies.join(", "),
    })),
    certifications: data.certifications,
    links: data.links,
    languages: data.languages.join(", "),
    achievements: data.achievements.join("\n"),
  }
}

function toResumeData(form: ProfileFormState): ResumeData {
  return {
    fullName: form.fullName,
    headline: form.headline,
    contactEmail: form.contactEmail,
    phone: form.phone,
    location: form.location,
    website: form.website,
    linkedinUrl: form.linkedinUrl,
    githubUrl: form.githubUrl,
    summary: form.summary,
    skills: parseCommaList(form.skills),
    experience: form.experience.map((item) => ({
      ...item,
      highlights: parseLines(item.highlights),
    })),
    education: form.education.map((item) => ({
      ...item,
      highlights: parseLines(item.highlights),
    })),
    projects: form.projects.map((item) => ({
      name: item.name,
      description: item.description,
      url: item.url,
      technologies: parseCommaList(item.technologies),
    })),
    certifications: form.certifications,
    links: form.links,
    languages: parseCommaList(form.languages),
    achievements: parseLines(form.achievements),
  }
}

const emptyExperience: ExperienceForm = {
  company: "",
  jobTitle: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  highlights: "",
}

const emptyEducation: EducationForm = {
  institution: "",
  degree: "",
  fieldOfStudy: "",
  location: "",
  startDate: "",
  endDate: "",
  grade: "",
  highlights: "",
}

const emptyProject: ProjectForm = {
  name: "",
  description: "",
  url: "",
  technologies: "",
}

const emptyCertification: ResumeData["certifications"][number] = {
  name: "",
  issuer: "",
  issueDate: "",
  credentialUrl: "",
}

const emptyLink: ResumeData["links"][number] = {
  label: "",
  url: "",
}

function Section({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            {icon}
          </span>
          <div className="flex flex-col gap-0.5">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={onClick}
    >
      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
    </Button>
  )
}

function AddButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      {label}
    </Button>
  )
}

export function ProfileForm({ initial }: { initial: ResumeData }) {
  const [state, formAction, pending] = useActionState<FormActionState, FormData>(
    saveProfile,
    {}
  )
  const [form, setForm] = useState<ProfileFormState>(() =>
    toFormState(initial)
  )

  const payload = useMemo(
    () => JSON.stringify(toResumeData(form)),
    [form]
  )

  function update<K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateRow<T>(
    key: "experience" | "education" | "projects",
    index: number,
    patch: Partial<T>
  ) {
    setForm((current) => {
      const rows = current[key] as unknown as T[]
      const next = rows.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      )
      return { ...current, [key]: next } as ProfileFormState
    })
  }

  function removeRow(
    key: "experience" | "education" | "projects" | "certifications" | "links",
    index: number
  ) {
    setForm((current) => ({
      ...current,
      [key]: (current[key] as unknown as unknown[]).filter(
        (_, i) => i !== index
      ),
    }))
  }

  function addRow(
    key: "experience" | "education" | "projects" | "certifications" | "links",
    row: unknown
  ) {
    setForm((current) => ({
      ...current,
      [key]: [...(current[key] as unknown as unknown[]), row],
    }))
  }

  const filledSections = [
    form.headline || form.summary,
    form.skills,
    form.experience.length,
    form.education.length,
    form.projects.length,
    form.certifications.length,
    form.links.length,
    form.languages || form.achievements,
  ].filter(Boolean).length

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-20">
      <input type="hidden" name="payload" value={payload} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">Your profile</h1>
          <p className="text-xs/relaxed text-muted-foreground">
            Auto-filled from your resume. Edit anything that needs a fix — every
            field saves back to Supabase.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {filledSections} of 8 sections filled
        </Badge>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs/relaxed text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs/relaxed text-emerald-700 dark:text-emerald-400"
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            strokeWidth={2}
            className="size-4"
          />
          Profile saved.
        </p>
      ) : null}

      <Section
        title="Basics"
        description="How recruiters reach you."
        icon={<HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />}
      >
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="fullName">Full name</FieldLabel>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                placeholder="Aayan Neupane"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="headline">Headline</FieldLabel>
              <Input
                id="headline"
                value={form.headline}
                onChange={(event) => update("headline", event.target.value)}
                placeholder="Full Stack Developer"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
              <Input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(event) => update("contactEmail", event.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="+977 98…"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input
                id="location"
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="Kathmandu, Nepal"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="website">Website</FieldLabel>
              <Input
                id="website"
                value={form.website}
                onChange={(event) => update("website", event.target.value)}
                placeholder="https://your-site.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="linkedinUrl">LinkedIn</FieldLabel>
              <Input
                id="linkedinUrl"
                value={form.linkedinUrl}
                onChange={(event) => update("linkedinUrl", event.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="githubUrl">GitHub</FieldLabel>
              <Input
                id="githubUrl"
                value={form.githubUrl}
                onChange={(event) => update("githubUrl", event.target.value)}
                placeholder="https://github.com/…"
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="summary">Professional summary</FieldLabel>
            <Textarea
              id="summary"
              rows={4}
              value={form.summary}
              onChange={(event) => update("summary", event.target.value)}
              placeholder="A short paragraph about what you do and what you are looking for."
            />
          </Field>
        </FieldGroup>
      </Section>

      <Section
        title="Skills"
        description="Comma-separated. Used to match you with roles."
        icon={
          <HugeiconsIcon
            icon={SparklesIcon}
            strokeWidth={2}
            className="size-4"
          />
        }
      >
        <Field>
          <FieldLabel htmlFor="skills">Skills</FieldLabel>
          <Textarea
            id="skills"
            rows={3}
            value={form.skills}
            onChange={(event) => update("skills", event.target.value)}
            placeholder="React, TypeScript, Node.js, PostgreSQL"
          />
        </Field>
      </Section>

      <Section
        title="Work experience"
        description="Most recent first."
        icon={
          <HugeiconsIcon
            icon={Briefcase01Icon}
            strokeWidth={2}
            className="size-4"
          />
        }
        action={
          <AddButton
            label="Add role"
            onClick={() => addRow("experience", { ...emptyExperience })}
          />
        }
      >
        {form.experience.length === 0 ? (
          <EmptyRow message="No work experience yet. Add a role or upload a resume." />
        ) : (
          <div className="flex flex-col gap-3">
            {form.experience.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Role {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove role"
                    onClick={() => removeRow("experience", index)}
                  />
                </div>

                <FieldGroup className="gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Company</FieldLabel>
                      <Input
                        value={item.company}
                        onChange={(event) =>
                          updateRow<ExperienceForm>("experience", index, {
                            company: event.target.value,
                          })
                        }
                        placeholder="Acme Inc."
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Job title</FieldLabel>
                      <Input
                        value={item.jobTitle}
                        onChange={(event) =>
                          updateRow<ExperienceForm>("experience", index, {
                            jobTitle: event.target.value,
                          })
                        }
                        placeholder="Software Engineer"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Location</FieldLabel>
                      <Input
                        value={item.location}
                        onChange={(event) =>
                          updateRow<ExperienceForm>("experience", index, {
                            location: event.target.value,
                          })
                        }
                        placeholder="Remote"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel>Start</FieldLabel>
                        <Input
                          value={item.startDate}
                          onChange={(event) =>
                            updateRow<ExperienceForm>("experience", index, {
                              startDate: event.target.value,
                            })
                          }
                          placeholder="Jan 2022"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>End</FieldLabel>
                        <Input
                          value={item.isCurrent ? "Present" : item.endDate}
                          disabled={item.isCurrent}
                          onChange={(event) =>
                            updateRow<ExperienceForm>("experience", index, {
                              endDate: event.target.value,
                            })
                          }
                          placeholder="Dec 2023"
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="flex w-fit items-center gap-2">
                    <Checkbox
                      id={`experience-current-${index}`}
                      checked={item.isCurrent}
                      onCheckedChange={(checked) =>
                        updateRow<ExperienceForm>("experience", index, {
                          isCurrent: checked,
                        })
                      }
                    />
                    <Label
                      htmlFor={`experience-current-${index}`}
                      className="text-xs/relaxed"
                    >
                      I currently work here
                    </Label>
                  </div>

                  <Field>
                    <FieldLabel>Responsibilities</FieldLabel>
                    <Textarea
                      rows={4}
                      value={item.highlights}
                      onChange={(event) =>
                        updateRow<ExperienceForm>("experience", index, {
                          highlights: event.target.value,
                        })
                      }
                      placeholder={"One bullet per line\nBuilt the checkout flow…"}
                    />
                  </Field>
                </FieldGroup>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Education"
        description="Degrees, bootcamps, and coursework."
        icon={
          <HugeiconsIcon
            icon={GraduationCapIcon}
            strokeWidth={2}
            className="size-4"
          />
        }
        action={
          <AddButton
            label="Add education"
            onClick={() => addRow("education", { ...emptyEducation })}
          />
        }
      >
        {form.education.length === 0 ? (
          <EmptyRow message="No education added yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {form.education.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Education {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove education"
                    onClick={() => removeRow("education", index)}
                  />
                </div>

                <FieldGroup className="gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Institution</FieldLabel>
                      <Input
                        value={item.institution}
                        onChange={(event) =>
                          updateRow<EducationForm>("education", index, {
                            institution: event.target.value,
                          })
                        }
                        placeholder="Tribhuvan University"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Degree</FieldLabel>
                      <Input
                        value={item.degree}
                        onChange={(event) =>
                          updateRow<EducationForm>("education", index, {
                            degree: event.target.value,
                          })
                        }
                        placeholder="BSc"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Field of study</FieldLabel>
                      <Input
                        value={item.fieldOfStudy}
                        onChange={(event) =>
                          updateRow<EducationForm>("education", index, {
                            fieldOfStudy: event.target.value,
                          })
                        }
                        placeholder="Computer Science"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Location</FieldLabel>
                      <Input
                        value={item.location}
                        onChange={(event) =>
                          updateRow<EducationForm>("education", index, {
                            location: event.target.value,
                          })
                        }
                        placeholder="Kathmandu, Nepal"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel>Start</FieldLabel>
                        <Input
                          value={item.startDate}
                          onChange={(event) =>
                            updateRow<EducationForm>("education", index, {
                              startDate: event.target.value,
                            })
                          }
                          placeholder="2019"
                        />
                      </Field>
                      <Field>
                        <FieldLabel>End</FieldLabel>
                        <Input
                          value={item.endDate}
                          onChange={(event) =>
                            updateRow<EducationForm>("education", index, {
                              endDate: event.target.value,
                            })
                          }
                          placeholder="2023"
                        />
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel>Grade / GPA</FieldLabel>
                      <Input
                        value={item.grade}
                        onChange={(event) =>
                          updateRow<EducationForm>("education", index, {
                            grade: event.target.value,
                          })
                        }
                        placeholder="3.7 / 4.0"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Highlights</FieldLabel>
                    <Textarea
                      rows={3}
                      value={item.highlights}
                      onChange={(event) =>
                        updateRow<EducationForm>("education", index, {
                          highlights: event.target.value,
                        })
                      }
                      placeholder={"One per line\nDean's list…"}
                    />
                  </Field>
                </FieldGroup>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Projects"
        description="Things you have built, shipped, or shipped on."
        icon={
          <HugeiconsIcon
            icon={Folder01Icon}
            strokeWidth={2}
            className="size-4"
          />
        }
        action={
          <AddButton
            label="Add project"
            onClick={() => addRow("projects", { ...emptyProject })}
          />
        }
      >
        {form.projects.length === 0 ? (
          <EmptyRow message="No projects added yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {form.projects.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Project {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove project"
                    onClick={() => removeRow("projects", index)}
                  />
                </div>

                <FieldGroup className="gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        value={item.name}
                        onChange={(event) =>
                          updateRow<ProjectForm>("projects", index, {
                            name: event.target.value,
                          })
                        }
                        placeholder="JobBuddy AI"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>URL</FieldLabel>
                      <Input
                        value={item.url}
                        onChange={(event) =>
                          updateRow<ProjectForm>("projects", index, {
                            url: event.target.value,
                          })
                        }
                        placeholder="https://github.com/…"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      rows={2}
                      value={item.description}
                      onChange={(event) =>
                        updateRow<ProjectForm>("projects", index, {
                          description: event.target.value,
                        })
                      }
                      placeholder="What it does and the impact it had."
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Technologies</FieldLabel>
                    <Input
                      value={item.technologies}
                      onChange={(event) =>
                        updateRow<ProjectForm>("projects", index, {
                          technologies: event.target.value,
                        })
                      }
                      placeholder="Next.js, Supabase, Gemini"
                    />
                  </Field>
                </FieldGroup>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Certifications"
        description="Courses, licences, and credentials."
        icon={
          <HugeiconsIcon
            icon={Award01Icon}
            strokeWidth={2}
            className="size-4"
          />
        }
        action={
          <AddButton
            label="Add certification"
            onClick={() =>
              addRow("certifications", { ...emptyCertification })
            }
          />
        }
      >
        {form.certifications.length === 0 ? (
          <EmptyRow message="No certifications added yet." />
        ) : (
          <div className="flex flex-col gap-3">
            {form.certifications.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Certification {index + 1}
                  </span>
                  <RemoveButton
                    label="Remove certification"
                    onClick={() => removeRow("certifications", index)}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={item.name}
                      onChange={(event) =>
                        update("certifications", {
                          ...form.certifications,
                          [index]: {
                            ...form.certifications[index],
                            name: event.target.value,
                          },
                        })
                      }
                      placeholder="AWS Certified Developer"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Issuer</FieldLabel>
                    <Input
                      value={item.issuer}
                      onChange={(event) =>
                        update("certifications", {
                          ...form.certifications,
                          [index]: {
                            ...form.certifications[index],
                            issuer: event.target.value,
                          },
                        })
                      }
                      placeholder="Amazon Web Services"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Issue date</FieldLabel>
                    <Input
                      value={item.issueDate}
                      onChange={(event) =>
                        update("certifications", {
                          ...form.certifications,
                          [index]: {
                            ...form.certifications[index],
                            issueDate: event.target.value,
                          },
                        })
                      }
                      placeholder="2024"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Credential URL</FieldLabel>
                    <Input
                      value={item.credentialUrl}
                      onChange={(event) =>
                        update("certifications", {
                          ...form.certifications,
                          [index]: {
                            ...form.certifications[index],
                            credentialUrl: event.target.value,
                          },
                        })
                      }
                      placeholder="https://…"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Links"
        description="Portfolio, blog, Dribbble, anything else."
        icon={
          <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-4" />
        }
        action={
          <AddButton
            label="Add link"
            onClick={() => addRow("links", { ...emptyLink })}
          />
        }
      >
        {form.links.length === 0 ? (
          <EmptyRow message="No extra links added yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {form.links.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <Field className="flex-1">
                  <FieldLabel>Label</FieldLabel>
                  <Input
                    value={item.label}
                    onChange={(event) =>
                      update("links", {
                        ...form.links,
                        [index]: {
                          ...form.links[index],
                          label: event.target.value,
                        },
                      })
                    }
                    placeholder="Portfolio"
                  />
                </Field>
                <Field className="flex-[2]">
                  <FieldLabel>URL</FieldLabel>
                  <Input
                    value={item.url}
                    onChange={(event) =>
                      update("links", {
                        ...form.links,
                        [index]: {
                          ...form.links[index],
                          url: event.target.value,
                        },
                      })
                    }
                    placeholder="https://…"
                  />
                </Field>
                <RemoveButton
                  label="Remove link"
                  onClick={() => removeRow("links", index)}
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Languages & achievements"
        description="Languages, awards, publications, volunteering."
        icon={
          <HugeiconsIcon
            icon={Award01Icon}
            strokeWidth={2}
            className="size-4"
          />
        }
      >
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="languages">Languages</FieldLabel>
            <Input
              id="languages"
              value={form.languages}
              onChange={(event) => update("languages", event.target.value)}
              placeholder="English (fluent), Nepali (native)"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="achievements">Achievements</FieldLabel>
            <Textarea
              id="achievements"
              rows={4}
              value={form.achievements}
              onChange={(event) => update("achievements", event.target.value)}
              placeholder={"One per line\nWon hackathon 2024…"}
            />
          </Field>
        </FieldGroup>
      </Section>

      <Separator />

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-3 py-2.5 shadow-sm backdrop-blur">
        <p className="text-xs/relaxed text-muted-foreground">
          {pending ? "Saving…" : "Changes are saved to your profile."}
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : null}
          {pending ? "Saving" : "Save profile"}
        </Button>
      </div>
    </form>
  )
}

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs/relaxed text-muted-foreground">
      {message}
    </div>
  )
}
