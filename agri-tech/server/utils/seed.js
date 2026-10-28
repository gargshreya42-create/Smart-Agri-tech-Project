/* Seeds the database with realistic demo data.  Usage:  npm run seed
 * WARNING: wipes every collection first. Refuses to run with NODE_ENV=production unless --force is passed. */
const mongoose = require('mongoose');
const { mongoUri, nodeEnv } = require('../config/env');

const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const SoilRecord = require('../models/SoilRecord');
const WeatherData = require('../models/WeatherData');
const WeatherAlert = require('../models/WeatherAlert');
const PestAlert = require('../models/PestAlert');
const Resource = require('../models/Resource');
const Order = require('../models/Order');
const Expert = require('../models/Expert');
const Consultation = require('../models/Consultation');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const { analyse } = require('../services/soilService');

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);
const isoDate = (n) => daysFromNow(n).toISOString().slice(0, 10);

const ADMIN_PASSWORD = 'Admin@123';
const FARMER_PASSWORD = 'Farmer@123';

// ------------------------------------------------------------------ static data
const userData = [
  { key: 'admin', name: 'Anita Deshmukh', email: 'admin@smartagritech.in', phone: '9800000001', role: 'admin', location: 'Bhopal, Madhya Pradesh', language: 'en', age: 170, password: ADMIN_PASSWORD },
  { key: 'ramesh', name: 'Ramesh Verma', email: 'ramesh.verma@example.com', phone: '9826012345', location: 'Berasia, Bhopal', language: 'hi', age: 150 },
  { key: 'sunita', name: 'Sunita Patel', email: 'sunita.patel@example.com', phone: '9893067890', location: 'Ichhawar, Sehore', language: 'hi', age: 120 },
  { key: 'mahesh', name: 'Mahesh Jadhav', email: 'mahesh.jadhav@example.com', phone: '9422098765', location: 'Dindori, Nashik', language: 'mr', age: 95 },
  { key: 'geeta', name: 'Geeta Rajput', email: 'geeta.rajput@example.com', phone: '9754011223', location: 'Narmadapuram, Madhya Pradesh', language: 'hi', age: 70 },
  { key: 'dinesh', name: 'Dinesh Malviya', email: 'dinesh.malviya@example.com', phone: '9977044556', location: 'Vidisha, Madhya Pradesh', language: 'hi', age: 48 },
  { key: 'lalita', name: 'Lalita Meena', email: 'lalita.meena@example.com', phone: '9131077889', location: 'Raisen, Madhya Pradesh', language: 'hi', age: 25 },
  { key: 'sanjay', name: 'Sanjay Ahirwar', email: 'sanjay.ahirwar@example.com', phone: '9406099001', location: 'Sagar, Madhya Pradesh', language: 'hi', age: 9, isActive: false },
];

const farmData = [
  { owner: 'ramesh', key: 'verma', name: 'Verma Kheti — Berasia Road', location: 'Berasia, Bhopal', sizeAcres: 12.5, soilType: 'Black (Regur)', irrigationType: 'Tube well', farmingType: 'Conventional', primaryCrops: ['Soybean', 'Wheat', 'Chickpea'], notes: 'Main family farm. Two tube wells; north plot drains slowly after heavy rain.' },
  { owner: 'ramesh', key: 'greenvalley', name: 'Green Valley Vegetables', location: 'Kolar Road, Bhopal', sizeAcres: 4, soilType: 'Loamy', irrigationType: 'Drip', farmingType: 'Organic', primaryCrops: ['Tomato', 'Chilli', 'Okra'], notes: 'Drip-irrigated vegetable block, supplying Bhopal mandi twice a week.' },
  { owner: 'sunita', key: 'patel', name: 'Patel Agro Farm', location: 'Ichhawar, Sehore', sizeAcres: 8, soilType: 'Black (Regur)', irrigationType: 'Canal', farmingType: 'Conventional', primaryCrops: ['Wheat', 'Chickpea', 'Mustard'] },
  { owner: 'mahesh', key: 'jadhav', name: 'Jadhav Draksha Baug', location: 'Dindori, Nashik', sizeAcres: 6, soilType: 'Red', irrigationType: 'Drip', farmingType: 'Natural', primaryCrops: ['Grapes', 'Onion'] },
  { owner: 'geeta', key: 'rajput', name: 'Rajput Kheti', location: 'Narmadapuram, Madhya Pradesh', sizeAcres: 15, soilType: 'Alluvial', irrigationType: 'Canal', farmingType: 'Conventional', primaryCrops: ['Wheat', 'Soybean'] },
  { owner: 'dinesh', key: 'malviya', name: 'Malviya Farm', location: 'Vidisha, Madhya Pradesh', sizeAcres: 5, soilType: 'Black (Regur)', irrigationType: 'Tube well', farmingType: 'Mixed', primaryCrops: ['Chickpea', 'Wheat'] },
  { owner: 'lalita', key: 'meena', name: 'Meena Organic Plot', location: 'Raisen, Madhya Pradesh', sizeAcres: 3, soilType: 'Loamy', irrigationType: 'Sprinkler', farmingType: 'Organic', primaryCrops: ['Mustard', 'Vegetables'] },
];

