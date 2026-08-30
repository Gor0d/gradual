import type { User } from "@gradual/shared-types";

/**
 * Shape of a `users` row as returned by the Supabase client (PostgREST),
 * which reflects actual Postgres column names — snake_case. This is *not*
 * the same shape as Drizzle's `InferSelectModel<typeof users>` (camelCase),
 * which only applies to rows fetched through `lib/db/client.ts`. Every
 * Supabase-client read/write against `users` should go through this type
 * and `toUser` instead of casting directly to the shared `User` type.
 */
export type UserRow = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
