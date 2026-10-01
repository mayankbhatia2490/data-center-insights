import { ReactNode } from "react";
import Seo from "@/components/Seo";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

interface LegalPageProps {
  title: string;
  description: string;
  path: string;
  updated?: string;
  noindex?: boolean;
  children: ReactNode;
}

const LegalPage = ({ title, description, path, updated, noindex = false, children }: LegalPageProps) => (
  <div className="min-h-screen bg-background">
    <Seo title={`${title} — Data Center Pulse`} description={description} path={path} noindex={noindex} />
    <Header />
    <main className="container max-w-3xl py-10 md:py-14">
      <h1 className="text-3xl font-black tracking-tight mb-2">{title}</h1>
      {updated && <p className="text-xs text-muted-foreground mb-8">Last updated {updated}</p>}
      <article
        className="prose prose-sm dark:prose-invert max-w-none
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-2
          [&_p]:text-[15px] [&_p]:leading-relaxed [&_li]:text-[15px] [&_li]:leading-relaxed
          [&_a]:text-primary [&_a]:underline"
      >
        {children}
      </article>
    </main>
    <SiteFooter />
  </div>
);

export default LegalPage;
