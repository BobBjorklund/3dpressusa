import { ordersHandler, methodNotAllowed } from "@/lib/jarvis-api";
import { prismaJarvisDb } from "@/lib/jarvis-db";

// Read-only Jarvis endpoint — see src/lib/jarvis-api.ts.
export const GET = ordersHandler(prismaJarvisDb);
export { methodNotAllowed as POST, methodNotAllowed as PUT, methodNotAllowed as PATCH, methodNotAllowed as DELETE };
