/**
 * Central photo catalogue.
 *
 * Every photograph in the app is a Wikimedia Commons file, referenced by file name only. The URL is built
 * at runtime (Special:FilePath redirects to a resized copy, so small cards download small images), and
 * each file's Commons page — which shows the author and licence — is listed on the /credits page.
 *
 * To swap a photo, change the file name here. `npm run check:images` (in /client) confirms every file
 * still resolves. Entries are { file, alt, position? }; `position` is an optional CSS object-position
 * so the subject stays in frame when a photo is cropped to a card.
 */

const FILE_PATH = 'https://commons.wikimedia.org/wiki/Special:FilePath/';
const FILE_PAGE = 'https://commons.wikimedia.org/wiki/File:';

export const commonsUrl = (file, width = 960) => `${FILE_PATH}${encodeURIComponent(file)}?width=${width}`;
export const commonsPage = (file) => `${FILE_PAGE}${encodeURIComponent(file)}`;

const img = (file, alt, position) => ({ file, alt, position });

// ----------------------------------------------------------------------------- Page banners
export const HERO = img('Indian_village_morning_crop_beautiful_image_with_a_farmer.jpg', 'Farmer standing in a green crop field on a village morning in India', 'center 60%');
export const DASHBOARD_BANNER = img('Agriculture_in_Punjab_India.jpg', 'Green farmland stretching to the horizon in Punjab', 'center 55%');
export const ADMIN_BANNER = img('Wheat_fields_IN_Haryana.jpg', 'Wheat fields in Haryana', 'center 60%');
export const COMMUNITY_BANNER = img('Indian_farmers,_Gwalior,_MP.jpg', 'Farmers gathered together in Gwalior, Madhya Pradesh');
export const SOIL_EMPTY = img('HandsInSoil.jpg', 'Hands holding a handful of agricultural soil');

// ----------------------------------------------------------------------------- Crops
const CROPS = {
  wheat: img('Wheat_field_in_Punjab_-1.jpg', 'Wheat crop growing in a field in Punjab'),
  rice: img('Green_rice_field_during_the_monsoon.jpg', 'Green rice paddy field during the monsoon'),
  tomato: img('Organic_home-grown_tomatoes_-_unripe_to_ripe.jpg', 'Tomatoes ripening on the plant'),
  potato: img('Potato_plants.jpg', 'Potato plants growing in a field'),
  onion: img('Lasalgaon_Manganga_Gulabi_Onions_freshly_plucked_from_a_field.jpg', 'Onion bulbs freshly pulled from a field in Lasalgaon, Maharashtra'),
  cotton: img('BALLS_OF_COTTON_(ANDHRA_-SOUTH_INDIA)_READY_FOR_HARVEST.jpg', 'Cotton bolls ready for harvest in Andhra Pradesh'),
  maize: img('Maize_crop_in_rural_India.jpg', 'Maize crop growing in rural India'),
  soybean: img('Soybean_Field_(9620647953).jpg', 'Soybean plants in a field'),
  chickpea: img('Chickpea_field.jpg', 'Chickpea plants growing in a field'),
  chilli: img('Chilli_plant.jpg', 'Chilli plant with fruit'),
  okra: img('Okra_-_Abelmoschus_esculentus_(Vendakka-ml).jpg', 'Okra plant with pods'),
  mustard: img('View_of_Sunset_and_mustard_fields.jpg', 'Mustard fields in flower'),
  'pigeon pea': img('Arhar_crop_(Pigeon_pea)_in_Punjab,_India.jpg', 'Pigeon pea (arhar) crop in India'),
};

const CROP_ALIASES = {
  paddy: 'rice', corn: 'maize', 'soya bean': 'soybean', soyabean: 'soybean', soya: 'soybean', gram: 'chickpea', 'bengal gram': 'chickpea',
  chana: 'chickpea', chili: 'chilli', chillies: 'chilli', 'green chilli': 'chilli', 'lady finger': 'okra', ladyfinger: 'okra', bhindi: 'okra',
  rapeseed: 'mustard', sarson: 'mustard', arhar: 'pigeon pea', tur: 'pigeon pea', tomatoes: 'tomato', potatoes: 'potato', onions: 'onion',
};