const cropData = [
  { farm: 'verma', name: 'Soybean', variety: 'JS 9560', plant: -105, harvest: 5, stage: 'Maturity', health: 'Healthy', area: 6, irrigation: 'Tube well', notes: 'Pods turning yellow; harvest once 90% of pods are dry.' },
  { farm: 'verma', name: 'Chickpea', variety: 'JG 14', plant: -8, harvest: 112, stage: 'Germination', health: 'Healthy', area: 4, irrigation: 'Tube well', notes: 'Seed treated with Trichoderma before sowing.' },
  { farm: 'verma', name: 'Wheat', variety: 'MP Sharbati', plant: 14, harvest: 150, stage: 'Planned', health: 'Healthy', area: 5, irrigation: 'Tube well', notes: 'Sow after soybean harvest and field preparation.' },
  { farm: 'greenvalley', name: 'Tomato', variety: 'Arka Rakshak', plant: -48, harvest: 55, stage: 'Flowering', health: 'Needs Attention', area: 1.5, irrigation: 'Drip', notes: 'Some leaf curling on the eastern rows — monitoring whitefly.' },
  { farm: 'greenvalley', name: 'Chilli', variety: 'Pusa Jwala', plant: -62, harvest: 70, stage: 'Fruiting', health: 'At Risk', area: 1, irrigation: 'Drip', notes: 'Leaf curl symptoms spreading; yellow sticky traps installed.' },
  { farm: 'greenvalley', name: 'Okra', variety: 'Arka Anamika', plant: -30, harvest: 28, stage: 'Vegetative', health: 'Healthy', area: 1, irrigation: 'Drip' },
  { farm: 'patel', name: 'Wheat', variety: 'Lokwan', plant: 10, harvest: 140, stage: 'Planned', health: 'Healthy', area: 5, irrigation: 'Canal' },
  { farm: 'patel', name: 'Mustard', variety: 'Pusa Bold', plant: -12, harvest: 95, stage: 'Seedling', health: 'Healthy', area: 3, irrigation: 'Canal', notes: 'Light aphid presence noticed on borders.' },
  { farm: 'jadhav', name: 'Onion', variety: 'Agrifound Dark Red', plant: -22, harvest: 98, stage: 'Vegetative', health: 'Needs Attention', area: 2.5, irrigation: 'Drip' },
  { farm: 'rajput', name: 'Soybean', variety: 'JS 2034', plant: -110, harvest: -2, stage: 'Harvested', health: 'Healthy', area: 9 },
  { farm: 'rajput', name: 'Wheat', variety: 'HI 1544', plant: 20, harvest: 155, stage: 'Planned', health: 'Healthy', area: 8, irrigation: 'Canal' },
  { farm: 'malviya', name: 'Chickpea', variety: 'JG 12', plant: -15, harvest: 105, stage: 'Seedling', health: 'Healthy', area: 3, irrigation: 'Tube well' },
  { farm: 'meena', name: 'Mustard', variety: 'RH 749', plant: -10, harvest: 100, stage: 'Seedling', health: 'Healthy', area: 2, irrigation: 'Sprinkler' },
];

const soilData = [
  { farm: 'verma', age: 62, ph: 7.6, nitrogen: 270, phosphorus: 14, potassium: 360, moisture: 33, organicMatter: 1.1 },
  { farm: 'verma', age: 6, ph: 7.8, nitrogen: 250, phosphorus: 12, potassium: 380, moisture: 14, organicMatter: 1.2, notes: 'Sampled from the north plot after soybean pod filling; topsoil was very dry.' },
  { farm: 'greenvalley', age: 14, ph: 6.7, nitrogen: 340, phosphorus: 28, potassium: 220, moisture: 48, organicMatter: 3.4 },
  { farm: 'patel', age: 20, ph: 8.1, nitrogen: 210, phosphorus: 9, potassium: 300, moisture: 36, organicMatter: 0.9 },
  { farm: 'jadhav', age: 11, ph: 6.4, nitrogen: 310, phosphorus: 22, potassium: 180, moisture: 52, organicMatter: 2.8 },
];

