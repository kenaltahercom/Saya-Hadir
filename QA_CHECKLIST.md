# Saya Hadir — QA Checklist

## Visual/UI
- [ ] Plus Jakarta Sans loaded explicitly; weight usage consistent.
- [ ] No blue-colored text in headings, labels, body, links, or metrics.
- [ ] Desktop and mobile layouts reviewed independently.
- [ ] No decorative gradients/glow/glass effects, fake testimonials, fake customer counts, or ungrounded charts.
- [ ] Every visible CTA has a real action or is clearly disabled with a reason.
- [ ] Loading, empty, error, permission denied, validation, success and disabled states exist.
- [ ] Color is not the only status indicator; labels and icons are present where needed.
- [ ] Keyboard focus and form labels are clear; reduced motion is respected.

## Attendance domain
- [ ] Official timestamp is generated on trusted server/database side.
- [ ] Check-in allowed only for active membership and valid work-day state.
- [ ] Check-out only occurs after successful check-in; duplicate submissions are safe.
- [ ] Out-of-radius and poor-accuracy attempts are rejected with useful explanation.
- [ ] Location permission denied/retry/network interruption have clear recovery paths.
- [ ] No background location tracking.
- [ ] Late/absent states are computed according to schedule, not guessed.
- [ ] Manual correction records actor, reason, time and changed values.

## Security / multi-tenant
- [ ] RLS enabled on every table exposed to client API.
- [ ] Grants are explicit and minimal.
- [ ] Owner/HR cannot read tenants they don't belong to.
- [ ] Employee cannot read other employees' records or elevate own role.
- [ ] Cross-tenant foreign key combinations are prevented.
- [ ] Invitation token expiry/replay tests pass.
- [ ] Service-role/secret keys do not appear in browser bundle or committed files.
- [ ] Storage buckets for private docs use policies.
- [ ] Each critical table/operation has allow and deny tests.

## Reporting / files
- [ ] Filters in exported CSV match displayed filters.
- [ ] Employee permission cannot export company-wide data.
- [ ] No unnecessary raw GPS coordinates in routine reports.
- [ ] CSV import preview/validation occurs before persistence (if enabled).
- [ ] Error rows and job results are reported accurately.

## Release
- [ ] Fresh install instructions validated.
- [ ] Lint/build and relevant tests pass.
- [ ] Production environment variables configured without client-side secrets.
- [ ] Auth redirect URLs and Vercel route refresh tested.
- [ ] Migrations are tracked and reproducible.
- [ ] Mobile/desktop smoke test completed.
- [ ] Known issues and unverified behaviors listed honestly.
