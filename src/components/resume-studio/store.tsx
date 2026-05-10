"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type {
  ResumeData,
  ResumeSuggestion,
  StudioExperience,
  StudioProject,
  StudioEducation,
  StudioSkillGroup,
} from "@/schemas/resume-studio";

export type StudioRightTab = "resume" | "job" | "github";

type State = {
  resumeId: string;
  title: string;
  resume: ResumeData;
  jobDescription: string;
  suggestions: ResumeSuggestion[];
  appliedSuggestionIds: string[];
  rejectedSuggestionIds: string[];
  assistantMessages: { role: "user" | "assistant"; text: string; ts: number }[];
  rightTab: StudioRightTab;
  isDirty: boolean;
  isSaving: boolean;
  isGenerating: boolean;
  lastSavedAt: string | null;
};

type Action =
  | { type: "SET_RESUME"; resume: ResumeData }
  | { type: "PATCH_RESUME"; mutate: (prev: ResumeData) => ResumeData }
  | { type: "SET_TITLE"; title: string }
  | { type: "SET_JD"; jd: string }
  | { type: "SET_TAB"; tab: StudioRightTab }
  | { type: "ADD_SUGGESTIONS"; suggestions: ResumeSuggestion[]; assistantMessage: string }
  | { type: "ACK_SUGGESTION"; id: string; kind: "applied" | "rejected" }
  | { type: "PUSH_USER_MESSAGE"; text: string }
  | { type: "CLEAR_SUGGESTIONS" }
  | { type: "SET_GENERATING"; value: boolean }
  | { type: "SET_SAVING"; value: boolean }
  | { type: "MARK_SAVED"; at: string }
  | { type: "MARK_DIRTY" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_RESUME":
      return { ...state, resume: action.resume, isDirty: true };
    case "PATCH_RESUME":
      return { ...state, resume: action.mutate(state.resume), isDirty: true };
    case "SET_TITLE":
      return { ...state, title: action.title, isDirty: true };
    case "SET_JD":
      return { ...state, jobDescription: action.jd };
    case "SET_TAB":
      return { ...state, rightTab: action.tab };
    case "ADD_SUGGESTIONS":
      return {
        ...state,
        suggestions: [...state.suggestions, ...action.suggestions],
        assistantMessages: [
          ...state.assistantMessages,
          { role: "assistant", text: action.assistantMessage, ts: Date.now() },
        ],
      };
    case "ACK_SUGGESTION":
      return {
        ...state,
        suggestions: state.suggestions.filter((s) => s.id !== action.id),
        appliedSuggestionIds:
          action.kind === "applied"
            ? [...state.appliedSuggestionIds, action.id]
            : state.appliedSuggestionIds,
        rejectedSuggestionIds:
          action.kind === "rejected"
            ? [...state.rejectedSuggestionIds, action.id]
            : state.rejectedSuggestionIds,
        isDirty: action.kind === "applied" ? true : state.isDirty,
      };
    case "PUSH_USER_MESSAGE":
      return {
        ...state,
        assistantMessages: [
          ...state.assistantMessages,
          { role: "user", text: action.text, ts: Date.now() },
        ],
      };
    case "CLEAR_SUGGESTIONS":
      return { ...state, suggestions: [] };
    case "SET_GENERATING":
      return { ...state, isGenerating: action.value };
    case "SET_SAVING":
      return { ...state, isSaving: action.value };
    case "MARK_SAVED":
      return { ...state, isSaving: false, isDirty: false, lastSavedAt: action.at };
    case "MARK_DIRTY":
      return { ...state, isDirty: true };
    default:
      return state;
  }
}

export type StudioActions = {
  setResume: (data: ResumeData) => void;
  setTitle: (t: string) => void;
  setJobDescription: (jd: string) => void;
  setTab: (t: StudioRightTab) => void;

  updateContactField: (key: keyof ResumeData["contact"], value: string) => void;
  updateSummary: (value: string) => void;

  addExperience: () => void;
  removeExperience: (id: string) => void;
  updateExperience: (id: string, patch: Partial<StudioExperience>) => void;
  addExperienceBullet: (id: string) => void;
  updateExperienceBullet: (id: string, idx: number, value: string) => void;
  removeExperienceBullet: (id: string, idx: number) => void;

  addProject: () => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<StudioProject>) => void;
  addProjectBullet: (id: string) => void;
  updateProjectBullet: (id: string, idx: number, value: string) => void;
  removeProjectBullet: (id: string, idx: number) => void;

  addEducation: () => void;
  removeEducation: (id: string) => void;
  updateEducation: (id: string, patch: Partial<StudioEducation>) => void;

  addSkillCategory: () => void;
  removeSkillCategory: (idx: number) => void;
  updateSkillCategory: (idx: number, patch: Partial<StudioSkillGroup>) => void;

  pushUserMessage: (text: string) => void;
  addSuggestions: (suggestions: ResumeSuggestion[], assistantMessage: string) => void;
  applySuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  setGenerating: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  markSaved: (at: string) => void;
};