const pestData = [
  {
    name: 'Yellow Mosaic Virus', type: 'Disease', crops: ['Soybean', 'Moong'], riskLevel: 'High', age: 4,
    description: 'Bright yellow mottling on leaves, stunted plants and poor pod set. Spread by whiteflies; reported in several Malwa and Bhopal-region fields this season.',
    preventiveSuggestions: ['Use resistant or tolerant varieties', 'Avoid late sowing', 'Install yellow sticky traps to monitor whiteflies', 'Keep field borders free of weeds'],
    recommendedAction: 'Remove and destroy infected plants early. Confirm the right product and dose for whitefly control with your local KVK before spraying.',
  },
  {
    name: 'Girdle Beetle', type: 'Pest', crops: ['Soybean'], riskLevel: 'Medium', age: 20,
    description: 'Adult beetles girdle stems and petioles, causing wilting above the cut. Damage is most visible 3–5 weeks after sowing.',
    preventiveSuggestions: ['Deep summer ploughing', 'Avoid very early sowing', 'Collect and destroy affected twigs'],
    recommendedAction: 'Scout 10 plants at 5 spots per acre. If more than 10% of plants are affected, contact your agriculture extension officer.',
  },
  {
    name: 'Pod Borer (Helicoverpa)', type: 'Pest', crops: ['Chickpea', 'Tomato', 'Pigeon pea'], riskLevel: 'High', age: 2,
    description: 'Caterpillars feed on leaves, flowers and developing pods and can cause heavy yield loss at pod stage. Moth activity is rising with the cooler nights.',
    preventiveSuggestions: ['Install pheromone traps (5 per acre)', 'Set up bird perches', 'Grow marigold as a trap crop on borders', 'Spray neem seed kernel extract at early flowering'],
    recommendedAction: 'Check pheromone traps weekly. If more than 8 moths per trap per week are caught, plan an integrated spray programme with your KVK.',
  },
  {
    name: 'Yellow Rust', type: 'Disease', crops: ['Wheat'], riskLevel: 'Medium', age: 9,
    description: 'Yellow stripes of spores on leaves, favoured by cool, humid weather. Early infections can spread quickly across a field.',
    preventiveSuggestions: ['Choose rust-resistant varieties', 'Avoid excess nitrogen', 'Scout from tillering stage'],
    recommendedAction: 'Inspect lower leaves every 5–7 days. If stripes appear, get a fungicide recommendation from your local agriculture office.',
  },
  {
    name: 'Late Blight', type: 'Disease', crops: ['Tomato', 'Potato'], riskLevel: 'Critical', age: 1,
    description: 'Dark water-soaked patches on leaves and fruits with white mould in humid mornings. Can destroy a crop within days in cool, wet weather.',
    preventiveSuggestions: ['Use drip irrigation, avoid overhead watering', 'Stake plants for air flow', 'Remove and bury infected leaves', 'Rotate away from tomato/potato'],
    recommendedAction: 'Inspect plants today. Remove infected material immediately and get a protective fungicide schedule from your KVK without delay.',
  },
  {
    name: 'Leaf Curl Virus', type: 'Disease', crops: ['Chilli', 'Tomato'], riskLevel: 'High', age: 6,
    description: 'Upward curling, thickened and crinkled leaves with reduced fruiting. Transmitted by whiteflies.',
    preventiveSuggestions: ['Raise seedlings under insect-proof net', 'Install yellow sticky traps', 'Uproot infected plants', 'Spray neem oil as a deterrent'],
    recommendedAction: 'Uproot and destroy affected plants, install sticky traps and keep weeds down. Ask an expert about resistant varieties for next season.',
  },
  {
    name: 'Mustard Aphid', type: 'Pest', crops: ['Mustard'], riskLevel: 'Low', age: 3,
    description: 'Colonies on tender shoots and flower stalks suck sap; infestation peaks with cloudy weather in December–February.',
    preventiveSuggestions: ['Sow on time', 'Encourage ladybird beetles', 'Spray a 5% neem seed kernel extract if colonies appear'],
    recommendedAction: 'Monitor field borders weekly. No treatment needed until colonies cover more than 10% of the flowering stalk.',
  },
  {
    name: 'Onion Thrips', type: 'Pest', crops: ['Onion'], riskLevel: 'Medium', age: 7,
    description: 'Tiny insects rasp leaves, leaving silvery streaks; severe attacks cut bulb size.',
    preventiveSuggestions: ['Use blue sticky traps', 'Avoid water stress', 'Grow a barrier crop of maize'],
    recommendedAction: 'Tap leaves over white paper to count thrips. Consult your KVK if more than 30 per plant.',
  },
  {
    name: 'Pink Bollworm', type: 'Pest', crops: ['Cotton'], riskLevel: 'High', age: 40, active: false,
    description: 'Larvae feed inside cotton bolls, damaging lint and seed. Season has ended in most districts; kept for reference.',
    preventiveSuggestions: ['Destroy crop residue after final picking', 'Use pheromone traps next season'],
    recommendedAction: 'Clean up stubble and plan next season’s monitoring.',
  },
];