/** Photo for a crop by name ("Wheat", "Soybean (JS 9560)"…), or null when there is no matching photo. */
export function cropImage(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  const direct = CROPS[key] || CROPS[CROP_ALIASES[key]];
  if (direct) return direct;
  // Whole-word match only, so "Turmeric" is not read as "tur" (pigeon pea) or "Programme" as "gram".
  const hit = Object.keys(CROPS).concat(Object.keys(CROP_ALIASES)).find((word) => new RegExp(`\\b${word}\\b`).test(key));
  return hit ? CROPS[hit] || CROPS[CROP_ALIASES[hit]] : null;
}

/** Crops shown in the landing-page gallery, in display order. */
export const GALLERY_CROPS = ['Wheat', 'Rice', 'Tomato', 'Cotton', 'Onion', 'Maize', 'Soybean', 'Potato'];

// ----------------------------------------------------------------------------- Farms
const LANDSCAPES = [
  img('Agriculture_farm_Pune_Maharashtra_India.jpg', 'Farmland near Pune, Maharashtra'),
  img('India_Farming.jpg', 'Farmland in India'),
  img('2016_India_Monsoon_Lush_Green_Fields.jpg', 'Lush green fields during the monsoon in India'),
  img('Farming_in_uttarakhand_india.jpg', 'Terraced farming in Uttarakhand'),
  img('Agriculture_India_Sunflower_Field.jpg', 'Sunflower field in India'),
  img('Agriculture_in_Punjab_India.jpg', 'Green farmland in Punjab'),
];

const IRRIGATION = {
  Drip: img('Banana_Plants_with_drip_irrigation_in_Harsoda,_Malkapur_Tehsil.jpg', 'Banana plants watered by drip irrigation'),
  Sprinkler: img('Irrigation_through_sprinkler.jpg', 'Field irrigated by a sprinkler'),
  'Tube well': img('Ground_water_tubewell_irrigation_horticulture_Gujarat_India.jpg', 'Tube well irrigation of a field in Gujarat'),
};

const hash = (text) => [...String(text)].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7);
const custom = (url, alt) => (url ? { src: url, alt } : null);

/** A farm's own photo if it has one, otherwise a fitting farm / crop / irrigation photo (stable per farm). */
export function farmImage(farm) {
  const own = custom(farm.imageUrl, `${farm.name} farm`);
  if (own) return own;
  const firstCrop = (farm.primaryCrops || []).map(cropImage).find(Boolean);
  const candidates = [firstCrop, IRRIGATION[farm.irrigationType], LANDSCAPES[hash(farm._id || farm.name) % LANDSCAPES.length]].filter(Boolean);
  return candidates[hash(`${farm.name}${farm.location}`) % candidates.length];
}

// ----------------------------------------------------------------------------- Soil
/** Soil photo that matches the reading: fertile, black regur, dry or drought-hit. */
export function soilImage(status, moisture) {
  if (typeof moisture === 'number' && moisture < 20) return img('Dry_Cracked_Mud_(4957b8b2-f52c-43b0-acc2-ead42cf6f03b).jpg', 'Dry, cracked agricultural soil');
  switch (status) {
    case 'Excellent':
    case 'Good':
      return img('Texture_of_a_fertile_soil.jpg', 'Dark, fertile agricultural soil');
    case 'Moderate':
      return img('A_farm_waiting_for_rain,_note_black_regur_soil_-_panoramio.jpg', 'Black regur soil on a farm waiting for rain');
    case 'Poor':
    case 'Critical':
      return img('Drought_affected_area_in_Karnataka,_India,_2012.jpg', 'Dry, drought-affected farmland in Karnataka');
    default:
      return SOIL_EMPTY;
  }
}

