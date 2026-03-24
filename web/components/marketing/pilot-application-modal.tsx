"use client";

import { SectionModal } from "@/components/ui/section-modal";
import { PilotApplicationForm } from "@/components/marketing/pilot-application-form";

type PilotApplicationModalProps = {
  sourceCta: string;
  triggerClassName?: string;
};

export function PilotApplicationModal({ sourceCta, triggerClassName }: PilotApplicationModalProps) {
  return (
    <SectionModal
      title="Join the Qeemly pilot"
      subtitle="A short application for early teams that want personal onboarding and close feedback loops."
      triggerLabel="Join pilot scheme"
      triggerVariant="button"
      triggerClassName={triggerClassName}
      maxWidthClassName="max-w-2xl"
    >
      <PilotApplicationForm sourceCta={sourceCta} />
    </SectionModal>
  );
}
