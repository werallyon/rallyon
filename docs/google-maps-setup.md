# Google Maps setup for RallyOn

The venue map is implemented against the Google Maps JavaScript API. The app intentionally falls back to a DFW venue list until a restricted browser key is configured.

## Required now

1. Enable billing on the Google Cloud project.
2. Enable **Maps JavaScript API**.
3. Create a browser API key.
4. Restrict the key by HTTP referrer to the RallyOn production domain and approved preview domains.
5. Restrict the key to the Maps JavaScript API until additional Google services are enabled.
6. Set `VITE_GOOGLE_MAPS_API_KEY` in the deployment environment and rebuild the frontend.

Do not commit the key or paste an unrestricted key into source control or chat. A browser key is visible to visitors by design, so HTTP-referrer and API restrictions are essential.

## Planned Google services

- **Places API (New):** venue discovery, place details, opening hours, ratings and official business links. Places response normalization is prepared, but live Places search is not enabled in this change.
- **Routes API:** route distance and travel-time estimates when RallyOn adds in-app route calculations. Current directions continue to open Google Maps externally.

Enable and authorize these services only when their corresponding feature is ready. The same restricted browser key can be used for Maps JavaScript and Places if the API restrictions are updated accordingly.

## Without a key

- The app does not attempt to load Google Maps.
- The DFW venue list remains browseable and respects RallyOn's venue-status and game-programming filters.
- Venue selection, venue intelligence, saved venues and external directions remain available.
- No fake map, simulated GPS location or Austin-specific map geometry is shown.
