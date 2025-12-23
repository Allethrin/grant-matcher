# MinnePrairie Grant Matcher

A tool that helps Twin Cities property owners find grants for native landscaping projects based on their address. Enter an address, get matched to your watershed, see available programs.

**Live:** Currently at `allethrin.github.io/grant-matcher/` (pending move to `grants.minneprairie.com`)

## Files

| File | Purpose |
|------|---------|
| `index.html` | The main tool - single-page app with all UI and logic |
| `grants-database.json` | All grant/program data. See `meta.field_reference` for schema |
| `metro_watersheds.geojson` | Watershed boundaries for address→watershed matching |
| `images/` | Hero background photos (tree frog, black-eyed susan, biomass) |
| `coverage-map.html` | Dev tool - visualize which watersheds have programs documented |
| `VALIDATION.md` | QA checklist for adding/updating grant cards |

## Running Locally

```bash
cd grant-matcher
python3 -m http.server 8765
# Open http://localhost:8765/
```

## Updating the Grants Database

### Monthly Maintenance
1. Open each program URL in `grants-database.json`
2. Verify amounts, eligibility, and application status are current
3. Update `meta.last_updated` when done

### Adding a New Watershed
1. Find the watershed ID in `metro_watersheds.geojson` (the `id` field)
2. Research their programs (check watershed site, Blue Thumb, SWCD)
3. Add entry to `watershed_programs` in `grants-database.json`
4. Remove from `watersheds_needing_research` array
5. Run validation checklist (see `VALIDATION.md`)
6. Test with an address in that watershed

### Adding a County-Restricted Program
1. Add `restrict_to_counties: ["county-name"]` to the program
2. Ensure watershed→county mapping exists in `index.html` (search for `watershedCounties`)

## Key Design Decisions

- **Statewide programs** show for everyone (unless `restrict_to_counties` limits them)
- **Watershed programs** only show when address falls within that watershed
- **Button text** defaults to "Learn more & apply →" but can be customized with `link_text` field
- **No contact info in cards** - users get that from the linked pages

## Coverage Status

Currently 17 of 33 metro watersheds documented (51%). Remaining 16 are mostly outer-ring suburbs. Check `coverage-map.html` for visual.

## Deployment

The tool is static HTML - just needs a web server. Currently on GitHub Pages. Pending DNS setup to serve from `grants.minneprairie.com` (blocked on getting domain registrar access from Ezra).