const resourceData = [
  { name: 'Soybean Seed JS 9560 (Certified)', category: 'Seeds', brand: 'Harit Seeds', unit: '30 kg bag', price: 3300, stock: 120, description: 'High-yielding, medium-duration soybean variety suited to Madhya Pradesh black soils. Certified, treated seed.' },
  { name: 'Wheat Seed MP Sharbati (Certified)', category: 'Seeds', brand: 'Harit Seeds', unit: '40 kg bag', price: 2600, stock: 90, description: 'Premium sharbati wheat with excellent grain quality. Germination above 85%.' },
  { name: 'Chickpea Seed JG 14', category: 'Seeds', brand: 'Dharti Agro', unit: '20 kg bag', price: 2100, stock: 75, description: 'Wilt-tolerant desi chickpea for timely sowing. Seed-treated.' },
  { name: 'Hybrid Tomato Seed — Determinate', category: 'Seeds', brand: 'GreenCrest', unit: '10 g packet', price: 550, stock: 200, description: 'Heat-tolerant hybrid with firm fruit that transports well to market.' },
  { name: 'DAP Fertiliser (18-46-0)', category: 'Fertilizers', brand: 'Kisan Mitra', unit: '50 kg bag', price: 1350, stock: 250, description: 'Di-ammonium phosphate for basal application at sowing; supplies nitrogen and phosphorus.' },
  { name: 'Urea (46% N)', category: 'Fertilizers', brand: 'Kisan Mitra', unit: '45 kg bag', price: 267, stock: 400, description: 'Nitrogen fertiliser for top-dressing cereals and vegetables. Apply in split doses.' },
  { name: 'NPK 10:26:26 Complex', category: 'Fertilizers', brand: 'Dharti Agro', unit: '50 kg bag', price: 1470, stock: 140, description: 'Balanced complex fertiliser, good for pulses, oilseeds and vegetables.' },
  { name: 'Muriate of Potash (MOP)', category: 'Fertilizers', brand: 'Kisan Mitra', unit: '50 kg bag', price: 1700, stock: 0, description: 'Potassium source that supports grain filling and disease resistance.' },
  { name: 'Vermicompost', category: 'Organic Products', brand: 'Dharti Agro', unit: '50 kg bag', price: 650, stock: 180, description: 'Well-matured vermicompost that improves soil structure and microbial life.' },
  { name: 'Neem Cake', category: 'Organic Products', brand: 'GreenCrest', unit: '50 kg bag', price: 900, stock: 110, description: 'Organic soil amendment that also helps reduce nematodes and soil-borne pests.' },
  { name: 'Neem Oil (1500 ppm)', category: 'Crop Care', brand: 'GreenCrest', unit: '1 litre', price: 520, stock: 160, description: 'Botanical pest deterrent for sucking pests such as whiteflies and aphids. Use as per label.' },
  { name: 'Trichoderma viride Bio-fungicide', category: 'Crop Care', brand: 'Harit Seeds', unit: '1 kg pack', price: 320, stock: 95, description: 'Beneficial fungus for seed and soil treatment against wilt and root-rot diseases.' },
  { name: 'Yellow Sticky Traps', category: 'Crop Care', brand: 'GreenCrest', unit: 'Pack of 25', price: 450, stock: 130, description: 'Monitor and trap whiteflies, aphids and leaf-miners in vegetable crops.' },
  { name: 'Helicoverpa Pheromone Trap Kit', category: 'Crop Care', brand: 'Harit Seeds', unit: 'Trap + 5 lures', price: 380, stock: 85, description: 'Funnel trap with lures for monitoring pod borer moths in chickpea, tomato and pigeon pea.' },
  { name: 'Knapsack Sprayer', category: 'Equipment', brand: 'Kisan Mitra', unit: '16 litre', price: 2400, stock: 40, description: 'Manual knapsack sprayer with brass nozzle and adjustable pressure.' },
  { name: 'Battery-operated Sprayer', category: 'Equipment', brand: 'Kisan Mitra', unit: '16 litre', price: 4200, stock: 22, description: 'Rechargeable sprayer with 6-hour battery; reduces spraying effort and gives even coverage.' },
  { name: 'Digital Soil pH & Moisture Meter', category: 'Equipment', brand: 'GreenCrest', unit: '1 piece', price: 1150, stock: 35, description: 'Handy probe for quick field checks. Indicative readings — confirm with a lab test.' },
  { name: 'Drip Irrigation Kit', category: 'Irrigation', brand: 'Dharti Agro', unit: '1 acre set', price: 28000, stock: 12, description: 'Mainline, sub-main, laterals with inline drippers, filter and fittings for one acre of row crops.' },
  { name: 'HDPE Sprinkler Set', category: 'Irrigation', brand: 'Dharti Agro', unit: '5-nozzle set', price: 6800, stock: 18, description: 'Portable sprinkler set suitable for wheat, gram and mustard.' },
  { name: 'Drip Lateral Pipe 16 mm', category: 'Irrigation', brand: 'Dharti Agro', unit: '400 m roll', price: 3600, stock: 30, description: 'UV-stabilised lateral pipe for replacing or extending drip lines.', available: false },
];

