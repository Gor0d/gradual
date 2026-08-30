import { notFound } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OrganizationRole = "owner" | "admin" | "member";

export type OrganizationContext = {
  organization: {
    id: string;
    name: string;
    slug: string;
    branding: { logoUrl?: string; primaryColor?: string };
  };
  role: OrganizationRole;
};

type OrganizationRow = OrganizationContext["organization"];
type MembershipRow = { role: OrganizationRole };

/** Resolves the tenant through RLS-gated reads from the caller's session. */
export async function requireOrganizationContext(slug: string): Promise<OrganizationContext> {
  await requireCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data: organization, error: organizationError } = await supabase
    .from("organizations").select("id, name, slug, branding").eq("slug", slug)
    .maybeSingle<OrganizationRow>();

  if (organizationError || !organization) notFound();

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members").select("role").eq("organization_id", organization.id)
    .maybeSingle<MembershipRow>();

  if (membershipError || !membership) notFound();
  return { organization, role: membership.role };
}

export async function listCurrentOrganizations(): Promise<OrganizationContext[]> {
  await requireCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("organization_members").select("organization_id, role")
    .returns<Array<{ organization_id: string; role: OrganizationRole }>>();

  if (membershipsError) throw membershipsError;
  if (!memberships?.length) return [];

  const roleByOrganization = new Map(
    memberships.map((membership) => [membership.organization_id, membership.role]),
  );
  const { data: organizations, error: organizationsError } = await supabase
    .from("organizations").select("id, name, slug, branding")
    .in("id", [...roleByOrganization.keys()]).order("name").returns<OrganizationRow[]>();

  if (organizationsError) throw organizationsError;
  return (organizations ?? []).flatMap((organization) => {
    const role = roleByOrganization.get(organization.id);
    return role ? [{ organization, role }] : [];
  });
}
