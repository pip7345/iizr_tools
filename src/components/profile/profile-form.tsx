"use client";

import { useActionState, useEffect, useRef } from "react";

import { updateProfileAction } from "@/actions/user-actions";
import type { ActionState } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialState: ActionState = { status: "idle" };

type ProfileFormProps = {
  preferredDisplayName: string;
  bio: string;
  location: string;
};

export function ProfileForm({ preferredDisplayName, bio, location }: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      // No reset needed, keep values
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-lg border border-[hsl(var(--border))] card-gradient p-6 shadow-sm"
    >
      <div className="space-y-2">
        <label htmlFor="preferredDisplayName" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Display name
        </label>
        <Input
          id="preferredDisplayName"
          name="preferredDisplayName"
          defaultValue={preferredDisplayName}
          placeholder="How you'd like to be shown"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Bio
        </label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={bio}
          placeholder="A short bio about yourself"
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium text-[hsl(var(--foreground))]">
          Location
        </label>
        <Input
          id="location"
          name="location"
          defaultValue={location}
          placeholder="City, Country"
        />
      </div>

      <FormMessage
        message={state.message}
        tone={state.status === "success" ? "success" : state.status === "error" ? "error" : "default"}
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