const expertData = [
  { name: 'Dr. Meenakshi Rao', title: 'Soil Scientist', expertise: 'Soil fertility & nutrient management', experienceYears: 18, specializations: ['Soil testing', 'Nutrient planning', 'Black soils'], languages: ['en', 'hi'], availability: 'Mon–Fri, 10:00–16:00', bio: 'Helps farmers read soil-test reports and build balanced fertiliser plans that cut cost without cutting yield. Has worked with farmer groups across Malwa and Bundelkhand.' },
  { name: 'Dr. Harish Tiwari', title: 'Plant Pathologist', expertise: 'Crop diseases', experienceYears: 22, specializations: ['Fungal diseases', 'Viral diseases', 'Soybean', 'Wheat'], languages: ['en', 'hi'], availability: 'Mon–Sat, 11:00–17:00', bio: 'Diagnoses disease problems from field symptoms and photographs, and advises on resistant varieties and seed treatment.' },
  { name: 'Kavita Solanki', title: 'Irrigation Engineer', expertise: 'Drip & sprinkler design', experienceYears: 12, specializations: ['Drip design', 'Water budgeting', 'Subsidy paperwork'], languages: ['en', 'hi', 'mr'], availability: 'Tue–Sun, 09:00–15:00', bio: 'Designs low-cost irrigation layouts for small and medium farms and helps with scheme documentation.' },
  { name: 'Dr. Imran Qureshi', title: 'Entomologist', expertise: 'Integrated pest management', experienceYears: 15, specializations: ['Pod borer', 'Whitefly', 'Pheromone traps', 'Bio-control'], languages: ['en', 'hi'], availability: 'Mon–Fri, 14:00–18:00', bio: 'Builds scouting and threshold-based pest plans so that sprays are used only when they are really needed.' },
  { name: 'Prakash Deshmukh', title: 'Organic Farming Consultant', expertise: 'Organic & natural farming', experienceYears: 20, specializations: ['Composting', 'Natural farming', 'Organic certification'], languages: ['en', 'hi', 'mr'], availability: 'Wed–Sun, 10:00–16:00', bio: 'Practising organic farmer who now trains others to move step by step from chemical to natural inputs.' },
  { name: 'Dr. Neha Kulkarni', title: 'Horticulture Specialist', expertise: 'Vegetables, onion & grapes', experienceYears: 10, specializations: ['Vegetables', 'Onion', 'Grapes', 'Post-harvest'], languages: ['en', 'mr'], availability: 'Mon–Sat, 09:00–13:00', bio: 'Advises on crop scheduling, canopy management and post-harvest handling for high-value horticulture crops.' },
];

