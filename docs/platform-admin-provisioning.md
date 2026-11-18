# Provisioning a RallyOn platform administrator

The venue-claim review workflow authorizes platform administrators using the Supabase Auth JWT claim:

`app_metadata.role = admin`

This value must be assigned by a trusted Supabase project administrator. It must never be stored in `user_metadata`, accepted from a browser form, or exposed through a client-side profile update.

## First administrator

1. Open the correct RallyOn Supabase project in the Supabase Dashboard.
2. Go to **Authentication → Users** and identify the operator account by its verified email address.
3. Open that user's details and edit the **App Metadata** JSON.
4. Add or merge the property `"role": "admin"` without removing existing app metadata.
5. Save the user, then have the operator sign out and sign in again so the refreshed session JWT includes the new app metadata.
6. Confirm the Platform Admin entry appears in the RallyOn profile. Confirm the Claims tab can load claim requests.

Example app metadata (merge with existing values; do not blindly replace existing metadata):

```json
{
  "role": "admin"
}
```

## Security checks

- The UI visibility flag is only a convenience. The database RLS policy and `review_venue_claim_request` RPC independently enforce the admin role from `auth.jwt().app_metadata`.
- A normal authenticated user must not be able to list other applicants' claims, invoke the review RPC successfully, or update venue ownership directly.
- Do not grant browser clients UPDATE or DELETE privileges on `venue_claim_requests`.
- Review approvals are transactional: the venue must still be unclaimed when ownership is assigned.

## Removing administrator access

Remove the `role` property from the user's App Metadata in Supabase Auth, then require a new sign-in so the user's JWT no longer carries the role. Review access is denied by the database even if a stale client still displays an admin-only screen.

## Operational note

Use individual named operator accounts, not shared credentials. Keep a record of who was granted admin access and when.