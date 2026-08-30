"use server";

import { randomUUID } from "node:crypto";
import { organizationMembers, organizations } from "@gradual/db-schema";
import { redirect } from "next/navigation";

import { ensureCurrentUser } from "@/lib/auth/ensure-user";
import { db } from "@/lib/db/client";

export type CreateOrganizationState = { error?: string };
export const createOrganizationInitialState: CreateOrganizationState = {};

function slugify(value: string): string {
  const base = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54).replace(/-$/g, "");
  return base.length >= 3 ? base : "organizacao";
}

export async function createOrganization(
  _state: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  const user = await ensureCurrentUser();
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (name.length < 3 || name.length > 120) {
    return { error: "Use um nome entre 3 e 120 caracteres." };
  }

  const slug = `${slugify(name)}-${randomUUID().slice(0, 6)}`;
  try {
    await db.transaction(async (transaction) => {
      const [organization] = await transaction.insert(organizations).values({ name, slug })
        .returning({ id: organizations.id });
      if (!organization) throw new Error("Organization insert returned no row");
      await transaction.insert(organizationMembers).values({
        organizationId: organization.id, userId: user.id, role: "owner",
      });
    });
  } catch {
    return { error: "Não foi possível criar a organização. Tente novamente." };
  }
  redirect(`/org/${slug}/dashboard`);
}