const postData = [
  {
    author: 'sunita', category: 'Pest & Disease', age: 3,
    title: 'Yellow patches on soybean leaves — is it mosaic virus?',
    body: 'In the last week I have seen bright yellow patches on the leaves of about 15% of my soybean plants (JS 9560). Whiteflies are also visible on the underside. Has anyone dealt with this and what did you do? Should I uproot the plants?',
    likedBy: ['ramesh', 'geeta', 'dinesh'],
    comments: [
      { author: 'ramesh', body: 'Same thing happened in my north plot. I uprooted the worst plants straight away and put yellow sticky traps. Spread slowed down noticeably.' },
      { author: 'lalita', body: 'Do not wait — early removal matters. Also check the neighbouring weeds, whiteflies hide there.', replyTo: 0 },
      { author: 'admin', body: 'Thanks for sharing. Please also see the Yellow Mosaic Virus entry under Pest Alerts and book a consultation with Dr. Tiwari if it keeps spreading.' },
    ],
  },
  {
    author: 'ramesh', category: 'Irrigation', age: 6,
    title: 'Drip vs flood irrigation for wheat — what worked for you?',
    body: 'I am planning to try drip on one acre of wheat this rabi to save water. Anyone with experience on yield difference and cost? Mostly worried about rodent damage to the laterals.',
    likedBy: ['sunita', 'mahesh'],
    comments: [
      { author: 'mahesh', body: 'I run drip on onion and grapes. Rodent damage is real, so bury the mainline and keep the field edges clean. Water saving was around 35–40% for me.' },
      { author: 'geeta', body: 'Sprinkler worked better for wheat on my farm — cheaper and easy to move. Worth comparing both.' },
    ],
  },
  {
    author: 'dinesh', category: 'Farming Techniques', age: 9,
    title: 'Chickpea sowing time after the late monsoon withdrawal',
    body: 'Soil moisture is still good after the late rains. Should I sow chickpea now or wait for another week or two for temperatures to fall? Black soil, JG 12 variety.',
    likedBy: ['ramesh'],
    comments: [{ author: 'ramesh', body: 'I sowed JG 14 last week once the top soil was workable. Seed treatment with Trichoderma helped germination in the moist soil.' }],
  },
  {
    author: 'geeta', category: 'Market & Schemes', age: 12,
    title: 'How do you check your PM-KISAN instalment status?',
    body: 'My last instalment has not arrived. Where can I check the status and what documents usually cause the delay?',
    likedBy: [],
    comments: [
      { author: 'sunita', body: 'The official PM-KISAN portal has a "Know your status" option. In my case the delay was an Aadhaar and bank account mismatch — the CSC centre fixed it.' },
      { author: 'dinesh', body: 'Also confirm your land record is updated. That is the other common reason.', replyTo: 0 },
    ],
  },
  {
    author: 'ramesh', category: 'Harvest', age: 15,
    title: 'Harvested 11 quintals per acre of soybean this season',
    body: 'Sharing my numbers for those who asked: JS 9560, sown mid-June, two sprays of fungicide and one of insecticide, one protective irrigation during pod filling. 11 quintals/acre on the main plot, about 8 on the poorly drained north plot.',
    likedBy: ['sunita', 'geeta', 'dinesh', 'lalita', 'mahesh'],
    comments: [
      { author: 'sunita', body: 'Great result! Did you do a soil test before sowing?' },
      { author: 'ramesh', body: 'Yes, and it showed low phosphorus, so I raised the DAP dose at sowing. Worth doing every season.', replyTo: 0 },
    ],
  },
  {
    author: 'mahesh', category: 'Weather', age: 1,
    title: 'Heavy rain forecast next week — how are you protecting standing crops?',
    body: 'Forecast shows heavy rain in the coming days with my onion nursery and some late vegetables in the field. I am opening drainage channels and holding back fertiliser. What else should I do?',
    likedBy: ['ramesh'],
    comments: [{ author: 'lalita', body: 'Stake tall plants, harvest anything that is ready, and avoid spraying just before rain. Fungicide gets washed off.' }],
  },
  {
    author: 'lalita', category: 'Farming Techniques', age: 21,
    title: 'Making vermicompost at home — my beds after 3 months',
    body: 'Started two beds with cow dung and kitchen waste last July. Compost is ready, dark and crumbly. Happy to share how I manage moisture and keep ants away. Ask me anything!',
    likedBy: ['geeta', 'sunita'],
    comments: [{ author: 'geeta', body: 'Please share the moisture routine — my beds keep drying out in summer.' }],
  },
  {
    author: 'ramesh', category: 'Pest & Disease', age: 5,
    title: 'Reducing whitefly in tomato naturally',
    body: 'Leaf curl is starting in my tomato rows. Besides yellow sticky traps and neem oil, what natural methods have worked for you? I want to avoid heavy chemical sprays on the organic block.',
    likedBy: ['mahesh', 'lalita'],
    comments: [
      { author: 'mahesh', body: 'Border rows of maize or sorghum act as a barrier. Also reflective mulch kept whiteflies away in my trials.' },
      { author: 'admin', body: 'Good question. Dr. Qureshi (Entomologist) is available for consultations on bio-control — see the Experts page.' },
    ],
  },
];

// ------------------------------------------------------------------ helpers
const pickN = (arr, n, offset = 0) => Array.from({ length: n }, (_, i) => arr[(i + offset) % arr.length]);

const STATUS_FLOW = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

function buildHistory(status, daysAgo) {
  const steps = status === 'Cancelled' ? ['Pending', 'Cancelled'] : STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(status) + 1);
  return steps.map((step, i) => ({
    status: step,
    at: new Date(Date.now() - daysAgo * DAY + i * 0.4 * DAY),
    note: i === 0 ? 'Order placed' : step === 'Cancelled' ? 'Cancelled by farmer' : undefined,
  }));
}

