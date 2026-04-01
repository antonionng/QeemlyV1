"use client";

import { useEffect, useState } from "react";

export const WORKSPACE_CHANGED_EVENT = "qeemly:workspace-changed";

export type WorkspaceChangeSource = "override" | "profile";

export type WorkspaceChangeDetail = {
  workspaceId: string | null;
  source: WorkspaceChangeSource;
};

export function emitWorkspaceChange(detail: WorkspaceChangeDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<WorkspaceChangeDetail>(WORKSPACE_CHANGED_EVENT, { detail }));
}

export function subscribeToWorkspaceChanges(listener: (detail: WorkspaceChangeDetail) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = (event: Event) => {
    listener((event as CustomEvent<WorkspaceChangeDetail>).detail);
  };

  window.addEventListener(WORKSPACE_CHANGED_EVENT, handleChange as EventListener);

  return () => {
    window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleChange as EventListener);
  };
}

export function useWorkspaceChangeVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeToWorkspaceChanges(() => setVersion((current) => current + 1)), []);

  return version;
}
