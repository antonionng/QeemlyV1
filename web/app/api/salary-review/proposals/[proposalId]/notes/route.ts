import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { jsonServerError, jsonValidationError } from "@/lib/errors/http";

type NoteBody = {
  note?: string;
  employeeId?: string | null;
  stepId?: string | null;
};

async function ensureProposalAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  proposalId: string
) {
  const { data: proposal, error } = await supabase
    .from("salary_review_cycles")
    .select("*")
    .eq("id", proposalId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !proposal) {
    return null;
  }

  return proposal;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { proposalId } = await params;
  const proposal = await ensureProposalAccess(supabase, wsContext.context.workspace_id, proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("salary_review_notes")
    .select("*")
    .eq("cycle_id", proposalId)
    .eq("workspace_id", wsContext.context.workspace_id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not load proposal notes right now.",
      logLabel: "Salary review proposal notes load failed",
    });
  }

  return NextResponse.json({ notes: data || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> }
) {
  const supabase = await createClient();
  const wsContext = await getWorkspaceContext();
  if (!wsContext.context) {
    return NextResponse.json({ error: wsContext.error }, { status: wsContext.status });
  }

  const { proposalId } = await params;
  const body = (await request.json().catch(() => null)) as NoteBody | null;
  if (!body?.note?.trim()) {
    return jsonValidationError({
      message: "Please correct the highlighted fields and try again.",
      fields: { note: "Enter a note and try again." },
    });
  }

  const proposal = await ensureProposalAccess(supabase, wsContext.context.workspace_id, proposalId);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status === "draft") {
    return NextResponse.json({ error: "Notes are only available after submission." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("salary_review_notes")
    .insert({
      cycle_id: proposalId,
      employee_id: body.employeeId ?? null,
      step_id: body.stepId ?? null,
      workspace_id: wsContext.context.workspace_id,
      created_by: wsContext.context.user_id,
      note: body.note.trim(),
    })
    .select("*")
    .single();

  if (error) {
    return jsonServerError(error, {
      defaultMessage: "We could not save this note right now.",
      logLabel: "Salary review proposal note create failed",
    });
  }

  const { error: auditError } = await supabase.from("salary_review_audit_events").insert({
    cycle_id: proposalId,
    workspace_id: wsContext.context.workspace_id,
    employee_id: body.employeeId ?? null,
    actor_user_id: wsContext.context.user_id,
    event_type: "proposal_note_added",
    payload: {
      stepId: body.stepId ?? null,
    },
  });
  if (auditError) {
    return jsonServerError(auditError, {
      defaultMessage: "We could not save note activity right now.",
      logLabel: "Salary review proposal note audit failed",
    });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
