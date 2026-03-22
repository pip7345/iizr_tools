"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createProjectAction,
  initialProjectActionState,
} from "@/actions/project-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialProjectActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.06)]"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-black/45">
          New project
        </p>
        <h2 className="text-2xl font-semibold text-[var(--color-foreground)]">
          Create a project with a Server Action
        </h2>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-black/70">
          Name
        </label>
        <Input id="name" name="name" placeholder="Q2 launch plan" required />
        <FormMessage message={state.errors?.name?.[0]} tone="error" />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-black/70">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          placeholder="Short description, internal context, or delivery notes"
          maxLength={240}
        />
        <FormMessage message={state.errors?.description?.[0]} tone="error" />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : state.status === "error" ? "error" : "default"}
      />

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
