# RallyOn User & Profile Master Tracker

**Scope:** Users, profiles, authentication, sports preferences, favorite teams, favorite venues, social graph, location, privacy, notifications, and account lifecycle.

**Status:** Active
**Last reviewed:** 2026-11-12

## Phase 0 — Baseline / Guardrails
- [x] Audit current auth/profile implementation
- [x] Audit current Supabase profile-related tables
- [x] Confirm current RLS/security advisor status
- [ ] Establish canonical source of truth: Auth vs profiles vs preference tables
- [ ] Document migration/backfill strategy before schema changes

## Phase 1 — Core User Identity
- [ ] Normalize profiles as the canonical RallyOn profile record
- [ ] Remove dependence on duplicated auth user metadata profile fields
- [ ] Add username uniqueness + validation
- [ ] Implement production account deletion
- [ ] Add profile avatar storage using Supabase Storage
- [ ] Verify profile CRUD + RLS with authenticated-user tests

## Phase 2 — Sports Identity
- [ ] Create canonical sports table
- [ ] Create canonical leagues table
- [ ] Create canonical teams table
- [ ] Add external provider/team identifiers
- [ ] Create user_favorite_sports
- [ ] Create user_favorite_leagues
- [ ] Create user_favorite_teams
- [ ] Backfill existing profiles.favorite_teams
- [ ] Preserve existing frontend favorite-team behavior during migration
- [ ] Add favorite-team notification preferences/subscriptions

## Phase 3 — Venue Preferences
- [ ] Make venue_favorites the single source of truth
- [ ] Remove/retire profiles.saved_venue_ids after migration
- [ ] Verify favorite venue reads/writes and RLS
- [ ] Connect favorite venues to recommendation intelligence

## Phase 4 — Location & Presence
- [ ] Separate home location from current device location
- [ ] Create current-location state with freshness/updated timestamp
- [ ] Respect locationPermissionStatus
- [ ] Implement location-sharing privacy enforcement
- [ ] Keep explicit venue check-ins separate from inferred location
- [ ] Verify venue presence/check-in expiration behavior

## Phase 5 — Social Graph
- [ ] Create user relationship/friendship model
- [ ] Friend requests
- [ ] Accept/decline/remove/block
- [ ] Mutual friends
- [ ] Friends at venues
- [ ] Friends attending games
- [ ] Activity/privacy controls
- [ ] RLS tests for social data

## Phase 6 — Privacy & Notifications
- [ ] Make privacy settings authoritative at database/API level
- [ ] Audit profile visibility
- [ ] Audit friend visibility
- [ ] Audit check-in visibility
- [ ] Audit location sharing
- [ ] Audit venue presence visibility
- [ ] Normalize notification preferences if needed
- [ ] Add per-team/per-league notification subscriptions

## Phase 7 — RallyOn Identity & Intelligence
- [ ] Profile sports identity
- [ ] Favorite teams/venues summary
- [ ] Games attended
- [ ] Check-in history
- [ ] Watch-party/social participation
- [ ] RallyOn reputation/profile stats
- [ ] Personalization signals
- [ ] Recommendation feedback loop

## Production Readiness
- [ ] No duplicate profile sources of truth
- [ ] All exposed user-data tables have appropriate RLS
- [ ] No client-side authorization decisions based on editable metadata
- [ ] Account deletion verified
- [ ] Privacy behavior verified
- [ ] Location data lifecycle verified
- [ ] Migration/backfill verified
- [ ] Regression tests passing
- [ ] Production deployment checklist completed

## Current Priority Queue
### P0 — Do first
1. Canonical profile/source-of-truth cleanup
2. Canonical sports/leagues/teams model
3. Relational favorite teams
4. Favorite-team migration/backfill
5. Account deletion
6. Privacy/RLS verification

### P1 — Next
7. Current-location model
8. Avatar storage
9. Friends/social graph
10. Favorite venue cleanup

### P2 — Later
11. Notification subscriptions
12. Activity/history
13. RallyOn identity/reputation
14. Advanced personalization
