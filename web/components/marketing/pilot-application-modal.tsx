"use client";

import clsx from "clsx";
import { SectionModal } from "@/components/ui/section-modal";
import { PilotApplicationForm } from "@/components/marketing/pilot-application-form";
import {
  marketingCtaClasses,
  type MarketingCtaSize,
  type MarketingCtaTone,
} from "@/components/marketing/marketing-cta-button";

type PilotApplicationModalProps = {
  sourceCta: string;
  size?: MarketingCtaSize;
  tone?: MarketingCtaTone;
  glow?: boolean;
  fullWidth?: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
};

export function PilotApplicationModal({
  sourceCta,
  size = "lg",
  tone = "dark",
  glow,
  fullWidth,
  triggerClassName,
  triggerLabel = "Join pilot scheme",
}: PilotApplicationModalProps) {
  return (
    <SectionModal
      title="Join the Qeemly pilot"
      subtitle="A short application for early teams that want personal onboarding and close feedback loops."
      triggerLabel={triggerLabel}
      triggerVariant="bare"
      triggerClassName={clsx(
        marketingCtaClasses({ intent: "pilot", size, tone, glow, fullWidth }),
        triggerClassName,
      )}
      triggerProps={{
        "data-cta-intent": "pilot",
        "data-cta-size": size,
        "data-cta-tone": tone,
      }}
      maxWidthClassName="max-w-2xl"
    >
      <PilotApplicationForm sourceCta={sourceCta} />
    </SectionModal>
  );
}
