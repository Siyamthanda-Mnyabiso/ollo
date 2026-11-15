import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./server";
import { isAdminUser } from "./roles";

/**
 * Call this at the top of every admin page, route handler and server action. The proxy also
 * blocks /admin, but a server action can be called without going through the page, so each
 * admin entry point checks the role again on the server.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!isAdminUser(user)) redirect("/dashboard");
  return user;
}
