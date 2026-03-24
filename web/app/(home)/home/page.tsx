import { HomeBentoGrid } from "@/components/marketing/home/bento-grid";
import { HomeFinalCta } from "@/components/marketing/home/final-cta";
import { HomeHero } from "@/components/marketing/home/hero";
import { HomeIntegrationsStrip } from "@/components/marketing/home/integrations-strip";
import { HomeIntro } from "@/components/marketing/home/intro";
import { HomeServicesShowcase } from "@/components/marketing/home/services-showcase";
import { HomeTicker } from "@/components/marketing/home/ticker";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteNav } from "@/components/layout/site-nav";

export default function HomePage() {
  return (
    <div className="bg-white text-brand-900">
      <HomeHero header={<SiteNav variant="dark" />} />
      <HomeTicker />
      <HomeIntro />
      <HomeBentoGrid />
      <HomeIntegrationsStrip />
      <HomeServicesShowcase />
      <HomeFinalCta />
      <SiteFooter />
    </div>
  );
}
