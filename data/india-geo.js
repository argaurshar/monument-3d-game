// Hand-authored, simplified geography of India for the stylized souvenir map.
// All coordinates are [longitude, latitude]. The outline follows India's
// official external boundary (~150 points, clockwise from Sir Creek), traded
// down to what reads well at map scale — it is deliberately NOT survey data.

// ---------------------------------------------------------------------------
// Projection: local equirectangular centred on (82.5°E, 22.5°N).
// x grows east, z grows SOUTH (three.js ground plane, north = -Z).
// 1 world unit ≈ 31 km east-west (at centre latitude) and ≈ 31.7 km n-s.
// ---------------------------------------------------------------------------
export const LON0 = 82.5;
export const LAT0 = 22.5;
export const KX = 3.23; // 3.5 * cos(22.5°)
export const KZ = 3.5;

export function project(lon, lat) {
  return { x: (lon - LON0) * KX, z: -(lat - LAT0) * KZ };
}

export function unproject(x, z) {
  return { lon: x / KX + LON0, lat: -z / KZ + LAT0 };
}

// Grid over which terrain is generated (a little beyond the land).
export const GRID = { lonMin: 67.4, lonMax: 98.6, latMin: 5.6, latMax: 38.0 };

// ---------------------------------------------------------------------------
// National outline, clockwise from Sir Creek (Gujarat/Pakistan coast).
// ---------------------------------------------------------------------------
export const INDIA_OUTLINE = [
  // Western border with Pakistan, heading north through the Thar
  [68.62, 23.65], [68.45, 23.95], [68.72, 24.26], [69.65, 24.30], [70.60, 24.42],
  [71.05, 24.45], [71.90, 24.72], [71.00, 25.20], [70.28, 25.72], [70.05, 26.55],
  [69.88, 26.95], [70.35, 27.83], [71.35, 28.25], [72.40, 28.75], [73.20, 29.20],
  [73.35, 29.95], [73.88, 30.35], [74.55, 31.05], [74.55, 31.65], [75.05, 32.15],
  [74.95, 32.50],
  // Jammu & Kashmir (official claimed boundary around the crown)
  [74.35, 32.75], [73.95, 33.20], [73.60, 33.85], [73.45, 34.40], [73.80, 35.10],
  [73.40, 35.85], [72.95, 36.20], [73.30, 36.60], [74.00, 36.85], [74.90, 36.95],
  [75.45, 36.90], [76.15, 36.60], [76.80, 36.15], [77.80, 35.50], [78.90, 35.60],
  [79.85, 35.45], [80.30, 35.20],
  // Down the eastern Ladakh line to Himachal / Uttarakhand
  [80.00, 34.35], [79.35, 33.40], [79.45, 32.70], [78.75, 32.55], [78.40, 32.40],
  [78.75, 31.85], [79.60, 31.00], [80.25, 30.60], [81.00, 30.20],
  // Western and southern border of Nepal
  [80.40, 29.50], [80.10, 28.85], [80.55, 28.65], [81.30, 28.15], [82.05, 27.90],
  [82.75, 27.50], [83.35, 27.45], [84.10, 27.35], [84.68, 27.05], [85.35, 26.80],
  [86.05, 26.65], [86.75, 26.45], [87.30, 26.40], [88.05, 26.40],
  // Up the eastern Nepal border, over Sikkim, down to Bhutan
  [88.15, 26.70], [88.10, 27.10], [88.15, 27.70], [88.60, 28.10], [88.90, 27.50],
  [88.76, 27.15], [88.90, 26.85],
  // Along Bhutan's southern border
  [89.60, 26.72], [90.50, 26.75], [91.55, 26.80], [92.10, 26.85],
  // Arunachal Pradesh: up the Tawang side, along the McMahon line, to the tip
  [91.65, 27.50], [92.15, 27.85], [92.90, 28.20], [93.60, 28.70], [94.35, 29.25],
  [95.15, 29.15], [95.90, 29.40], [96.40, 29.05], [96.60, 28.75], [97.00, 28.40],
  [97.40, 28.20],
  // South along the Myanmar border (Patkai, Naga, Mizo hills)
  [97.15, 27.75], [96.85, 27.30], [96.05, 27.20], [95.45, 26.70], [95.15, 26.10],
  [94.65, 25.45], [94.75, 24.95], [94.30, 24.35], [94.15, 23.85], [93.60, 24.00],
  [93.45, 23.35], [93.20, 22.50], [92.95, 22.05], [92.65, 21.98],
  // North along the Bangladesh side, wrapping Mizoram and Tripura
  [92.60, 22.55], [92.40, 23.10], [92.35, 23.72], [92.15, 23.75], [91.95, 23.45],
  [91.60, 22.95], [91.30, 23.10], [91.15, 23.60], [91.35, 24.10], [91.95, 24.35],
  [92.25, 24.60], [92.40, 24.90],
  // West along Meghalaya's southern edge, then north to the Siliguri corridor
  [92.45, 25.00], [91.60, 25.13], [90.60, 25.15], [89.85, 25.28], [89.80, 26.10],
  [89.05, 26.35], [88.50, 26.55],
  // South along Bangladesh's western border to the Sundarbans
  [88.40, 26.30], [88.10, 25.80], [88.45, 25.20], [88.25, 24.85], [88.75, 24.30],
  [88.55, 23.60], [88.85, 23.20], [88.95, 22.60], [89.05, 22.10], [89.05, 21.65],
  // East coast: Bengal, Odisha, Andhra, Tamil Nadu
  [88.15, 21.70], [87.80, 21.70], [87.20, 21.75], [87.00, 21.40], [86.85, 20.80],
  [86.70, 20.35], [86.30, 20.05], [85.85, 19.85], [85.45, 19.70], [85.05, 19.45],
  [84.75, 19.10], [84.10, 18.30], [83.55, 17.90], [83.25, 17.65], [82.55, 17.05],
  [82.25, 16.55], [81.75, 16.30], [81.25, 16.30], [80.95, 15.75], [80.20, 15.50],
  [80.10, 14.55], [80.20, 13.80], [80.35, 13.40], [80.25, 12.95], [80.15, 12.60],
  [79.85, 11.95], [79.75, 11.35], [79.85, 10.80], [79.85, 10.30], [79.35, 10.00],
  [79.25, 9.60], [78.95, 9.25], [78.55, 9.10], [78.15, 8.85], [77.85, 8.40],
  [77.54, 8.08],
  // West coast: Kerala, Karnataka, Goa, Konkan
  [77.10, 8.30], [76.85, 8.65], [76.55, 8.90], [76.35, 9.50], [76.25, 10.00],
  [76.10, 10.55], [75.95, 11.05], [75.75, 11.35], [75.50, 11.70], [75.20, 12.15],
  [74.95, 12.60], [74.82, 13.00], [74.65, 13.60], [74.50, 14.20], [74.25, 14.75],
  [74.10, 15.20], [73.95, 15.60], [73.80, 16.05], [73.65, 16.55], [73.45, 17.20],
  [73.25, 17.85], [73.05, 18.55], [72.85, 19.05], [72.80, 19.45], [72.75, 20.00],
  [72.85, 20.45], [72.90, 20.90], [72.70, 21.15],
  // Gulf of Khambhat and the Kathiawar peninsula
  [72.60, 21.60], [72.55, 22.00], [72.60, 22.20], [72.25, 21.90], [72.10, 21.55],
  [72.15, 21.10], [71.75, 20.95], [71.40, 20.85], [70.95, 20.70], [70.35, 20.85],
  [69.95, 21.15], [69.60, 21.65], [69.20, 21.95], [68.95, 22.25], [69.00, 22.50],
  // Gulf of Kutch and back to Sir Creek
  [69.65, 22.45], [70.30, 22.75], [70.40, 22.95], [69.85, 22.85], [69.30, 22.80],
  [68.95, 22.85], [68.60, 23.15], [68.40, 23.50],
];

