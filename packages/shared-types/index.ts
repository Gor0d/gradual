import type { InferSelectModel } from "drizzle-orm";
import type { users } from "@gradual/db-schema";

export type User = InferSelectModel<typeof users>;
