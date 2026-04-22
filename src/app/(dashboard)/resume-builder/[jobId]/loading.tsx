import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export default function ResumeBuilderLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Icon.RefreshCw className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <CardTitle>Preparing the resume builder</CardTitle>
            <CardDescription className="mt-1">
              Loading job signals, ranking your evidence, and setting up the builder.
            </CardDescription>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Preview</CardTitle>
        <CardDescription className="mt-1">
          The preview panel will appear as soon as the builder finishes loading.
        </CardDescription>
      </Card>
    </div>
  );
}