async function run() {
  if (nodeEnv === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed in production without --force (this deletes ALL data).');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log(`Connected to ${mongoose.connection.name}. Clearing existing data…`);
  await Promise.all(
    [User, Farm, Crop, SoilRecord, WeatherData, WeatherAlert, PestAlert, Resource, Order, Expert, Consultation, Post, Comment, Activity].map((m) => m.deleteMany({}))
  );

  // ---- users (create() per document so the bcrypt pre-save hook runs)
  const users = {};
  for (const u of userData) {
    const { key, age, ...fields } = u;
    users[key] = await User.create({ password: FARMER_PASSWORD, ...fields, createdAt: daysFromNow(-age) });
  }

  // ---- farms & crops
  const farms = {};
  for (const f of farmData) {
    const { owner, key, ...fields } = f;
    farms[key] = await Farm.create({ ...fields, owner: users[owner]._id });
  }
  for (const c of cropData) {
    const farm = farms[c.farm];
    const farmDoc = farmData.find((f) => f.key === c.farm);
    await Crop.create({
      owner: farm.owner,
      farm: farm._id,
      name: c.name,
      variety: c.variety,
      plantingDate: daysFromNow(c.plant),
      expectedHarvestDate: daysFromNow(c.harvest),
      growthStage: c.stage,
      healthStatus: c.health,
      areaAcres: c.area,
      soilType: farmDoc.soilType,
      irrigationMethod: c.irrigation,
      notes: c.notes,
    });
  }

  // ---- soil records
  for (const s of soilData) {
    const farm = farms[s.farm];
    const { farm: farmKey, age, ...values } = s;
    await SoilRecord.create({ ...values, owner: farm.owner, farm: farm._id, soilType: farm.soilType, sampledOn: daysFromNow(-age), analysis: analyse(values) });
  }

  // ---- pest alerts
  for (const p of pestData) {
    const { age, ...fields } = p;
    await PestAlert.create({ ...fields, region: 'Madhya Pradesh', detectedOn: daysFromNow(-age), createdBy: users.admin._id, createdAt: daysFromNow(-age - 1) });
  }

  // ---- resources
  const resources = {};
  for (const r of resourceData) {
    resources[r.name] = await Resource.create(r);
  }

  // ---- experts
  const experts = [];
  for (const e of expertData) experts.push(await Expert.create(e));

  // ---- consultations
  await Consultation.create([
    {
      farmer: users.ramesh._id, expert: experts[1]._id, topic: 'Yellow patches on soybean leaves', crop: 'Soybean',
      description: 'About 15% of plants show bright yellow mottling and whiteflies are present on the underside of leaves. Should I uproot affected plants or can I treat the field?',
      status: 'Completed', createdAt: daysFromNow(-12),
      expertResponse: 'This looks like yellow mosaic virus. Uproot and destroy affected plants, install yellow sticky traps, and keep weeds under control around the field. Avoid late sowing next year and prefer tolerant varieties.',
    },
    {
      farmer: users.ramesh._id, expert: experts[3]._id, topic: 'Leaf curl in chilli and tomato', crop: 'Chilli',
      description: 'Leaf curl is spreading in the chilli block and has started in tomato. I use drip and sticky traps. What else can I do on an organic farm?',
      preferredDate: daysFromNow(3), status: 'Requested', createdAt: daysFromNow(-1),
    },
    {
      farmer: users.sunita._id, expert: experts[0]._id, topic: 'Low phosphorus in black soil', crop: 'Wheat',
      description: 'My soil test shows phosphorus at 9 kg/ha and pH 8.1. Please advise on a fertiliser plan for wheat.',
      status: 'Accepted', createdAt: daysFromNow(-3),
    },
  ]);

  // ---- orders (named + generated history across six months for the reports)
  const makeOrder = async ({ user, lines, status, daysAgo }) => {
    const items = lines.map(([name, qty]) => {
      const r = resources[name];
      return { resource: r._id, name: r.name, unit: r.unit, price: r.price, quantity: qty };
    });
    const owner = users[user];
    const farmForUser = farmData.find((f) => f.owner === user);
    return Order.create({
      user: owner._id,
      items,
      totalAmount: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status,
      statusHistory: buildHistory(status, daysAgo),
      delivery: {
        name: owner.name,
        phone: owner.phone,
        address: `${farmForUser ? farmForUser.name : 'Village road'}, near main chowk`,
        city: owner.location.split(',')[0],
        pincode: '462001',
      },
      createdAt: daysFromNow(-daysAgo),
    });
  };

  await makeOrder({ user: 'ramesh', status: 'Delivered', daysAgo: 24, lines: [['DAP Fertiliser (18-46-0)', 6], ['Neem Oil (1500 ppm)', 2]] });
  await makeOrder({ user: 'ramesh', status: 'Delivered', daysAgo: 2, lines: [['Yellow Sticky Traps', 3], ['Trichoderma viride Bio-fungicide', 2]] });
  await makeOrder({ user: 'ramesh', status: 'Shipped', daysAgo: 3, lines: [['Chickpea Seed JG 14', 4], ['Helicoverpa Pheromone Trap Kit', 2]] });
  await makeOrder({ user: 'ramesh', status: 'Pending', daysAgo: 0, lines: [['Wheat Seed MP Sharbati (Certified)', 5], ['Vermicompost', 10]] });
  await makeOrder({ user: 'sunita', status: 'Processing', daysAgo: 4, lines: [['DAP Fertiliser (18-46-0)', 8], ['Knapsack Sprayer', 1]] });
  await makeOrder({ user: 'mahesh', status: 'Confirmed', daysAgo: 1, lines: [['Drip Lateral Pipe 16 mm', 1], ['Neem Cake', 6]] });
  await makeOrder({ user: 'geeta', status: 'Cancelled', daysAgo: 8, lines: [['Battery-operated Sprayer', 1]] });

  const farmerKeys = ['ramesh', 'sunita', 'mahesh', 'geeta', 'dinesh', 'lalita'];
  const resourceNames = Object.keys(resources);
  for (let month = 5; month >= 1; month -= 1) {
    for (let k = 0; k < 2 + (month % 2); k += 1) {
      const lines = pickN(resourceNames, 2, month * 3 + k * 5).map((name, idx) => [name, 1 + ((month + k + idx) % 4)]);
      await makeOrder({ user: farmerKeys[(month + k) % farmerKeys.length], status: 'Delivered', daysAgo: month * 30 + k * 7 + 3, lines });
    }
  }

  // ---- community
  const allFarmers = (keys) => keys.map((key) => users[key]._id);
  for (const p of postData) {
    const post = await Post.create({
      author: users[p.author]._id,
      title: p.title,
      body: p.body,
      category: p.category,
      likes: allFarmers(p.likedBy),
      createdAt: daysFromNow(-p.age),
    });
    const created = [];
    for (const c of p.comments) {
      const comment = await Comment.create({
        post: post._id,
        author: users[c.author]._id,
        parent: c.replyTo !== undefined ? created[c.replyTo]._id : null,
        body: c.body,
        createdAt: new Date(post.createdAt.getTime() + (created.length + 1) * 3 * 60 * 60 * 1000),
      });
      created.push(comment);
    }
    post.commentCount = created.length;
    await post.save(); // recalculates the popularity score
  }

  // ---- activity feed for the demo farmer
  const activity = [
    [0, 'order', 'Placed order for wheat seed and vermicompost'],
    [1, 'consultation', 'Requested consultation with Dr. Imran Qureshi: Leaf curl in chilli and tomato'],
    [2, 'order', 'Order for yellow sticky traps is now Delivered'],
    [5, 'community', 'Posted in community: "Reducing whitefly in tomato naturally"'],
    [6, 'soil', 'Soil analysis for "Verma Kheti — Berasia Road": Good (71/100)'],
    [8, 'crop', 'Added crop Chickpea (JG 14)'],
    [12, 'consultation', 'Consultation "Yellow patches on soybean leaves" is now Completed'],
    [15, 'community', 'Posted in community: "Harvested 11 quintals per acre of soybean this season"'],
  ];
  await Activity.insertMany(activity.map(([age, type, message]) => ({ user: users.ramesh._id, type, message, createdAt: daysFromNow(-age) })));
  await Activity.insertMany([
    { user: users.sunita._id, type: 'order', message: 'Placed order for DAP and a knapsack sprayer', createdAt: daysFromNow(-4) },
    { user: users.mahesh._id, type: 'order', message: 'Placed order for drip lateral pipe and neem cake', createdAt: daysFromNow(-1) },
  ]);

  // ---- weather: cached snapshot (served as an offline fallback) + an admin advisory
  const today = new Date();
  const forecastRows = [
    ['Partly cloudy', 'bi-cloud-sun', 22, 33, 10, 0],
    ['Clear sky', 'bi-sun', 21, 34, 5, 0],
    ['Mainly clear', 'bi-sun', 20, 34, 5, 0],
    ['Rain showers', 'bi-cloud-rain', 21, 30, 70, 14],
    ['Rain', 'bi-cloud-rain', 20, 27, 80, 22],
    ['Partly cloudy', 'bi-cloud-sun', 20, 31, 25, 1],
    ['Clear sky', 'bi-sun', 19, 32, 5, 0],
  ];
  await WeatherData.create({
    locationKey: 'bhopal',
    location: { name: 'Bhopal', region: 'Madhya Pradesh', country: 'India', latitude: 23.2599, longitude: 77.4126 },
    current: { temperature: 29, feelsLike: 31, condition: 'Partly cloudy', icon: 'bi-cloud-sun', humidity: 56, windSpeed: 11, rainProbability: 10, precipitation: 0 },
    forecast: forecastRows.map(([condition, icon, min, max, rainProbability, rainfall], i) => ({
      date: new Date(today.getTime() + i * DAY).toISOString().slice(0, 10), condition, icon, min, max, rainProbability, rainfall,
    })),
    source: 'seed',
    fetchedAt: daysFromNow(-1),
  });
  await WeatherAlert.create([
    { title: 'Rain expected mid-week', message: 'Showers are likely in and around Bhopal in the next few days. Postpone soybean harvesting where possible and keep harvested produce under cover.', severity: 'warning', region: 'Bhopal', active: true, expiresAt: daysFromNow(6), createdBy: users.admin._id },
    { title: 'Free soil-testing camp', message: 'Krishi Vigyan Kendra soil-health camps run every Saturday this month. Carry a 500 g soil sample from 6 inches depth.', severity: 'info', region: 'All', active: true, createdBy: users.admin._id },
  ]);

  console.log('\nSeed complete.\n');
  console.log('Demo logins');
  console.log(`  Admin : admin@smartagritech.in / ${ADMIN_PASSWORD}`);
  console.log(`  Farmer: ramesh.verma@example.com / ${FARMER_PASSWORD}  (best-populated demo account)`);
  console.log(`  Farmer: sunita.patel@example.com / ${FARMER_PASSWORD}`);
  console.log(`  Farmer: mahesh.jadhav@example.com / ${FARMER_PASSWORD}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Seeding failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