const StudioContext = createContext<{ state: State; actions: StudioActions } | null>(null);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function StudioProvider({
  initial,
  children,
}: {
  initial: { resumeId: string; title: string; resume: ResumeData };
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    resumeId: initial.resumeId,
    title: initial.title,
    resume: initial.resume,
    jobDescription: "",
    suggestions: [],
    appliedSuggestionIds: [],
    rejectedSuggestionIds: [],
    assistantMessages: [],
    rightTab: "resume",
    isDirty: false,
    isSaving: false,
    isGenerating: false,
    lastSavedAt: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const patch = useCallback(
    (mutate: (prev: ResumeData) => ResumeData) =>
      dispatch({ type: "PATCH_RESUME", mutate }),
    []
  );

  const actions = useMemo<StudioActions>(
    () => ({
      setResume: (data) => dispatch({ type: "SET_RESUME", resume: data }),
      setTitle: (title) => dispatch({ type: "SET_TITLE", title }),
      setJobDescription: (jd) => dispatch({ type: "SET_JD", jd }),
      setTab: (tab) => dispatch({ type: "SET_TAB", tab }),

      updateContactField: (key, value) =>
        patch((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } })),
      updateSummary: (value) => patch((prev) => ({ ...prev, summary: value })),

      addExperience: () =>
        patch((prev) => ({
          ...prev,
          experience: [
            ...prev.experience,
            {
              id: uid("exp"),
              company: "",
              title: "",
              location: "",
              startDate: "",
              endDate: "",
              current: false,
              bullets: [""],
            },
          ],
        })),
      removeExperience: (id) =>
        patch((prev) => ({
          ...prev,
          experience: prev.experience.filter((e) => e.id !== id),
        })),
      updateExperience: (id, p) =>
        patch((prev) => ({
          ...prev,
          experience: prev.experience.map((e) => (e.id === id ? { ...e, ...p } : e)),
        })),
      addExperienceBullet: (id) =>
        patch((prev) => ({
          ...prev,
          experience: prev.experience.map((e) =>
            e.id === id ? { ...e, bullets: [...e.bullets, ""] } : e
          ),
        })),
      updateExperienceBullet: (id, idx, value) =>
        patch((prev) => ({
          ...prev,
          experience: prev.experience.map((e) =>
            e.id === id
              ? {
                  ...e,
                  bullets: e.bullets.map((b, i) => (i === idx ? value : b)),
                }
              : e
          ),
        })),
      removeExperienceBullet: (id, idx) =>
        patch((prev) => ({
          ...prev,
          experience: prev.experience.map((e) =>
            e.id === id
              ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }
              : e
          ),
        })),

      addProject: () =>
        patch((prev) => ({
          ...prev,
          projects: [
            ...prev.projects,
            {
              id: uid("prj"),
              name: "",
              description: "",
              techStack: [],
              bullets: [""],
              links: [],
            },
          ],
        })),
      removeProject: (id) =>
        patch((prev) => ({
          ...prev,
          projects: prev.projects.filter((p) => p.id !== id),
        })),
      updateProject: (id, p) =>
        patch((prev) => ({
          ...prev,
          projects: prev.projects.map((pr) => (pr.id === id ? { ...pr, ...p } : pr)),
        })),
      addProjectBullet: (id) =>
        patch((prev) => ({
          ...prev,
          projects: prev.projects.map((pr) =>
            pr.id === id ? { ...pr, bullets: [...pr.bullets, ""] } : pr
          ),
        })),
      updateProjectBullet: (id, idx, value) =>
        patch((prev) => ({
          ...prev,
          projects: prev.projects.map((pr) =>
            pr.id === id
              ? { ...pr, bullets: pr.bullets.map((b, i) => (i === idx ? value : b)) }
              : pr
          ),
        })),
      removeProjectBullet: (id, idx) =>
        patch((prev) => ({
          ...prev,
          projects: prev.projects.map((pr) =>
            pr.id === id
              ? { ...pr, bullets: pr.bullets.filter((_, i) => i !== idx) }
              : pr
          ),
        })),

      addEducation: () =>
        patch((prev) => ({
          ...prev,
          education: [
            ...prev.education,
            {
              id: uid("edu"),
              school: "",
              degree: "",
              startDate: "",
              endDate: "",
              location: "",
            },
          ],
        })),
      removeEducation: (id) =>
        patch((prev) => ({
          ...prev,
          education: prev.education.filter((e) => e.id !== id),
        })),
      updateEducation: (id, p) =>
        patch((prev) => ({
          ...prev,
          education: prev.education.map((e) => (e.id === id ? { ...e, ...p } : e)),
        })),

      addSkillCategory: () =>
        patch((prev) => ({
          ...prev,
          skills: [...prev.skills, { category: "New category", items: [] }],
        })),
      removeSkillCategory: (idx) =>
        patch((prev) => ({
          ...prev,
          skills: prev.skills.filter((_, i) => i !== idx),
        })),
      updateSkillCategory: (idx, p) =>
        patch((prev) => ({
          ...prev,
          skills: prev.skills.map((s, i) => (i === idx ? { ...s, ...p } : s)),
        })),

      pushUserMessage: (text) => dispatch({ type: "PUSH_USER_MESSAGE", text }),
      addSuggestions: (suggestions, assistantMessage) =>
        dispatch({ type: "ADD_SUGGESTIONS", suggestions, assistantMessage }),
      applySuggestion: (id) => {
        const current = stateRef.current;
        const sug = current.suggestions.find((s) => s.id === id);
        if (!sug) return;
        const next = applySuggestionToResume(current.resume, sug);
        dispatch({ type: "SET_RESUME", resume: next });
        dispatch({ type: "ACK_SUGGESTION", id, kind: "applied" });
      },
      rejectSuggestion: (id) => dispatch({ type: "ACK_SUGGESTION", id, kind: "rejected" }),
      clearSuggestions: () => dispatch({ type: "CLEAR_SUGGESTIONS" }),

      setGenerating: (v) => dispatch({ type: "SET_GENERATING", value: v }),
      setSaving: (v) => dispatch({ type: "SET_SAVING", value: v }),
      markSaved: (at) => dispatch({ type: "MARK_SAVED", at }),
    }),
    [patch]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside StudioProvider");
  return ctx;
}

