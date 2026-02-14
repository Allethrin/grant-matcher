# Financial Incentives Research: Beyond Watershed Grants

**Date**: 2026-02-14
**Purpose**: Expand Grant Matcher to surface all financial benefits for native landscaping, not just watershed district grants.
**Status**: Initial research complete, needs verification pass on some details

---

## Why This Matters

Many addresses currently return thin results — e.g., Lawns to Legumes (closed) and maybe one small watershed program. By adding city stormwater credits, county SWCD programs, and other incentives, we can show users a much more compelling picture of available financial support. The Minneapolis stormwater credit alone (35-45% ongoing bill reduction) is more valuable than most one-time grants.

---

## Tier 1: High-Value Programs

### City Stormwater Utility Credits

**Minneapolis Residential Stormwater Credit**
- Admin: City of Minneapolis Public Works
- Value: 35% stormwater bill reduction (45% in Green Zones) — ONGOING annual savings
- Eligible: Rain gardens, pervious pavement
- Property types: Residential
- Application window: May 1 - October 1 annually
- Geographic: Minneapolis city limits
- URL: https://www.minneapolismn.gov/resident-services/utility-services/stormwater/residential-stormwater-credits/
- Notes: This is not a one-time grant — it's a permanent utility bill reduction. Very compelling. Rain barrels NOT eligible.

**St. Louis Park Rainwater Rewards Program**
- Admin: City of St. Louis Park
- Value: TBD — verify current amounts
- Eligible: Rain barrels, stormwater BMPs
- Property types: Residential
- Geographic: St. Louis Park city limits
- URL: https://www.stlouisparkmn.gov/government/departments-divisions/natural-resouces/rainwater-rewards-program
- Status: NEEDS VERIFICATION — search results referenced 2025 funding cycle. Confirm 2026 availability and amounts.

### County SWCD Programs (separate layer from watershed districts)

**Dakota County SWCD — Landscaping for Clean Water**
- Admin: Dakota County Soil & Water Conservation District
- Amount: $400 grant upon completion (updated from $250)
- Eligible: Rain gardens, native gardens, shoreline plantings
- Property types: Residential, school, church
- Prerequisite: Must complete free Landscaping for Clean Water class
- Geographic: Dakota County residents + Lower Mississippi River WMO residents in Ramsey County
- Application: 3 rounds in 2026
- URL: https://dakotaswcd.org/landscaping-for-clean-water/
- Notes: Stacks with watershed district grants. Class requirement ensures project quality. On-site technical assistance included.

**Carver County WMO — Three Programs (verified via Blue Thumb 2026)**
- Admin: Carver County Water Management Organization (via Carver SWCD)
- **Improving Water Quality**: 75% of cost, up to $5,000 — rain gardens, native plantings, shoreline restoration, water retention
- **Pollinator Habitat**: Up to $5,000 (or $2/sqft) — turf conversion to pollinator habitat, min 250 sqft
- **Shoreline Habitat**: Up to $2,500 (or $2/sqft) — shoreline buffers, min 250 sqft + 10ft buffer width
- Property types: Residential, commercial
- Application: Year-round, prioritized by submission date
- Geographic: Within Carver County WMO boundaries (some areas served by RPBCWD or Lower MN River WD instead)
- URL: https://bluethumb.org/local-grants-for-native-plantings-2026/ (carvercountymn.gov has broken links)
- Contact: 952-466-5230
- Notes: Very generous — among the best in the metro. Three separate programs that could stack.

**Scott County SWCD — Natural Landscaping Program**
- Admin: Scott County SWCD
- Amount: TBD — need to confirm specific amounts
- Eligible: Native vegetation, pollinator habitat, rain gardens
- Property types: Residential (urban/suburban)
- Geographic: Scott County
- URL: https://www.scottswcd.org/post/scott-swcd-s-2025-natural-landscaping-programs
- Status: NEEDS VERIFICATION — confirm 2026 program details and grant amounts.

**Ramsey County Conservation District — Cost-Share**
- Admin: Ramsey Conservation District
- Amount: Varies — contact for current details
- Eligible: Rain gardens, native plantings, shoreline restoration
- Property types: Residential (+ shoreland owners)
- Geographic: Ramsey County
- URL: https://www.ramseycounty.us/residents/environment/soil-water-conservation/cost-share-funding-assistance
- Notes: Also offers design assistance for native gardens.

**Washington Conservation District — Financial Assistance**
- Admin: Washington Conservation District (WCD)
- Amount: Varies — partners with all 8 watershed orgs in the county
- Eligible: Rain gardens, shoreline restoration, habitat improvement, stormwater management
- Property types: Residential, commercial
- Geographic: Washington County
- URL: http://www.mnwcd.org/financial-assistance
- Notes: WCD connects residents to available funding across watershed districts. Good umbrella resource.

---

## Tier 2: Smaller / Seasonal Programs

### Rain Barrel Discounts (Seasonal — Spring)

**Recycling Association of Minnesota — Annual Rain Barrel Sale**
- Admin: RAM + local government partners
- Value: Discounted rain barrels (100% recycled materials), ~$100 with additional local discounts
- Geographic discounts:
  - Brooklyn Center, Crystal, New Hope: $20 off (code HRG20Off)
  - Bloomington, Richfield: $50 rebate potential
  - Dakota County: 30% off (code Dakota)
- Timeline: Pre-order spring, pickup at distribution events
- URL: https://www.recycleminnesota.org/2025-rain-barrel-and-compost-bin-sale.html
- Notes: Annual program. Worth surfacing seasonally (March-April). Different cities partner each year.

---

## Tier 3: Dead Ends (Researched, Not Applicable)

- **Federal (IRA/tax credits)**: No residential tax credits for rain gardens or native landscaping. IRA stormwater funding goes to municipalities only.
- **Xcel Energy rebates**: Outdoor equipment rebates are for electric mowers/trimmers, not landscaping installation.
- **Property tax reductions**: No residential native landscaping tax benefit found in MN. Green Acres program applies to agricultural land only.
- **MN Native Landscaping Law**: Legal protection (cities must allow managed natural landscapes as of July 1, 2025), not a financial incentive. Worth mentioning as educational context but not a "grant."

---

## Still Need Research

The following cities likely have stormwater utility credit programs similar to Minneapolis. Each would need individual verification:

- St. Paul
- Bloomington
- Eagan
- Edina
- Eden Prairie
- Minnetonka
- Plymouth
- Woodbury
- Maple Grove
- Brooklyn Park
- Roseville
- Golden Valley
- Burnsville
- Lakeville
- Apple Valley
- Cottage Grove
- Fridley
- Richfield
- Shoreview
- White Bear Lake

**Anoka County SWCD** — not researched yet, may have programs.
**Hennepin County** — beyond Opportunity Grants, may have additional programs.

---

## Architecture Implications

Current tool keys everything off `watershed_id` from polygon lookup. New program types need:

1. **Municipality matching**: Nominatim returns `city` in address details — use this to match city-level programs (stormwater credits, rain barrel rebates)
2. **County matching**: Nominatim returns `county` — use for SWCD programs (already partially done via `watershedCounties` mapping, but SWCD programs are separate from watershed programs)
3. **Statewide programs**: Already supported
4. **Seasonal awareness**: Some programs (rain barrel sales) are only relevant March-April. Consider date-based display logic or just note the timing.

The grants-database.json schema needs new sections: `city_programs`, `county_programs` alongside existing `watershed_programs` and `statewide_programs`.
