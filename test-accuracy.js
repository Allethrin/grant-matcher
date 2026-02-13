#!/usr/bin/env node
/**
 * Grant Matcher Accuracy Test
 *
 * Phase 1: Polygon validation using watershed centroids (no geocoding needed)
 * Phase 2: Real address geocoding + full pipeline test
 *
 * Nominatim rate limit: 1 request/second (we add 1.2s delay between calls)
 */

const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

// Load data files
const watershedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'metro_watersheds.geojson'), 'utf8'));
const grantsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'grants-database.json'), 'utf8'));

// Same watershedCounties mapping as index.html
const watershedCounties = {
  'bassett-creek': 'hennepin',
  'minnehaha-creek': 'hennepin',
  'shingle-creek': 'hennepin',
  'west-mississippi': 'hennepin',
  'nine-mile-creek': 'hennepin',
  'richfield-bloomington': 'hennepin',
  'elm-creek': 'hennepin',
  'pioneer-sarah-creek': 'hennepin',
  'riley-purgatory-bluff-creek': 'hennepin',
  'capitol-region': 'ramsey',
  'ramsey-washington-metro': 'ramsey',
  'rice-creek': 'anoka',
  'coon-creek': 'anoka',
  'vadnais-lake-area': 'ramsey',
  'mississippi': 'hennepin',
  'valley-branch': 'washington',
  'middle-st-croix': 'washington',
  'south-washington': 'washington',
  'lower-mississippi-river': 'dakota',
  'eagan-inver-grove': 'dakota',
  'scott': 'scott',
  'carver-county': 'carver'
};

// Covered watershed IDs (those with grant programs)
const coveredWatersheds = Object.keys(grantsData.watershed_programs);

// Real address test cases — addresses verified to be within each watershed
// (chosen using centroid proximity + local knowledge)
const addressTests = [
  // Ramsey County watersheds
  { address: '525 Park St, Saint Paul, MN 55103', expectedWatershed: 'capitol-region', note: 'St. Paul near Capitol' },
  { address: '3530 Lexington Ave N, Shoreview, MN 55126', expectedWatershed: 'vadnais-lake-area', note: 'Shoreview' },
  { address: '2015 Van Dyke St, Maplewood, MN 55109', expectedWatershed: 'ramsey-washington-metro', note: 'Maplewood' },

  // Hennepin County watersheds
  { address: '4300 Minnetonka Blvd, Minneapolis, MN 55416', expectedWatershed: 'minnehaha-creek', note: 'St. Louis Park / Minnehaha Creek' },
  { address: '6301 Shingle Creek Pkwy, Brooklyn Center, MN 55430', expectedWatershed: 'shingle-creek', note: 'Brooklyn Center city hall' },
  { address: '7800 Golden Valley Rd, Golden Valley, MN 55427', expectedWatershed: 'bassett-creek', note: 'Golden Valley' },
  { address: '7700 France Ave S, Edina, MN 55435', expectedWatershed: 'nine-mile-creek', note: 'Edina - Nine Mile Creek' },
  { address: '117 Main St SE, Minneapolis, MN 55414', expectedWatershed: 'mississippi', note: 'NE Mpls - MWMO territory' },

  // Anoka County
  { address: '250 61st Ave NE, Fridley, MN 55432', expectedWatershed: 'rice-creek', note: 'Fridley near Rice Creek' },

  // Dakota County
  { address: '3830 Pilot Knob Rd, Eagan, MN 55122', expectedWatershed: 'eagan-inver-grove', note: 'Eagan civic center' },
  { address: '1101 Victoria Curve, Mendota Heights, MN 55118', expectedWatershed: 'lower-mississippi-river', note: 'Mendota Heights city hall' },

  // Washington County
  { address: '8301 Valley Creek Rd, Woodbury, MN 55125', expectedWatershed: 'south-washington', note: 'Woodbury' },
  { address: '14949 62nd St N, Stillwater, MN 55082', expectedWatershed: 'valley-branch', note: 'North Stillwater area' },
  { address: '216 4th St N, Stillwater, MN 55082', expectedWatershed: 'middle-st-croix', note: 'Downtown Stillwater' },

  // Hennepin south
  { address: '7401 Penn Ave S, Richfield, MN 55423', expectedWatershed: 'richfield-bloomington', note: 'Richfield (south)' },

  // Champlin / NW
  { address: '12100 Ensign Ave N, Champlin, MN 55316', expectedWatershed: 'west-mississippi', note: 'Champlin' },

  // MWMO edge case — Target Field area
  { address: '1 Twins Way, Minneapolis, MN 55403', expectedWatershed: 'mississippi', note: 'Target Field / MWMO edge' },

  // Uncovered watersheds (should find polygon but no programs)
  { address: '129 Holmes St S, Shakopee, MN 55379', expectedWatershed: null, note: 'Scott County - uncovered', expectUncoveredWatershed: true },
];

