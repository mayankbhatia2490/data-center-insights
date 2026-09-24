export type DataCenter = {
  id: string;
  canonical_name: string;
  operator_name: string | null;
  country: string;
  market: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  location_precision: "exact" | "approximate" | "city_centroid" | "market" | "restricted" | "undisclosed";
  lifecycle_stage: "land_banked" | "planned" | "under_construction" | "operational" | "decommissioned" | "unknown";
  service_types: string[];
  capacity_mw: number | null;
  capacity_basis: string | null;
  capacity_status: "reported" | "announced" | "estimated" | "not_disclosed";
  verification_status: "verified" | "needs_review" | "rejected" | "unverified";
  verification_score: number;
  source_url?: string;
};

const site = (id: string, name: string, operator: string, country: string, market: string, city: string, latitude: number, longitude: number, stage: DataCenter["lifecycle_stage"], services: string[], capacity: number | null = null, capacityStatus: DataCenter["capacity_status"] = "not_disclosed"): DataCenter => ({
  id, canonical_name: name, operator_name: operator, country, market, city, latitude, longitude, location_precision: "city_centroid", lifecycle_stage: stage, service_types: services, capacity_mw: capacity, capacity_basis: capacity ? "it_load" : null, capacity_status: capacityStatus, verification_status: "needs_review", verification_score: capacity ? 70 : 0,
});

export const gccDataCenters: DataCenter[] = [
  site("seed-khazna-auh1", "Khazna AUH1", "Khazna Data Centers", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["colocation", "hyperscale"]),
  site("seed-khazna-auh2", "Khazna AUH2", "Khazna Data Centers", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["colocation", "hyperscale"]),
  site("seed-khazna-auh3", "Khazna AUH3", "Khazna Data Centers", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["colocation", "hyperscale"]),
  site("seed-khazna-auh4", "Khazna AUH4", "Khazna Data Centers", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "under_construction", ["hyperscale", "ai"], null, "announced"),
  site("seed-khazna-auh8", "Khazna AUH8", "Khazna Data Centers", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "under_construction", ["hyperscale", "ai"], null, "announced"),
  site("seed-equinix-ad1", "Equinix AD1", "Equinix", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["colocation", "cloud"]),
  site("seed-gdh-kizad", "Gulf Data Hub KIZAD 1", "Gulf Data Hub", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["colocation", "hyperscale"]),
  site("seed-injazat", "Injazat Data Center", "Core42", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["cloud", "government", "ai"]),
  site("seed-puredc-ad", "PureDC Abu Dhabi", "Pure Data Centres Group", "United Arab Emirates", "Abu Dhabi", "Yas Island", 24.4539, 54.3773, "operational", ["colocation", "cloud"]),
  site("seed-etisalat-ad", "Etisalat Abu Dhabi", "e&", "United Arab Emirates", "Abu Dhabi", "Abu Dhabi", 24.4539, 54.3773, "operational", ["telecom", "cloud"]),
  site("seed-detasad-ruh", "DETASAD Gornatha", "Detecon Al Saudia", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["colocation", "cloud"]),
  site("seed-nournet-ruh", "NourNET Riyadh Data Center", "NourNet", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["colocation", "cloud"]),
  site("seed-sahara-ruh", "Sahara Net Riyadh Data Center", "Sahara Net", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["colocation", "cloud"]),
  site("seed-mobily-malga1", "Mobily Malga 1", "Mobily", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["telecom", "cloud"]),
  site("seed-mobily-malga2", "Mobily Malga 2", "Mobily", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["telecom", "cloud"]),
  site("seed-center3-102", "Center3 Riyadh102", "Center3", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["colocation", "cloud", "connectivity"]),
  site("seed-datavolt-ruh", "DataVolt Riyadh East DC", "DataVolt", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "under_construction", ["hyperscale", "ai"], null, "announced"),
  site("seed-sahayab-ruh", "Sahayeb Data Park Riyadh DC1", "Sahayab Datacenters", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "under_construction", ["colocation", "cloud"], null, "announced"),
  site("seed-center3-khurais", "Center3 Khurais Riyadh", "Center3", "Saudi Arabia", "Riyadh", "Riyadh", 24.7136, 46.6753, "operational", ["colocation", "cloud", "connectivity"], 9.6, "reported"),
  site("seed-ooredoo-doha", "Ooredoo Data Center Doha", "Ooredoo", "Qatar", "Doha", "Doha", 25.2854, 51.531, "operational", ["telecom", "cloud", "colocation"]),
  site("seed-odp-muscat", "Oman Data Park Muscat", "Oman Data Park", "Oman", "Muscat", "Muscat", 23.588, 58.3829, "operational", ["cloud", "colocation"]),
  site("seed-ooredoo-salalah", "Ooredoo Salalah Data Center", "Ooredoo", "Oman", "Salalah", "Salalah", 17.019, 54.0897, "operational", ["telecom", "cloud", "connectivity"]),
  site("seed-batelco-manama", "Batelco Data Center Manama", "Batelco", "Bahrain", "Manama", "Manama", 26.2235, 50.5876, "operational", ["telecom", "cloud", "colocation"]),
  site("seed-zain-kuwait", "Zain Data Center Kuwait City", "Zain", "Kuwait", "Kuwait City", "Kuwait City", 29.3759, 47.9774, "operational", ["telecom", "cloud", "colocation"]),
];
