# PRATIKSHYA FASHON settings

Phase 20 introduces the single `pratikshya_settings` localStorage document, accessed through `settingsRepository`. It exposes `getSettings`, `getSection`, `updateSection`, `updateSetting`, `resetSection`, and `resetToDefaults`; malformed storage safely recovers only this key to defaults.

## Sections and defaults
Business profile/branding, store, warehouse defaults, per-day hours, attendance (09:30–18:30, 10-minute late threshold, 240/540-minute day thresholds), holidays, disabled GST, shipping (₹99/free ₹5,000), payments, orders, returns (7 days), inventory, employees, notifications, customer experience, offer defaults, and media rules are namespaced sections. Existing location and warehouse records remain operational sources of truth; settings stores only defaults and operating preferences.

## Consumers and migration
The legacy attendance settings are migrated on first settings read. Attendance now reads central attendance and active holidays. Bag and checkout delivery fees resolve central shipping values for new calculations. Existing order totals, returns, attendance entries, inventory movements, and analytics snapshots are not mutated. Return/order/product/inventory services retain business logic; settings only supplies parameters.

## Validation and safety
The UI validates email, GSTIN when supplied, GST split consistency and non-negative operational thresholds. GST starts disabled and is explicitly labelled unconfigured. Settings does not upload media: branding uses media references. External payments and notification delivery remain demo configuration only.

## Access, history, and future migration
Settings is under the existing authenticated Super Admin admin route; customer routes never enter the admin layout. Updates and section resets are recorded in the shared `activityService` as `SETTINGS_UPDATED` and `SETTINGS_RESET`. Saves are explicit, cancellation restores persisted values, and reset confirms before affecting just one section. A backend migration should replace localStorage repository persistence while preserving this section contract and enforce permissions server-side.
