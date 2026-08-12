# PRATIKSHYA FASHON — Attendance & Performance

Phase 18. One workforce module for check-in, leave, targets, achievement and
manager review. It extends the Phase 9/10 employee system; it does not invent
a second people register, permission catalogue or activity log.

---

## 1. Principle

Attendance and performance are operational records about **existing
employees**. Every row carries `employeeId` from the house register
(`PF-SLS-00124`). There is no parallel identity, no `adminAttendance` store,
and no customer-facing surface.

Three stores, one event:

| Store | Key | Owner |
| --- | --- | --- |
| Attendance | `pratikshya_attendance` | `attendanceRepository` |
| Leave | `pratikshya_leave` | `leaveRepository` |
| Performance | `pratikshya_performance` | `performanceRepository` |

Working hours and the holiday calendar live in `pratikshya_attendance_settings`
so Phase 20 Settings can lift them without a migration.

All three announce `pratikshya-workforce-changed`. `WorkforceContext` is only
a revision counter — it is not a second dataset.

The earlier Phase 9 map `pratikshya_employee_attendance` is migrated once if
it still holds a live check-in, then left unread.

---

## 2. Attendance

### Record

```
attendanceId
employeeId
employeeNameSnapshot
date                YYYY-MM-DD
checkIn / checkOut  ISO or null
status
workMinutes
lateMinutes
earlyLeaveMinutes
locationId          inventory location (store / warehouse)
notes
corrections[]       previous, next, actor, timestamp, reason
createdAt / updatedAt
```

### Statuses

`PRESENT` `LATE` `ABSENT` `HALF_DAY` `LEAVE` `HOLIDAY` `WEEK_OFF` `ON_DUTY`
`PENDING_CORRECTION` `NOT_CHECKED_IN`

Constants live in `src/config/attendanceConfig.js`. Components never invent
status strings.

### Working hours

Demo house day:

- start `09:30`
- end `18:30`
- late after start + 10 minutes
- half day below 240 minutes
- full day 540 minutes
- week-off: Sunday
- Independence Day 15 August 2026 is a holiday

Per-employee shift text on the profile is editorial. The clock uses the house
day until Settings exists.

### Check-in / check-out

1. Employee (or an authorised manager) punches in once per date.
2. Duplicate check-in is rejected.
3. Check-out before check-in is rejected.
4. Duplicate check-out is rejected.
5. Suspended / inactive accounts cannot punch.
6. Approved leave for today blocks check-in.
7. Late minutes are recorded without punitive copy:
   *“You checked in 24 minutes late.”*
8. Early checkout records `earlyLeaveMinutes`. It does not mark absent.
9. Hours are `checkOut − checkIn`, formatted as `7h 42m` from one helper.

Location is the assigned inventory location (Main Store or Main Warehouse)
labelled **demo, not GPS**. There is no biometric claim.

### Attendance %

Eligible working days exclude `LEAVE`, `HOLIDAY` and `WEEK_OFF`.

| Status | Credit |
| --- | --- |
| PRESENT, LATE, ON_DUTY, PENDING_CORRECTION | 1 |
| HALF_DAY | 0.5 |
| ABSENT, NOT_CHECKED_IN | 0 |

`attendance % = present-equivalent / eligible × 100`

The same function feeds the employee month, the admin report and the
performance score. UI never recalculates it.

### Corrections

Admin and store managers with `attendance.correct` / `attendance.manage` may
edit check-in, check-out, status and notes. Every save appends a correction
entry and writes `ATTENDANCE_CORRECTED` to the existing activity diary.

### Reports

Daily / weekly / monthly summaries (present, late, absent, leave, average
hours) export as CSV with no extra dependency.

---

## 3. Leave

Leave is **not** duplicated inside attendance. An approved request writes
`LEAVE` onto the matching working days of `pratikshya_attendance`.

```
leaveId
employeeId
leaveType           CASUAL | SICK | EARNED | EMERGENCY | OTHER
startDate / endDate
days
reason
status              PENDING | APPROVED | REJECTED | CANCELLED
requestedAt
reviewedAt / reviewedBy / reviewNote
```

- Overlapping pending or approved requests are blocked.
- Reject requires a reason, which the employee can read.
- Re-approving an already approved request is idempotent.
- Employees cancel only `PENDING`. Managers may cancel approved leave and
  the attendance days revert.

Routes: `/employee/attendance/leave`. Admin and managers also review from
`/admin/attendance`.

---

## 4. Performance

### Period