// ----------------------------------------------------------------------------- Weather
/** Landscape that matches the forecast condition text ("Light rain", "Overcast", "Thunderstorm"…). */
export function weatherImage(condition = '') {
  const text = String(condition).toLowerCase();
  if (/thunder|storm|squall/.test(text)) return img('Dark_clouds_over_yellow_field_(27123988741).jpg', 'Dark storm clouds over a farm field');
  if (/rain|drizzle|shower/.test(text)) return img('Monsoon_Maharashtra_India_Rain_Landscape_(1)_12.jpg', 'Monsoon rain over farmland in Maharashtra');
  if (/cloud|overcast|fog|mist|haze/.test(text)) return img('2016_India_Monsoon_Lush_Green_Fields.jpg', 'Green fields under an overcast monsoon sky');
  return img('Beauty_of_nature_-_blue_sky_and_green_field.jpg', 'Green field under a clear blue sky');
}

// ----------------------------------------------------------------------------- Pests and diseases
const PESTS = [
  [/pink ?bollworm/i, img('Pinkbollworm.jpg', 'Pink bollworm larva')],
  [/helicoverpa|pod borer|gram caterpillar|american bollworm/i, img('Helicoverpa_armigera_larva.jpg', 'Helicoverpa caterpillar, the pod borer')],
  [/armyworm|spodoptera/i, img('Zea_mays_damaged_by_Spodoptera_frugiperda_(200218-0814).jpg', 'Maize leaves damaged by fall armyworm')],
  [/aphid/i, img('Aphid_infestation.jpg', 'Aphid infestation on a plant')],
  [/whitefly|bemisia/i, img('Silverleaf_whitefly.jpg', 'Silverleaf whiteflies on a leaf')],
  [/late blight|phytophthora/i, img('Late_blight_on_potato_leaf_2.jpg', 'Late blight lesions on a potato leaf')],
  [/yellow rust|stripe rust/i, img('Stripe_rust_on_wheat.jpg', 'Yellow (stripe) rust on wheat leaves')],
  [/leaf rust|brown rust/i, img('Wheat_leaf_rust_on_wheat.jpg', 'Leaf rust pustules on wheat')],
  [/leaf spot|septoria/i, img('Septoria_leaf_spot_symptoms_on_tomato_leaf_(Septoria_lycopersici_on_Solanum_lycopersicum_leaf).jpg', 'Leaf spot symptoms on a tomato leaf')],
  [/caterpillar|larva|borer|worm/i, img('Caterpillar_on_a_leaf.jpg', 'Caterpillar feeding on a leaf')],
];

/**
 * Photo for a pest alert. Returns { image, exact } where `exact` is false when no pest photo matches the
 * alert and the affected crop's photo is used instead — never an unrelated picture.
 */
export function pestImage(alert) {
  const own = custom(alert.imageUrl, alert.name);
  if (own) return { image: own, exact: true };
  const hit = PESTS.find(([pattern]) => pattern.test(alert.name));
  if (hit) return { image: hit[1], exact: true };
  const crop = (alert.crops || []).map(cropImage).find(Boolean);
  return { image: crop || null, exact: false };
}

/** Healthy-crop photo shown beside the affected plant ("healthy → affected"). */
export const healthyCropImage = (alert) => (alert.crops || []).map(cropImage).find(Boolean) || null;

// ----------------------------------------------------------------------------- Marketplace
const SEED_PACKETS = img('Heirloom_Seed_Packets.jpg', 'Packets of vegetable seeds');
const FERTILISER = {
  urea: img('Sample_of_Urea.jpg', 'Urea fertiliser granules'),
  dap: img('Bags_of_Fertiliser_-_geograph.org.uk_-_783721.jpg', 'Bags of fertiliser'),
  complex: img('Bags_and_bags_of_plant_fertilizer_-_geograph.org.uk_-_2222241.jpg', 'Stacked bags of plant fertiliser'),
  spread: img('An_Indian_farmer_spreading_fertilizer_over_a_crop.jpg', 'Indian farmer spreading fertiliser over a crop'),
};
const SPRAYER = img('Knapsack_sprayer.jpg', 'Knapsack sprayer used for crop protection');
const IRRIGATION_KIT = {
  drip: img('Drip_irrigation_system.JPG', 'Drip irrigation system in a field'),
  pipe: img('Drip_irrigation_(2552390830).jpg', 'Drip irrigation pipe laid along a crop row'),
  sprinkler: img('Irrigation_through_sprinkler.jpg', 'Sprinkler irrigating a field'),
};

