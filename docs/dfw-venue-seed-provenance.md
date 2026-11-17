# DFW venue seed provenance

Updated: 2026-11-17

The DFW market catalog includes 26 cities. This first-pass production directory contains 16 real DFW businesses/venues with a published street address and a geospatial point. The records are **unclaimed directory listings**, not venue-verified RallyOn partners. No screen counts, sound-on promises, sports packages, live programming, or team-specific watch commitments are written into `venue_truth` or `venue_game_programming`.

## Seeded venues

| Venue | City | Address / identity source | Coordinate source |
|---|---|---|---|
| Frankie's Downtown | Dallas | [Official contact page](https://www.frankiesbar.com/contact-us) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/frankies-downtown-llc-mb903898) |
| Press Box Grill | Dallas | [Official website](https://pressboxgrill.com/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/the-press-box-grill-mb751542) |
| Happiest Hour | Dallas | [Official location page](https://www.happiesthourdallas.com/location/happiest-hour/) | [OpenTable listing](https://www.opentable.com/r/happiest-hour) |
| Christies Sports Bar | Dallas | [Official website](https://www.christiessportsbar.com/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/christies-sports-bar-mb226117) |
| Harwood Arms | Dallas | [Official location page](https://www.harwoodarmsdallas.com/location/harwood-arms-dallas/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/harwood-arms-mb1073013) |
| Texas Live! | Arlington | [Official visitor information](https://texas-live.com/plan-your-visit) | [Published venue coordinates](https://ftworth.kidsoutandabout.com/content/texas-live) |
| Sidecar Social Frisco | Frisco | [Official location page](https://sidecarsocial.com/frisco/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/sidecar-social-mb200088405) |
| The Green Gator | Frisco | [FC Dallas official watch-party / where-to-watch page](https://www.fcdallas.com/watchparty) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/the-green-gator-rm832559) |
| Fat Daddy's Sports & Spirits Cafe | Mansfield | [Official sports page](https://www.fatdaddyslive.com/sports) | [Venue coordinates from Foursquare check-in listing](https://untappd.com/v/fat-daddy-s-sports-spirits-cafe/77762/photos) |
| Morton's Tavern | Fort Worth | Business directory record: 212 Lipscomb Street, Fort Worth, TX 76104 | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/mortons-tavern-mb200156159) |
| Texas Republic Fort Worth | Fort Worth | [Official locations page](https://www.txrbars.com/locations) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/texas-republic-mb985562) |
| Buffalo Bros Sundance Square | Fort Worth | [Official location page](https://www.buffalobrostexas.com/location/buffalo-bros-sundance-square/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/buffalo-bros-mb106048803) |
| The Derbyshire Pub | Frisco | [Official website and location](https://derbyshirefrisco.com/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/the-derbyshire-mb200103843) |
| Walk-On's Sports Bistreaux The Colony | The Colony | [Official location page](https://locate.walk-ons.com/tx/thecolony/restaurants-406.html) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/walk-ons-sports-bistreaux-mb200185850) |
| BoomerJack's Bedford | Bedford | [Official location page](https://boomerjacks.com/location/bedford/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/boomerjacks-grill-bar-mb705268) |
| BoomerJack's Grapevine | Grapevine | [Official location page](https://boomerjacks.com/location/grapevine/) | [Texas TABC licensed-premises listing](https://drinkedin.net/bars/boomerjacks-grill-bar-19-mb105755997) |

## Data rules

- `is_demo_data = false` because these are real business listings, not synthetic demo fixtures.
- `claimed = false`; no operator has authenticated ownership or control through RallyOn.
- `google_place_id`, Google Place payload, reliability score, and claimed owner are left null until matched/verified.
- `venue_truth = {}`; venue-specific equipment and operational facts are not inferred from a generic category or directory description.
- No rows are added to `venue_game_programming`. A place being a sports bar does not prove that it will show a particular event, network, or audio feed.
- DFW remains `PREPARING`. The directory is a starting inventory, not proof of complete metro coverage or a market launch threshold.

Before marking DFW LIVE, reconcile these entries against a current Google Places/business identity record, confirm business operating status and exact pin placement, then collect operator or trusted-source confirmation of actual game programming. Any venue can be corrected or removed through the normal venue-data maintenance path.