// ---------------------------------------------------------------------------
// Relief. Ridge polylines contribute gaussian elevation by distance (degrees).
// ---------------------------------------------------------------------------
// amp = peak height in world units (~0.55 units per km of real elevation, so
// the ranges stay proportionate: Himalaya ≫ Western Ghats > Aravalli/Vindhya).
// peak = extra ridgeline roughness so crests break into individual summits.
export const RIDGES = [
  // Great Himalaya, west section (Kashmir → Kumaon) — the giants
  { pts: [[73.8, 36.2], [75.2, 35.6], [76.6, 35.1], [77.8, 34.6], [78.4, 33.8], [78.6, 32.9], [78.9, 32.1], [79.6, 31.2], [80.5, 30.5], [81.0, 30.15]], amp: 4.6, sigma: 1.0, peak: 1.0 },
  // Great Himalaya, east section (Sikkim → Arunachal)
  { pts: [[88.3, 27.9], [89.4, 28.0], [91.8, 27.8], [93.0, 28.4], [94.4, 29.0], [95.6, 29.2], [96.5, 28.9]], amp: 4.1, sigma: 0.92, peak: 1.0 },
  // Northeastern hills along Myanmar (Patkai / Naga / Mizo) — real mountains
  { pts: [[95.8, 27.2], [95.0, 26.2], [94.5, 25.2], [94.0, 24.2], [93.4, 23.2], [92.9, 22.3]], amp: 1.75, sigma: 0.5, peak: 0.9 },
  // Meghalaya plateau (Khasi/Garo hills)
  { pts: [[90.2, 25.5], [91.3, 25.45], [92.3, 25.4]], amp: 1.05, sigma: 0.42, peak: 0.6 },
  // Western Ghats — long, high wall down the west coast
  { pts: [[73.4, 20.4], [73.6, 19.0], [73.8, 17.6], [74.1, 16.2], [74.5, 14.9], [75.0, 13.6], [75.7, 12.4], [76.5, 11.3], [77.2, 10.3], [77.4, 9.3]], amp: 1.55, sigma: 0.4, peak: 0.85 },
  // Nilgiris knot (where Western & Eastern Ghats meet) — high massif
  { pts: [[76.4, 11.4], [76.7, 11.3], [77.0, 11.4]], amp: 1.7, sigma: 0.34, peak: 0.7 },
  // Eastern Ghats (lower, broken)
  { pts: [[84.6, 19.2], [83.4, 18.2], [82.2, 17.2], [80.8, 15.9], [79.6, 14.3], [79.0, 13.2]], amp: 0.9, sigma: 0.5, peak: 0.8 },
  // Aravalli range (Rajasthan diagonal)
  { pts: [[72.7, 24.5], [73.6, 25.4], [74.4, 26.3], [75.4, 27.2], [76.4, 28.0]], amp: 0.95, sigma: 0.38, peak: 0.8 },
  // Vindhya / Satpura belt across central India
  { pts: [[74.2, 22.2], [76.5, 22.2], [78.5, 22.5], [80.5, 22.9], [82.2, 23.3]], amp: 0.8, sigma: 0.55, peak: 0.8 },
];

