"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import type { InterviewPrep } from "@/modules/interview/service";

type Job = {
  id: string;
  title: string | null;
  company: string | null;
};

export function InterviewPrepClient({ jobId, job }: { jobId: string; job: Job }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [prepData, setPrepData] = useState<InterviewPrep | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function generatePrep() {
    setLoading(true);
    setPrepData(null);
    setErrors([]);
    const res = await fetch("/api/interview/prep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.message || "Prep generation failed";
      setErrors([msg]);
      toast.error("Could not generate prep", msg);
      return;
    }
    const data = await res.json();
    setPrepData(data);
    toast.success("Interview prep generated", "Review the intel and questions.");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Interview Preparation</CardTitle>
        <CardDescription>
          Generate company-specific intel, common questions, and prep materials for {job.company} - {job.title}.
        </CardDescription>
        <div className="mt-4">
          <Button
            onClick={generatePrep}
            loading={loading}
            loadingText="Generating…"
            leftIcon={<Icon.Sparkles className="h-4 w-4" />}
          >
            Generate Interview Prep
          </Button>
        </div>
      </Card>

      {errors.length ? (
        <Alert variant="danger" title="Errors">
          <ul className="list-disc pl-4 mt-1 space-y-0.5">
            {errors.map((e, i) => (<li key={i}>{e}</li>))}
          </ul>
        </Alert>
      ) : null}

      {prepData && (
        <Card>
          <CardTitle>Prep Results</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold">Company Intel</h3>
              <p className="text-sm text-fg-muted">{prepData.companyIntel}</p>
            </div>
            <div>
              <h3 className="font-semibold">Common Questions</h3>
              <ul className="list-disc pl-4 text-sm">
                {prepData.questions.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Technical Prep</h3>
              <p className="text-sm text-fg-muted">{prepData.technicalPrep}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
