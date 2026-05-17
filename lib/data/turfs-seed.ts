// Static turf seed data.
// Kollam: real data from docs/kollam_turfs.json (image paths match public/turfs/).
// Other regions: believable demo data with placeholder GeoJSON coords.

export interface TurfSeedEntry {
  name: string;
  address: string;
  region: string;
  pricePerHour: number;
  contactNumber: string;
  images: string[];
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
}

export const TURF_SEED_DATA: TurfSeedEntry[] = [
  // ── Kollam (real) ────────────────────────────────────────────────────────
  {
    name: "Quilon Football Club(QFC) Turf",
    address: "Kottakkakam ward, Vidya nagar, Kollam, Kerala 691013",
    region: "Kollam",
    pricePerHour: 1200,
    contactNumber: "9876543210",
    images: ["/turfs/QFC_turf.jpg"],
    location: { type: "Point", coordinates: [76.6141, 8.8932] },
  },
  {
    name: "Dethan's multisports",
    address: "Kottamkara, Kollam, Kerala, 691005",
    region: "Kollam",
    pricePerHour: 1000,
    contactNumber: "9876543211",
    images: ["/turfs/Dethans.jpg"],
    location: { type: "Point", coordinates: [76.5983, 8.8801] },
  },
  {
    name: "Soccerz Football Turf",
    address: "Vadakkevila, Kollam, Kerala 691010",
    region: "Kollam",
    pricePerHour: 1200,
    contactNumber: "9876543210",
    images: ["/turfs/Soccerz.jpg"],
    location: { type: "Point", coordinates: [76.6074, 8.9012] },
  },
  {
    name: "Taurus Sports Club",
    address: "Taluk Kachery, Kollam, Kerala, 691001",
    region: "Kollam",
    pricePerHour: 1000,
    contactNumber: "9876543211",
    images: ["/turfs/Taurus.jpg"],
    location: { type: "Point", coordinates: [76.6050, 8.8870] },
  },
  {
    name: "Club Vamos",
    address: "Bishop Joseph Sapthathi Nagar, Hospital Rd, Kollam, Kerala, 691001",
    region: "Kollam",
    pricePerHour: 1000,
    contactNumber: "9876543211",
    images: ["/turfs/clubvamos.jpg"],
    location: { type: "Point", coordinates: [76.6020, 8.8860] },
  },

  // ── Manchester ────────────────────────────────────────────────────────────
  {
    name: "Trafford 5-a-Side Centre",
    address: "Stretford Road, Manchester, M16 0RA",
    region: "manchester",
    pricePerHour: 1800,
    contactNumber: "01619991234",
    images: [],
    location: { type: "Point", coordinates: [-2.2913, 53.4616] },
  },
  {
    name: "Ancoats Football Hub",
    address: "Jersey Street, Ancoats, Manchester, M4 6JG",
    region: "manchester",
    pricePerHour: 1600,
    contactNumber: "01619995678",
    images: [],
    location: { type: "Point", coordinates: [-2.2168, 53.4834] },
  },
  {
    name: "Northern Quarter Turf",
    address: "Tib Street, Manchester, M4 1LN",
    region: "manchester",
    pricePerHour: 2000,
    contactNumber: "01619990123",
    images: [],
    location: { type: "Point", coordinates: [-2.2338, 53.4836] },
  },

  // ── Birmingham ────────────────────────────────────────────────────────────
  {
    name: "Digbeth Football Arena",
    address: "Heath Mill Lane, Digbeth, Birmingham, B9 4AL",
    region: "birmingham",
    pricePerHour: 1500,
    contactNumber: "01219991234",
    images: [],
    location: { type: "Point", coordinates: [-1.8828, 52.4740] },
  },
  {
    name: "Brindleyplace FC Turf",
    address: "Brindleyplace, Birmingham, B1 2JB",
    region: "birmingham",
    pricePerHour: 1800,
    contactNumber: "01219995678",
    images: [],
    location: { type: "Point", coordinates: [-1.9089, 52.4791] },
  },
  {
    name: "Jewellery Quarter Sports",
    address: "Vyse Street, Jewellery Quarter, Birmingham, B18 6HJ",
    region: "birmingham",
    pricePerHour: 1600,
    contactNumber: "01219990123",
    images: [],
    location: { type: "Point", coordinates: [-1.9128, 52.4886] },
  },

  // ── Leeds ─────────────────────────────────────────────────────────────────
  {
    name: "Elland Road Community Pitch",
    address: "Elland Road, Leeds, LS11 0ES",
    region: "leeds",
    pricePerHour: 1400,
    contactNumber: "01139991234",
    images: [],
    location: { type: "Point", coordinates: [-1.5722, 53.7775] },
  },
  {
    name: "Kirkstall Valley FC Turf",
    address: "Kirkstall Road, Leeds, LS4 2AW",
    region: "leeds",
    pricePerHour: 1200,
    contactNumber: "01139995678",
    images: [],
    location: { type: "Point", coordinates: [-1.5760, 53.8086] },
  },
  {
    name: "Roundhay Sports Centre",
    address: "Princes Avenue, Roundhay, Leeds, LS8 2EP",
    region: "leeds",
    pricePerHour: 1300,
    contactNumber: "01139990123",
    images: [],
    location: { type: "Point", coordinates: [-1.5037, 53.8318] },
  },

  // ── Liverpool ─────────────────────────────────────────────────────────────
  {
    name: "Baltic Triangle FC",
    address: "Jamaica Street, Liverpool, L1 0AF",
    region: "liverpool",
    pricePerHour: 1500,
    contactNumber: "01519991234",
    images: [],
    location: { type: "Point", coordinates: [-2.9875, 53.3976] },
  },
  {
    name: "Mersey Dock 5-a-Side",
    address: "Wapping, Liverpool, L1 8DQ",
    region: "liverpool",
    pricePerHour: 1700,
    contactNumber: "01519995678",
    images: [],
    location: { type: "Point", coordinates: [-2.9942, 53.3998] },
  },
  {
    name: "Anfield Training Turf",
    address: "Anfield Road, Liverpool, L4 0TH",
    region: "liverpool",
    pricePerHour: 2000,
    contactNumber: "01519990123",
    images: [],
    location: { type: "Point", coordinates: [-2.9608, 53.4308] },
  },

  // ── Glasgow ───────────────────────────────────────────────────────────────
  {
    name: "Parkhead Community Turf",
    address: "London Road, Parkhead, Glasgow, G31 4QP",
    region: "glasgow",
    pricePerHour: 1300,
    contactNumber: "01419991234",
    images: [],
    location: { type: "Point", coordinates: [-4.2065, 55.8493] },
  },
  {
    name: "Riverside FC Pitch",
    address: "Clyde Street, Glasgow, G1 4JH",
    region: "glasgow",
    pricePerHour: 1200,
    contactNumber: "01419995678",
    images: [],
    location: { type: "Point", coordinates: [-4.2591, 55.8567] },
  },
  {
    name: "West End Football Centre",
    address: "Byres Road, Glasgow, G12 8TB",
    region: "glasgow",
    pricePerHour: 1500,
    contactNumber: "01419990123",
    images: [],
    location: { type: "Point", coordinates: [-4.2894, 55.8749] },
  },

  // ── Bristol ───────────────────────────────────────────────────────────────
  {
    name: "Ashton Gate Turf",
    address: "Ashton Road, Bristol, BS3 2EJ",
    region: "bristol",
    pricePerHour: 1400,
    contactNumber: "01179991234",
    images: [],
    location: { type: "Point", coordinates: [-2.6200, 51.4399] },
  },
  {
    name: "Harbourside FC Pitch",
    address: "Anchor Road, Bristol, BS1 5TT",
    region: "bristol",
    pricePerHour: 1600,
    contactNumber: "01179995678",
    images: [],
    location: { type: "Point", coordinates: [-2.5988, 51.4499] },
  },
  {
    name: "Clifton Football Centre",
    address: "Whiteladies Road, Clifton, Bristol, BS8 2PH",
    region: "bristol",
    pricePerHour: 1800,
    contactNumber: "01179990123",
    images: [],
    location: { type: "Point", coordinates: [-2.6107, 51.4641] },
  },

  // ── Edinburgh ─────────────────────────────────────────────────────────────
  {
    name: "Murrayfield Turf",
    address: "Roseburn Street, Edinburgh, EH12 5PJ",
    region: "edinburgh",
    pricePerHour: 1500,
    contactNumber: "01319991234",
    images: [],
    location: { type: "Point", coordinates: [-3.2384, 55.9461] },
  },
  {
    name: "Leith Athletic Centre",
    address: "Easter Road, Leith, Edinburgh, EH7 5QG",
    region: "edinburgh",
    pricePerHour: 1200,
    contactNumber: "01319995678",
    images: [],
    location: { type: "Point", coordinates: [-3.1677, 55.9630] },
  },
  {
    name: "Old Town FC Pitch",
    address: "Cowgate, Edinburgh, EH1 1JQ",
    region: "edinburgh",
    pricePerHour: 1700,
    contactNumber: "01319990123",
    images: [],
    location: { type: "Point", coordinates: [-3.1894, 55.9484] },
  },

  // ── Cardiff ───────────────────────────────────────────────────────────────
  {
    name: "Cardiff Bay Turf",
    address: "Bute Street, Cardiff Bay, CF10 5LJ",
    region: "cardiff",
    pricePerHour: 1300,
    contactNumber: "02920991234",
    images: [],
    location: { type: "Point", coordinates: [-3.1635, 51.4640] },
  },
  {
    name: "Llandaff FC Pitch",
    address: "Llandaff Road, Cardiff, CF11 9NR",
    region: "cardiff",
    pricePerHour: 1100,
    contactNumber: "02920995678",
    images: [],
    location: { type: "Point", coordinates: [-3.2161, 51.4918] },
  },
  {
    name: "Bute Park Football Centre",
    address: "North Road, Cardiff, CF10 3DX",
    region: "cardiff",
    pricePerHour: 1400,
    contactNumber: "02920990123",
    images: [],
    location: { type: "Point", coordinates: [-3.1846, 51.4863] },
  },

  // ── Other ─────────────────────────────────────────────────────────────────
  {
    name: "City 5-a-Side Arena",
    address: "Sports Quarter, City Centre",
    region: "other",
    pricePerHour: 1500,
    contactNumber: "09999991234",
    images: [],
    location: { type: "Point", coordinates: [-0.1278, 51.5074] },
  },
  {
    name: "Riverside Football Turf",
    address: "Riverside Drive, City Centre",
    region: "other",
    pricePerHour: 1200,
    contactNumber: "09999995678",
    images: [],
    location: { type: "Point", coordinates: [-0.1218, 51.5014] },
  },
  {
    name: "Academy FC Pitch",
    address: "Academy Road, City Centre",
    region: "other",
    pricePerHour: 1000,
    contactNumber: "09999990123",
    images: [],
    location: { type: "Point", coordinates: [-0.1318, 51.5134] },
  },
];
