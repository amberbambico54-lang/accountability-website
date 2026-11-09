"use client";

import { HeartHandshake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { marriageSections } from "@/lib/content";
import { useWorkspacePages } from "@/components/workspace-pages-provider";

export default function MarriagePage() {
  const { pages } = useWorkspacePages();
  const pageDetails = pages.find((page) => page.kind === "marriage");

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <section className="rounded-[28px] border border-[#E7E0D2] bg-[linear-gradient(135deg,#FAF7F2_0%,#E7E0D2_100%)] p-6 shadow-sm">
        <Badge>Future home</Badge>
        <h1 className="mt-3 text-3xl font-semibold text-[#313B32]">{pageDetails?.title ?? "Marriage Plans"}</h1>
        <p className="mt-2 max-w-2xl text-[#4E5A52]">
          {pageDetails?.description ?? "A thoughtful planning space for the life we are preparing to build: support, investment, honesty, and home."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {marriageSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-4 w-4" /> {section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-[#4E5A52]">{section.summary}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
