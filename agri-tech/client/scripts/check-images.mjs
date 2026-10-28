/**
 * Confirms every photo in src/utils/images.js still resolves on Wikimedia Commons.
 *   npm run check:images          → requests each photo (needs internet)
 *   npm run check:images -- --list → just prints the catalogue
 * Exit code 1 if any photo is missing, so it can run in CI.
 */
import { allImages, commonsUrl } from '../src/utils/images.js';

const images = allImages();
if (process.argv.includes('--list')) {
  images.forEach((image) => console.log(image.file));
  console.log(`\n${images.length} photos in the catalogue.`);
  process.exit(0);
}

let failed = 0;
for (const image of images) {
  try {
    const response = await fetch(commonsUrl(image.file, 320), { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'SmartAgriTech-image-check/1.0' } });
    const type = response.headers.get('content-type') || '';
    const ok = response.ok && type.startsWith('image/');
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok     ' : 'MISSING'} ${response.status} ${image.file}`);
  } catch (error) {
    failed += 1;
    console.log(`ERROR   ${image.file} — ${error.message}`);
  }
}
console.log(failed ? `\n${failed} of ${images.length} photos need attention — replace them in src/utils/images.js.` : `\nAll ${images.length} photos load.`);
process.exit(failed ? 1 : 0);
