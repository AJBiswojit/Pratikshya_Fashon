/**
 * PRATIKSHYA FASHON — Explicit migration functions (Phase 2, Step F).
 *
 * Phase 1 identified that ordinary catalogue READS trigger draft creation,
 * reconciliation and canonical media assignment (side effects hidden inside
 * repository reads). Long-term, READ must be READ-ONLY and MIGRATION must be
 * an EXPLICIT COMMAND.
 *
 * Phase 2 does NOT remove the compatibility read-time syncs (removing them
 * could break existing browser registers). Instead it introduces explicit,
 * idempotent migration entry points that an operator can run deliberately,
 * and it proves (in tests) that once migration state is settled, ordinary
 * reads no longer change workflow records.
 *
 * These functions are safe: they are additive, idempotent and never
 * auto-publish; they change no IDs and no ownership decisions.
 */

import catalogRepository from "../catalogRepository.js";
import { ensureKidsDraftRecords } from "../productDraftMigration.js";
import {
  ensureCatalogueReconciliation,
  syncCanonicalMediaAssignment,
  getCatalogueReconciliationSummary,
} from "../catalogueReconciliation.js";

/**
 * Runs the additive workflow migrations explicitly and returns a report.
 * This is the deliberate "migration mode" entry point; ordinary reads keep
 * their compatibility behavior for now (documented in Phase 2 doc).
 */
export const runExplicitMigrations = () => {
  const register = catalogRepository.all();
  const withKids = ensureKidsDraftRecords(register);
  const reconciled = ensureCatalogueReconciliation(withKids);
  const canonicalAssignments = syncCanonicalMediaAssignment(reconciled);

  return {
    productCount: reconciled.length,
    kidsDrafts: reconciled.filter((product) => /^KID-\d{3}$/.test(String(product.id))).length,
    canonicalAssignments,
    reconciliation: getCatalogueReconciliationSummary(reconciled),
  };
};

export default {
  runExplicitMigrations,
};