Monthly first (`2026-08` → August 2026). `periodFromDate` already understands
quarterly and yearly keys so those land later without a rewrite.

### Targets

Role-aware templates in `performanceConfig.js`. Warehouse staff never receive
a sales target. Values live on the record (`targetId`, `metric`,
`targetValue`, `unit`, `createdBy`, `createdAt`) — never inside JSX.

### Achievement

`achievementService` reads existing systems:

- assisted floor tickets
- house orders / fulfillment
- inventory movements and stock accuracy
- support cases
- styling appointments and requests
- attendance summaries

It does not invent a second sales or stock ledger. Where a metric has no
repository event in the period, the actual is `0` (or a ledger-derived
accuracy), not a decorative number.

Achievement `% = actual / target × 100`. Inverted metrics (inventory
adjustments) treat “at or under target” as 100%. Display may cap; the stored
actual is preserved.

### Score

Transparent weights, one helper:

- 50% target achievement
- 25% attendance
- 25% operational quality (role-specific metric: conversion, stock accuracy,
  resolution rate, dispatch accuracy, team achievement)

Employees cannot edit the score, change targets, or finalize their own
review. Store managers review their scope. Super Admin / Admin Portal has
full access.

### Status

`NOT_STARTED` → `IN_PROGRESS` → `REVIEW_PENDING` → `REVIEWED` → `FINALIZED`

Finalized records freeze achievements. Re-opening requires
`performance.manage`.

Feedback fields: strengths, areas for improvement, manager feedback,
employee comments.

---

## 5. Permissions

Added to the existing catalogue (`employeePermissions.js`), not a second
system.

| Key | Meaning |
| --- | --- |
| `attendance.view` / `checkin` / `checkout` / `manage` / `correct` | Presence |
| `leave.create` / `view` / `approve` / `reject` / `manage` | Leave |
| `performance.view` / `review` / `manage` | Targets and reviews |

`*.manage` implies the sibling keys, matching the offers pattern.

| Role | Scope |
| --- | --- |
| Super Admin | Full |
| Store Manager | Own punch + team attendance, leave, targets, reviews |
| Sales / Inventory / Warehouse / Support / Stylist | Own attendance, leave, performance |

Pages hide controls the actor cannot use. Services still refuse the write.
Direct URLs to `/admin/attendance` stay behind `AdminProtectedRoute`.
`/employee/attendance` and `/employee/performance` stay behind
`EMPLOYEE_ROUTE_RULES`.

Employees never see another person's leave reason, attendance, or review
unless their role grants team scope.

---

## 6. Surfaces

**Employee**

- Dashboard still carries today's punch and the current target card
- `/employee/attendance` — check-in, month summary, history, team today
- `/employee/attendance/leave` — request + own (and pending, if reviewer)
- `/employee/performance` — targets, achievement, attendance, review, history
- `/employee/performance/:employeeId` — manager review of a teammate

**Admin**

- `/admin/attendance` — house metrics, directory, leave queue, report
- `/admin/attendance/:employeeId` — profile, month, corrections
- `/admin/performance` — reviewed / achievement / pending directory
- `/admin/performance/:employeeId` — targets, score, review, history

Dashboards read the same summaries. Customer routes are untouched.

---

## 7. Activity

Existing diary (`activityService`) gained:

`ATTENDANCE_CHECKED_IN` `ATTENDANCE_CHECKED_OUT` `ATTENDANCE_CORRECTED`
`LEAVE_REQUESTED` `LEAVE_APPROVED` `LEAVE_REJECTED` `PERFORMANCE_REVIEWED`

No second audit log.

---

## 8. Demo limitations

- Browser localStorage. Not payroll, not a backend clock.
- Location is the assigned floor, clearly labelled, not GPS.
- No biometric / face recognition.
- Seeded records are written only when the three stores are empty, always
  against the existing employee register, and marked `seeded: true`.
- House hours are shared. Individual shift strings are not yet enforced.
- Achievement volume follows whatever order / inventory / care data the
  browser already holds.

A future API can replace the repositories without changing the pages.

---

## 9. Files

```
src/config/attendanceConfig.js
src/config/performanceConfig.js
src/services/workforce/*
src/context/WorkforceContext.jsx
src/components/workforce/*
src/pages/employee/EmployeeAttendance.jsx
src/pages/employee/EmployeeLeave.jsx
src/pages/employee/EmployeePerformance.jsx
src/pages/admin/attendance/*
src/pages/admin/performance/*
```
