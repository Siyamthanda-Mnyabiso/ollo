/**
 * Admin is a role stored in app_metadata, which only the service role can change.
 * user_metadata is editable by the user, so it is never read for roles.
 */
export function isAdminUser(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  return user?.app_metadata?.role === "admin";
}
