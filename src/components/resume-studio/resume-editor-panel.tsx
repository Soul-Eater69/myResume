"use client";
import { useStudio } from "./store";
import {
  SectionCard,
  StudioFieldLabel,
  StudioGhostButton,
  StudioIconButton,
  StudioInput,
  StudioTextarea,
} from "./section-card";

export function ResumeEditorPanel() {
  const { state, actions } = useStudio();
  const r = state.resume;

  return (
    <div className="h-full overflow-y-auto">
      <SectionCard title="Contact">
        <div className="grid grid-cols-2 gap-2">
          <FieldBlock label="Full name">
            <StudioInput
              value={r.contact.fullName}
              onChange={(v) => actions.updateContactField("fullName", v)}
              placeholder="Aryan Khurana"
            />
          </FieldBlock>
          <FieldBlock label="Phone">
            <StudioInput
              value={r.contact.phone}
              onChange={(v) => actions.updateContactField("phone", v)}
              placeholder="437-971-2422"
            />
          </FieldBlock>
          <FieldBlock label="Email">
            <StudioInput
              value={r.contact.email}
              onChange={(v) => actions.updateContactField("email", v)}
              placeholder="you@example.com"
            />
          </FieldBlock>
          <FieldBlock label="Location">
            <StudioInput
              value={r.contact.location}
              onChange={(v) => actions.updateContactField("location", v)}
              placeholder="Toronto, ON"
            />
          </FieldBlock>
          <FieldBlock label="LinkedIn" full>
            <StudioInput
              value={r.contact.linkedin}
              onChange={(v) => actions.updateContactField("linkedin", v)}
              placeholder="linkedin.com/in/…"
            />
          </FieldBlock>
          <FieldBlock label="GitHub" full>
            <StudioInput
              value={r.contact.github}
              onChange={(v) => actions.updateContactField("github", v)}
              placeholder="github.com/…"
            />
          </FieldBlock>
          <FieldBlock label="Portfolio" full>
            <StudioInput
              value={r.contact.portfolio}
              onChange={(v) => actions.updateContactField("portfolio", v)}
              placeholder="https://…"
            />
          </FieldBlock>
        </div>
      </SectionCard>

      <SectionCard title="Summary">
        <StudioTextarea
          value={r.summary}
          onChange={(v) => actions.updateSummary(v)}
          placeholder="Short professional summary."
          rows={4}
        />
      </SectionCard>

      <SectionCard
        title={`Experience (${r.experience.length})`}
        action={<StudioGhostButton onClick={actions.addExperience}>Add</StudioGhostButton>}
      >
        {r.experience.length === 0 ? (
          <Empty text="No experience yet." />
        ) : (
          r.experience.map((e) => (
            <div key={e.id} className="rounded border border-[#242a35] bg-[#0c1016] p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <StudioInput
                    value={e.title}
                    onChange={(v) => actions.updateExperience(e.id, { title: v })}
                    placeholder="Role / Title"
                  />
                  <StudioInput
                    value={e.company}
                    onChange={(v) => actions.updateExperience(e.id, { company: v })}
                    placeholder="Company"
                  />
                </div>
                <StudioIconButton onClick={() => actions.removeExperience(e.id)} title="Remove">
                  <Trash />
                </StudioIconButton>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <StudioInput
                  value={e.location}
                  onChange={(v) => actions.updateExperience(e.id, { location: v })}
                  placeholder="Location"
                />
                <StudioInput
                  value={e.startDate}
                  onChange={(v) => actions.updateExperience(e.id, { startDate: v })}
                  placeholder="Start (Feb 2025)"
                />
                <StudioInput
                  value={e.current ? "Present" : e.endDate}
                  onChange={(v) => actions.updateExperience(e.id, { endDate: v, current: false })}
                  placeholder="End"
                  disabled={e.current}
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
                <input
                  type="checkbox"
                  checked={e.current}
                  onChange={(ev) =>
                    actions.updateExperience(e.id, {
                      current: ev.target.checked,
                      endDate: ev.target.checked ? "" : e.endDate,
                    })
                  }
                  className="accent-emerald-600"
                />
                Currently here
              </label>
              <div>
                <StudioFieldLabel>Bullets</StudioFieldLabel>
                <div className="space-y-1.5">
                  {e.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <StudioTextarea
                        value={b}
                        onChange={(v) => actions.updateExperienceBullet(e.id, i, v)}
                        placeholder="Action verb + outcome + metric"
                        rows={2}
                      />
                      <StudioIconButton
                        onClick={() => actions.removeExperienceBullet(e.id, i)}
                        title="Remove bullet"
                      >
                        <Trash />
                      </StudioIconButton>
                    </div>
                  ))}
                  <StudioGhostButton onClick={() => actions.addExperienceBullet(e.id)}>
                    Add bullet
                  </StudioGhostButton>
                </div>
              </div>
            </div>
          ))
        )}
      </SectionCard>

      <SectionCard
        title={`Projects (${r.projects.length})`}
        action={<StudioGhostButton onClick={actions.addProject}>Add</StudioGhostButton>}
      >
        {r.projects.length === 0 ? (
          <Empty text="No projects yet." />
        ) : (
          r.projects.map((p) => (
            <div key={p.id} className="rounded border border-[#242a35] bg-[#0c1016] p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <StudioInput
                  value={p.name}
                  onChange={(v) => actions.updateProject(p.id, { name: v })}
                  placeholder="Project name"
                />
                <StudioIconButton onClick={() => actions.removeProject(p.id)} title="Remove">
                  <Trash />
                </StudioIconButton>
              </div>
              <StudioTextarea
                value={p.description}
                onChange={(v) => actions.updateProject(p.id, { description: v })}
                placeholder="One-line description"
                rows={2}
              />
              <div>
                <StudioFieldLabel>Tech stack (comma-separated)</StudioFieldLabel>
                <StudioInput
                  value={p.techStack.join(", ")}
                  onChange={(v) =>
                    actions.updateProject(p.id, {
                      techStack: v
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="React, Node, Postgres"
                />
              </div>
              <div>
                <StudioFieldLabel>Bullets</StudioFieldLabel>
                <div className="space-y-1.5">
                  {p.bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <StudioTextarea
                        value={b}
                        onChange={(v) => actions.updateProjectBullet(p.id, i, v)}
                        placeholder="Outcome bullet"
                        rows={2}
                      />
                      <StudioIconButton
                        onClick={() => actions.removeProjectBullet(p.id, i)}
                        title="Remove bullet"
                      >
                        <Trash />
                      </StudioIconButton>
                    </div>
                  ))}
                  <StudioGhostButton onClick={() => actions.addProjectBullet(p.id)}>
                    Add bullet
                  </StudioGhostButton>
                </div>
              </div>
              <div>
                <StudioFieldLabel>Links (comma-separated)</StudioFieldLabel>
                <StudioInput
                  value={p.links.join(", ")}
                  onChange={(v) =>
                    actions.updateProject(p.id, {
                      links: v
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="github.com/…, demo.example.com"
                />
              </div>
            </div>
          ))
        )}
      </SectionCard>

      <SectionCard
        title={`Education (${r.education.length})`}
        action={<StudioGhostButton onClick={actions.addEducation}>Add</StudioGhostButton>}
      >
        {r.education.length === 0 ? (
          <Empty text="No education yet." />
        ) : (
          r.education.map((e) => (
            <div key={e.id} className="rounded border border-[#242a35] bg-[#0c1016] p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <StudioInput
                  value={e.school}
                  onChange={(v) => actions.updateEducation(e.id, { school: v })}
                  placeholder="School"
                />
                <StudioIconButton onClick={() => actions.removeEducation(e.id)} title="Remove">
                  <Trash />
                </StudioIconButton>
              </div>
              <StudioInput
                value={e.degree}
                onChange={(v) => actions.updateEducation(e.id, { degree: v })}
                placeholder="Degree (B.S. Computer Science)"
              />
              <div className="grid grid-cols-3 gap-2">
                <StudioInput
                  value={e.location}
                  onChange={(v) => actions.updateEducation(e.id, { location: v })}
                  placeholder="Location"
                />
                <StudioInput
                  value={e.startDate}
                  onChange={(v) => actions.updateEducation(e.id, { startDate: v })}
                  placeholder="Start"
                />
                <StudioInput
                  value={e.endDate}
                  onChange={(v) => actions.updateEducation(e.id, { endDate: v })}
                  placeholder="End"
                />
              </div>
            </div>
          ))
        )}
      </SectionCard>

      <SectionCard
        title={`Skills (${r.skills.length})`}
        action={<StudioGhostButton onClick={actions.addSkillCategory}>Add Category</StudioGhostButton>}
      >
        {r.skills.length === 0 ? (
          <Empty text="No skills yet." />
        ) : (
          r.skills.map((cat, idx) => (
            <div key={idx} className="rounded border border-[#242a35] bg-[#0c1016] p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <StudioInput
                  value={cat.category}
                  onChange={(v) => actions.updateSkillCategory(idx, { category: v })}
                  placeholder="Category (Languages, Frameworks…)"
                />
                <StudioIconButton onClick={() => actions.removeSkillCategory(idx)} title="Remove">
                  <Trash />
                </StudioIconButton>
              </div>
              <StudioInput
                value={cat.items.join(", ")}
                onChange={(v) =>
                  actions.updateSkillCategory(idx, {
                    items: v
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="TypeScript, Python, Go"
              />
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}

function FieldBlock({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <StudioFieldLabel>{label}</StudioFieldLabel>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-[#6b7280] italic px-1 py-2">{text}</div>
  );
}

function Trash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