// Broad elevated masses: [lonCentre, latCentre, amplitude, sigma]
export const MASSIFS = [
  [76.8, 35.3, 3.2, 1.9],  // Karakoram / Ladakh high country
  [79.3, 34.6, 2.4, 1.6],  // Aksai Chin plateau
  [77.3, 17.3, 0.32, 3.8], // northern Deccan plateau
  [76.2, 13.8, 0.35, 2.6], // southern Deccan (Mysore plateau)
];

// Thar desert tint region
export const THAR = [
  [69.8, 24.6], [72.6, 25.2], [74.0, 27.2], [73.6, 29.3], [71.8, 28.6], [70.0, 26.8],
];

// ---------------------------------------------------------------------------
// Rivers (drawn as ribbons slightly above the terrain)
// ---------------------------------------------------------------------------
export const RIVERS = [
  { name: 'Ganga', pts: [[78.9, 30.5], [78.15, 29.9], [78.4, 29.2], [79.2, 28.4], [80.3, 27.2], [80.9, 26.5], [81.9, 25.45], [83.0, 25.35], [84.1, 25.5], [85.2, 25.6], [86.5, 25.4], [87.5, 25.0], [88.05, 24.6], [88.15, 23.8], [88.35, 22.6], [88.1, 22.0], [88.0, 21.7]] },
  { name: 'Yamuna', pts: [[78.3, 30.9], [77.6, 30.2], [77.25, 29.4], [77.2, 28.6], [77.6, 27.6], [78.05, 27.18], [79.0, 26.8], [80.0, 26.2], [81.2, 25.7], [81.9, 25.45]] },
  { name: 'Brahmaputra', pts: [[95.7, 28.2], [95.1, 27.7], [94.3, 27.3], [93.4, 26.9], [92.5, 26.6], [91.75, 26.18], [90.7, 26.1], [89.9, 25.9], [89.8, 25.4]] },
  { name: 'Godavari', pts: [[73.6, 19.95], [74.8, 19.5], [76.0, 19.3], [77.3, 19.0], [78.7, 18.8], [79.9, 18.6], [80.7, 18.1], [81.3, 17.4], [81.75, 16.75]] },
  { name: 'Narmada', pts: [[81.6, 22.7], [80.4, 23.0], [79.2, 22.9], [78.0, 22.5], [76.6, 22.2], [75.2, 22.1], [73.9, 21.9], [72.95, 21.7]] },
];

// ---------------------------------------------------------------------------
// Forest cover. Each zone is a soft blob [lonC, latC, rLon, rLat, weight]; the
// density function sums them so trees (and a greener ground tint) appear where
// India is actually forested — the Ghats, the Northeast, central India, the
// Terai foothills, the Sundarbans — and stay away from desert and high snow.
// ---------------------------------------------------------------------------
export const FOREST_ZONES = [
  [74.4, 14.6, 1.1, 4.6, 1.05],  // Western Ghats (long strip down the west)
  [76.7, 11.3, 1.0, 1.2, 1.0],   // Nilgiris / southern Ghats
  [92.6, 26.4, 3.1, 2.3, 1.05],  // Northeast (Assam, Arunachal, Nagaland)
  [91.1, 25.3, 1.5, 0.9, 0.95],  // Meghalaya
  [81.4, 21.4, 3.3, 2.5, 0.95],  // Central India (MP / Chhattisgarh sal forests)
  [84.6, 22.8, 2.0, 1.7, 0.85],  // Jharkhand / northern Odisha
  [80.5, 28.7, 4.6, 0.65, 0.75], // Terai — Himalayan foothill forests
  [83.4, 18.4, 1.7, 1.7, 0.75],  // Eastern Ghats
  [88.85, 21.85, 0.85, 0.5, 1.0],// Sundarbans mangroves
  [77.2, 30.4, 2.2, 0.8, 0.7],   // lower Himalaya (Himachal / Uttarakhand)
];

export function forestDensity(lon, lat) {
  let d = 0;
  for (const [cx, cy, rx, ry, w] of FOREST_ZONES) {
    const dx = (lon - cx) / rx, dy = (lat - cy) / ry;
    d += w * Math.exp(-(dx * dx + dy * dy));
  }
  return d > 1 ? 1 : d;
}
