// Canonical status values for the String `status` columns in prisma/schema.prisma.
// The schema stores these as plain strings (no DB enum), so this is the single
// list code can enumerate — e.g. the Jarvis API reports a count for every one,
// including zeros. Keep in sync with the schema comments and the routes that
// write them (propose/approve routes, Stripe webhook, ship route).

export const PET_DESIGN_STATUSES = ["submitted", "proposals_sent", "approved", "ordered"] as const;
export type PetDesignStatus = (typeof PET_DESIGN_STATUSES)[number];

export const ORDER_STATUSES = ["pending", "shipped"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