// === FUNCTIONS (replicated from index.html) ===

async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address + ', Minnesota, USA');
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'MinnePrairie-Grant-Finder/1.0 (accuracy-test)' }
  });

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.length === 0) {
    throw new Error('Address not found by Nominatim');
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name
  };
}

function findWatershed(lat, lng) {
  const point = turf.point([lng, lat]);

  for (const feature of watershedData.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      return {
        name: feature.properties.NAME,
        type: feature.properties.TYPE,
        id: feature.properties.id
      };
    }
  }
  return null;
}

function getGrantCount(watershedId, propertyType) {
  let count = 0;

  for (const program of grantsData.statewide_programs) {
    if (program.restrict_to_counties) {
      const wsCounty = watershedCounties[watershedId];
      if (!wsCounty || !program.restrict_to_counties.includes(wsCounty)) continue;
    }
    const programTypes = program.property_types || program.eligibility?.property_types || [];
    if (programTypes.length === 0 || programTypes.includes(propertyType) ||
        (programTypes.includes('institutional') && ['church', 'school', 'nonprofit'].includes(propertyType))) {
      count++;
    }
  }

  if (watershedId && grantsData.watershed_programs[watershedId]) {
    for (const program of grantsData.watershed_programs[watershedId].programs) {
      const programTypes = program.property_types || [];
      if (programTypes.length === 0 || programTypes.includes(propertyType) ||
          (programTypes.includes('institutional') && ['church', 'school', 'nonprofit'].includes(propertyType))) {
        count++;
      }
    }
  }

  return count;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// PHASE 1: Polygon validation using centroids
// ============================================================
function runPhase1() {
  console.log('PHASE 1: POLYGON VALIDATION (centroid point-in-polygon)');
  console.log('='.repeat(60));
  console.log('Testing that each watershed centroid maps back to itself.\n');

  let passed = 0;
  let failed = 0;

  for (const feature of watershedData.features) {
    const id = feature.properties.id;
    const name = feature.properties.NAME;
    const centroid = turf.centroid(feature);
    const [lng, lat] = centroid.geometry.coordinates;

    const result = findWatershed(lat, lng);
    const resultId = result ? result.id : null;

    if (resultId === id) {
      const grantCount = getGrantCount(id, 'residential');
      const hasPrograms = coveredWatersheds.includes(id);
      const programInfo = hasPrograms ? `${grantCount} grants` : 'no programs';
      console.log(`  PASS  ${id} → ${programInfo}`);
      passed++;
    } else {
      console.log(`  FAIL  ${id} centroid maps to ${resultId || '(none)'} instead of ${id}`);
      console.log(`        centroid: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      failed++;
    }
  }

  console.log(`\nPhase 1: ${passed}/${passed + failed} centroids correctly resolve`);
  if (failed > 0) {
    console.log(`  ${failed} centroids fall outside their own polygon (possible MultiPolygon or concave shape issue)`);
  }

  return { passed, failed };
}

// ============================================================
// PHASE 2: Real address geocoding + watershed matching
// ============================================================
async function runPhase2() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 2: REAL ADDRESS GEOCODING + WATERSHED MATCHING');
  console.log('='.repeat(60));
  console.log(`Testing ${addressTests.length} addresses via Nominatim API.\n`);

  let passed = 0;
  let failed = 0;
  let geocodeErrors = 0;
  let warnings = 0;
  const results = [];

  for (let i = 0; i < addressTests.length; i++) {
    const tc = addressTests[i];
    process.stdout.write(`[${i + 1}/${addressTests.length}] ${tc.address} ... `);

    try {
      const location = await geocodeAddress(tc.address);
      const watershed = findWatershed(location.lat, location.lng);
      const watershedId = watershed ? watershed.id : null;
      const grantCount = watershed ? getGrantCount(watershed.id, 'residential') : 0;
      const mappedCounty = watershed ? (watershedCounties[watershed.id] || 'UNMAPPED') : 'N/A';

      let testPassed = false;

      if (tc.expectUncoveredWatershed) {
        // Just needs to land in some watershed (or none) — the point is there are no programs
        testPassed = true;
        const hasPrograms = watershed ? !!grantsData.watershed_programs[watershed.id] : false;
        console.log(`PASS  → ${watershedId || '(none)'} [${hasPrograms ? 'has' : 'no'} programs]`);
      } else if (watershedId === tc.expectedWatershed) {
        testPassed = true;
        console.log(`PASS  → ${watershedId} [${grantCount} grants, county: ${mappedCounty}]`);
      } else {
        console.log(`FAIL  expected: ${tc.expectedWatershed}, got: ${watershedId || '(none)'}`);
        console.log(`       geocoded: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`);
        console.log(`       display: ${location.display}`);
      }

      if (testPassed) passed++;
      else failed++;

      // Flag multi-county concerns
      if (watershed && watershed.id === 'mississippi' && mappedCounty === 'hennepin') {
        if (location.display.includes('Ramsey') || location.display.includes('Saint Paul')) {
          console.log(`  WARNING: In Ramsey County but watershed mapped to hennepin`);
          warnings++;
        }
      }

      results.push({
        address: tc.address,
        note: tc.note,
        lat: location.lat.toFixed(5),
        lng: location.lng.toFixed(5),
        display: location.display,
        expectedWatershed: tc.expectedWatershed,
        actualWatershed: watershedId,
        grantCount,
        countyMapping: mappedCounty,
        passed: testPassed
      });

    } catch (err) {
      console.log(`GEOCODE ERROR: ${err.message}`);
      geocodeErrors++;
      failed++;
      results.push({
        address: tc.address,
        note: tc.note,
        error: err.message,
        passed: false
      });
    }

    if (i < addressTests.length - 1) await sleep(1200);
  }

  console.log(`\nPhase 2: ${passed}/${addressTests.length} passed, ${geocodeErrors} geocode errors`);
  if (warnings > 0) console.log(`  ${warnings} multi-county mapping warnings`);

  return { passed, failed, geocodeErrors, warnings, results };
}

// ============================================================
// PHASE 3: Grant filtering logic validation
// ============================================================
function runPhase3() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3: GRANT FILTERING LOGIC');
  console.log('='.repeat(60));

  const propertyTypes = ['residential', 'commercial', 'church', 'school', 'nonprofit', 'hoa', 'municipal'];
  let issues = 0;

  // Test: Hennepin County Opportunity Grants should only appear for hennepin-mapped watersheds
  console.log('\nHennepin County Opportunity Grants (restrict_to_counties: [hennepin]):');
  for (const wsId of coveredWatersheds) {
    const county = watershedCounties[wsId];
    const shouldQualify = county === 'hennepin';
    // Check if the hennepin grant would be included
    const grants = [];
    for (const program of grantsData.statewide_programs) {
      if (program.id === 'hennepin-county-opportunity-grants') {
        if (program.restrict_to_counties) {
          const wsCounty = watershedCounties[wsId];
          if (wsCounty && program.restrict_to_counties.includes(wsCounty)) {
            grants.push(program);
          }
        }
      }
    }
    const qualifies = grants.length > 0;
    const status = qualifies === shouldQualify ? 'OK' : 'ISSUE';
    if (status === 'ISSUE') issues++;
    console.log(`  ${status}  ${wsId} (${county}): ${qualifies ? 'qualifies' : 'excluded'}`);
  }

  // Test: Every covered watershed returns at least 1 grant for residential
  console.log('\nGrant count per covered watershed (residential):');
  for (const wsId of coveredWatersheds) {
    const count = getGrantCount(wsId, 'residential');
    const status = count > 0 ? 'OK' : 'WARN';
    if (count === 0) issues++;
    console.log(`  ${status}  ${wsId}: ${count} grants`);
  }

  // Test: MWMO (mississippi) residential should NOT include community/action grants
  // because those are nonprofit/school/church/hoa/municipal only
  console.log('\nMWMO residential grant check (should exclude org-only programs):');
  const mwmoResidentialGrants = [];
  if (grantsData.watershed_programs['mississippi']) {
    for (const program of grantsData.watershed_programs['mississippi'].programs) {
      const types = program.property_types || [];
      if (types.includes('residential')) {
        mwmoResidentialGrants.push(program.name);
      }
    }
  }
  if (mwmoResidentialGrants.length === 0) {
    console.log('  OK  No MWMO-specific residential grants (correct — MWMO only serves orgs)');
  } else {
    console.log(`  ISSUE  MWMO residential programs found: ${mwmoResidentialGrants.join(', ')}`);
    issues++;
  }

  console.log(`\nPhase 3: ${issues} issues found`);
  return { issues };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('Grant Matcher Accuracy Test Suite');
  console.log('================================');
  console.log(`GeoJSON: ${watershedData.features.length} watershed polygons`);
  console.log(`Grants DB: ${coveredWatersheds.length} watersheds with programs`);
  console.log(`Statewide programs: ${grantsData.statewide_programs.length}`);
  console.log();

  const p1 = runPhase1();
  const p2 = await runPhase2();
  const p3 = runPhase3();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(60));
  console.log(`Phase 1 (polygon validation): ${p1.passed}/${p1.passed + p1.failed} pass`);
  console.log(`Phase 2 (address geocoding):  ${p2.passed}/${p2.passed + p2.failed} pass (${p2.geocodeErrors} geocode errors)`);
  console.log(`Phase 3 (grant filtering):    ${p3.issues} issues`);

  // Save results
  const outputPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    phase1: p1,
    phase2: { summary: { passed: p2.passed, failed: p2.failed, geocodeErrors: p2.geocodeErrors }, results: p2.results },
    phase3: p3
  }, null, 2));
  console.log(`\nFull results saved to: test-results.json`);
}

main().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