export function applySuggestionToResume(
  resume: ResumeData,
  s: ResumeSuggestion
): ResumeData {
  const path = s.fieldPath;

  if (path === "summary") {
    return { ...resume, summary: s.after };
  }

  const contactMatch = path.match(/^contact\.(\w+)$/);
  if (contactMatch) {
    const key = contactMatch[1] as keyof ResumeData["contact"];
    return { ...resume, contact: { ...resume.contact, [key]: s.after } };
  }

  const expBulletMatch = path.match(/^experience\[([^\]]+)\]\.bullets\[(\d+)\]$/);
  if (expBulletMatch) {
    const id = expBulletMatch[1];
    const idx = Number(expBulletMatch[2]);
    return {
      ...resume,
      experience: resume.experience.map((e) =>
        e.id === id
          ? {
              ...e,
              bullets: e.bullets.map((b, i) => (i === idx ? s.after : b)),
            }
          : e
      ),
    };
  }
  const expFieldMatch = path.match(/^experience\[([^\]]+)\]\.(title|company|location)$/);
  if (expFieldMatch) {
    const id = expFieldMatch[1];
    const key = expFieldMatch[2] as "title" | "company" | "location";
    return {
      ...resume,
      experience: resume.experience.map((e) =>
        e.id === id ? { ...e, [key]: s.after } : e
      ),
    };
  }

  const projBulletMatch = path.match(/^projects\[([^\]]+)\]\.bullets\[(\d+)\]$/);
  if (projBulletMatch) {
    const id = projBulletMatch[1];
    const idx = Number(projBulletMatch[2]);
    return {
      ...resume,
      projects: resume.projects.map((p) =>
        p.id === id
          ? { ...p, bullets: p.bullets.map((b, i) => (i === idx ? s.after : b)) }
          : p
      ),
    };
  }
  const projFieldMatch = path.match(/^projects\[([^\]]+)\]\.(name|description)$/);
  if (projFieldMatch) {
    const id = projFieldMatch[1];
    const key = projFieldMatch[2] as "name" | "description";
    return {
      ...resume,
      projects: resume.projects.map((p) =>
        p.id === id ? { ...p, [key]: s.after } : p
      ),
    };
  }

  const eduFieldMatch = path.match(/^education\[([^\]]+)\]\.(school|degree)$/);
  if (eduFieldMatch) {
    const id = eduFieldMatch[1];
    const key = eduFieldMatch[2] as "school" | "degree";
    return {
      ...resume,
      education: resume.education.map((e) =>
        e.id === id ? { ...e, [key]: s.after } : e
      ),
    };
  }

  const skillsMatch = path.match(/^skills\[(\d+)\]\.items$/);
  if (skillsMatch) {
    const idx = Number(skillsMatch[1]);
    const items = s.after
      .split(/[,\n]/)
      .map((x) => x.trim())
      .filter(Boolean);
    return {
      ...resume,
      skills: resume.skills.map((cat, i) => (i === idx ? { ...cat, items } : cat)),
    };
  }

  return resume;
}
