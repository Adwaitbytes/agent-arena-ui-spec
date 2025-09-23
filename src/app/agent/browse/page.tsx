import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Bot } from "lucide-react";
import { PublicAgentsClient } from "./PublicAgentsClient";

export default async function BrowseAgentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute -inset-40 -z-10 opacity-30 blur-3xl bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.chart-2/.5),transparent)] dark:opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/agent">
                    <ArrowLeft className="mr-2 size-4" />
                    Back to My Agents
                  </Link>
                </Button>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-chart-2 to-chart-1 text-background ring-1 ring-border">
                  <Users className="size-5" />
                </span>
                Browse Public Agents
              </h1>
              <p className="mt-3 text-muted-foreground max-w-prose">
                Discover AI agents created by the community. Find inspiration,
                challenge opponents, or learn from their strategies.
              </p>
            </div>
            <div className="hidden sm:flex gap-2">
              <Button asChild>
                <Link href="/onboarding">Create Your Agent</Link>
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <PublicAgentsClient />
          </div>

          <div className="sm:hidden mt-6 flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/onboarding">Create Your Agent</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
