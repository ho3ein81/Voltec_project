import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";

export default async function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const project = projects.find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title={`پروژه ${project.title}`}
        description="جزئیات کامل پروژه"
      />

      <Card>
        <CardContent className="p-6 space-y-4 text-sm">
          <div><strong>کد پروژه:</strong> {project.code}</div>
          <div><strong>کارفرما:</strong> {project.client}</div>
          <div><strong>مدیر پروژه:</strong> {project.manager}</div>
          <div><strong>بودجه:</strong> {project.budget.toLocaleString("fa-IR")} ریال</div>
          <div><strong>هزینه‌کرد:</strong> {project.spent.toLocaleString("fa-IR")} ریال</div>
          <div><strong>پیشرفت:</strong> {project.progress}٪</div>
          <div><strong>وضعیت:</strong> {project.status}</div>
        </CardContent>
      </Card>
    </div>
  );
}