/** Product photo: the admin's own image URL if set, otherwise a photo that matches the product. */
export function resourceImage(resource) {
  const own = custom(resource.imageUrl, resource.name);
  if (own) return own;
  const name = resource.name || '';
  switch (resource.category) {
    case 'Seeds':
      return /packet|hybrid/i.test(name) ? SEED_PACKETS : cropImage(name) || SEED_PACKETS;
    case 'Fertilizers':
      if (/urea/i.test(name)) return FERTILISER.urea;
      if (/dap/i.test(name)) return FERTILISER.dap;
      if (/npk|complex/i.test(name)) return FERTILISER.complex;
      return FERTILISER.spread;
    case 'Organic Products':
      return /vermi/i.test(name)
        ? img('Harvesting_vermicompost.JPG', 'Vermicompost being harvested')
        : img('A_Vermi_compost.JPG', 'Organic compost for soil enrichment');
    case 'Crop Care':
      return img('Pesticide_spraying_in_spring.jpg', 'Crop-care product being sprayed on a field');
    case 'Equipment':
      if (/sprayer/i.test(name)) return SPRAYER;
      if (/meter|ph|moisture/i.test(name)) return img('HandsInSoil.jpg', 'Checking agricultural soil by hand');
      return img('Local_farming_tools.jpg', 'Traditional farming tools');
    case 'Irrigation':
      if (/sprinkler/i.test(name)) return IRRIGATION_KIT.sprinkler;
      if (/lateral|pipe/i.test(name)) return IRRIGATION_KIT.pipe;
      return IRRIGATION_KIT.drip;
    default:
      return null;
  }
}

// ----------------------------------------------------------------------------- Community
const POSTS = {
  'Crop Problems': img('Wheat_leaf_rust_on_wheat.jpg', 'Rust disease on wheat leaves'),
  'Farming Techniques': img('Farmer_and_tractor_tilling_soil.jpg', 'Farmer tilling soil with a tractor'),
  Weather: img('Dark_clouds_over_yellow_field_(27123988741).jpg', 'Dark clouds over a farm field'),
  'Pest & Disease': img('Aphid_infestation.jpg', 'Aphid infestation on a plant'),
  Irrigation: img('Irrigation_through_sprinkler.jpg', 'Field irrigation with a sprinkler'),
  Harvest: img('Cotton_picking_in_India.jpg', 'Cotton being picked by hand in India'),
  'Market & Schemes': img('Lasalgaon_Manganga_Gulabi_Onions_freshly_plucked_from_a_field.jpg', 'Onions harvested in Lasalgaon, a major onion market'),
  General: img('India_Farming.jpg', 'Farmland in India'),
};

export const postImage = (category) => POSTS[category] || POSTS.General;

// ----------------------------------------------------------------------------- Credits + checks
/** Every catalogue photo exactly once — used by the credits page and the image checker. */
export function allImages() {
  const found = new Map();
  const add = (entry) => { if (entry && entry.file && !found.has(entry.file)) found.set(entry.file, entry); };
  [HERO, DASHBOARD_BANNER, ADMIN_BANNER, COMMUNITY_BANNER, SOIL_EMPTY, ...LANDSCAPES, ...Object.values(CROPS), ...Object.values(IRRIGATION), ...Object.values(POSTS),
    ...PESTS.map(([, entry]) => entry), ...Object.values(FERTILISER), ...Object.values(IRRIGATION_KIT), SEED_PACKETS, SPRAYER].forEach(add);
  ['Excellent', 'Moderate', 'Poor'].forEach((status) => add(soilImage(status)));
  add(soilImage('Good', 10));
  ['Sunny', 'Rain', 'Overcast', 'Thunderstorm'].forEach((condition) => add(weatherImage(condition)));
  [{ category: 'Organic Products', name: 'Vermicompost' }, { category: 'Organic Products', name: 'Neem cake' }, { category: 'Crop Care', name: 'Neem oil' },
    { category: 'Equipment', name: 'Soil meter' }, { category: 'Equipment', name: 'Hand tools' }].forEach((resource) => add(resourceImage(resource)));
  return [...found.values()];
}
