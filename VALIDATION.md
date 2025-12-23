# Grant Card Validation Checklist

Run this validation process when adding new watersheds/programs or updating existing entries.

## Before Adding/Updating a Card

1. **Fetch the source URL** - Actually visit the linked page
2. **Verify the program exists** - Can you find the program described on that page?
3. **Cross-check all numbers** - Amounts, percentages, budgets must appear on the source

## Card Content Review

For each field, ask:

### Amount
- [ ] Is this number on the source page? If not, use "Varies - contact [org]"
- [ ] Is the format consistent? (e.g., "Up to $500", "$250 - $5,000")

### Link & Button Text
- [ ] Does the URL lead somewhere useful for this program?
- [ ] If linking to a page with no application, use `link_text: "Learn more →"` or `"Contact [org] →"`
- [ ] If the org doesn't have a direct program page, link to whoever actually helps (e.g., WCD instead of the watershed)

### Notes
- [ ] Is this useful context for someone deciding whether to apply?
- [ ] Remove: direct contact info (phone, email) - they can get this on the linked page
- [ ] Remove: restrictions/fine print that discourages ("one per person ever", etc.)
- [ ] Keep: helpful tips, what makes this program good for certain situations

### Eligibility Note
- [ ] Clear about who qualifies?
- [ ] Mentions any prerequisites (workshops, site visits, etc.)?

### County Restrictions
- [ ] If program is county-specific, add `restrict_to_counties` array
- [ ] Verify the watershed→county mapping in index.html includes this watershed

### needs_research Flag
- [ ] Set to `true` if details couldn't be verified from source
- [ ] Remove once verified

## User Perspective Check

Imagine clicking through as a homeowner:

1. Does the card accurately describe what I'll find when I click?
2. Is the button text honest about what happens next?
3. Will I feel helped or confused after clicking through?

## After Changes

1. Run the tool locally and test with an address in that watershed
2. Click through to verify the link works
3. Compare what the card says to what the page shows

## Common Issues We've Caught

| Issue | Fix |
|-------|-----|
| County grant showing statewide | Add `restrict_to_counties` field |
| "Learn more & apply" but no application | Use custom `link_text` |
| Link to watershed site that has no program info | Link to the org that actually helps (SWCD, WCD) |
| Specific % not on source page | Change to "Varies - contact [org]" |
| Phone/email embedded in notes | Remove - available on linked page |
| Discouraging fine print | Remove or rephrase positively |
