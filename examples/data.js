/* Original sample data. Copyright 2026 Tim Van Wassenhove. SPDX-License-Identifier: Apache-2.0 */
export const sampleProjects = [
  {
    "id": "p01",
    "name": "Atlas workspace",
    "owner": "Alex Morgan",
    "status": "active",
    "budget": 1200,
    "progress": 35,
    "due": "2026-10-01"
  },
  {
    "id": "p02",
    "name": "Beacon website",
    "owner": "Sam Chen",
    "status": "draft",
    "budget": 1550,
    "progress": 0,
    "due": "2026-10-02"
  },
  {
    "id": "p03",
    "name": "Cedar documentation",
    "owner": "Jordan Lee",
    "status": "done",
    "budget": 1900,
    "progress": 100,
    "due": "2026-10-03"
  },
  {
    "id": "p04",
    "name": "Delta reporting",
    "owner": "Taylor Reed",
    "status": "active",
    "budget": 2250,
    "progress": 65,
    "due": "2026-10-04"
  },
  {
    "id": "p05",
    "name": "Ember onboarding",
    "owner": "Alex Morgan",
    "status": "draft",
    "budget": 2600,
    "progress": 0,
    "due": "2026-10-05"
  },
  {
    "id": "p06",
    "name": "Field research",
    "owner": "Sam Chen",
    "status": "done",
    "budget": 2950,
    "progress": 100,
    "due": "2026-10-06"
  },
  {
    "id": "p07",
    "name": "Grove settings",
    "owner": "Jordan Lee",
    "status": "active",
    "budget": 3300,
    "progress": 35,
    "due": "2026-10-07"
  },
  {
    "id": "p08",
    "name": "Harbor migration",
    "owner": "Taylor Reed",
    "status": "draft",
    "budget": 3650,
    "progress": 0,
    "due": "2026-10-08"
  },
  {
    "id": "p09",
    "name": "Indigo dashboard",
    "owner": "Alex Morgan",
    "status": "done",
    "budget": 4000,
    "progress": 100,
    "due": "2026-10-09"
  },
  {
    "id": "p10",
    "name": "Juniper portal",
    "owner": "Sam Chen",
    "status": "active",
    "budget": 4350,
    "progress": 65,
    "due": "2026-10-10"
  },
  {
    "id": "p11",
    "name": "Kite billing",
    "owner": "Jordan Lee",
    "status": "draft",
    "budget": 4700,
    "progress": 0,
    "due": "2026-10-11"
  },
  {
    "id": "p12",
    "name": "Lumen inventory",
    "owner": "Taylor Reed",
    "status": "done",
    "budget": 5050,
    "progress": 100,
    "due": "2026-10-12"
  },
  {
    "id": "p13",
    "name": "Maple search",
    "owner": "Alex Morgan",
    "status": "active",
    "budget": 5400,
    "progress": 35,
    "due": "2026-10-13"
  },
  {
    "id": "p14",
    "name": "Northwind planning",
    "owner": "Sam Chen",
    "status": "draft",
    "budget": 5750,
    "progress": 0,
    "due": "2026-10-14"
  },
  {
    "id": "p15",
    "name": "Orbit notifications",
    "owner": "Jordan Lee",
    "status": "done",
    "budget": 6100,
    "progress": 100,
    "due": "2026-10-15"
  },
  {
    "id": "p16",
    "name": "Pine account",
    "owner": "Taylor Reed",
    "status": "active",
    "budget": 6450,
    "progress": 65,
    "due": "2026-10-16"
  },
  {
    "id": "p17",
    "name": "Quartz accessibility",
    "owner": "Alex Morgan",
    "status": "draft",
    "budget": 6800,
    "progress": 0,
    "due": "2026-10-17"
  },
  {
    "id": "p18",
    "name": "River analytics",
    "owner": "Sam Chen",
    "status": "done",
    "budget": 7150,
    "progress": 100,
    "due": "2026-10-18"
  },
  {
    "id": "p19",
    "name": "Summit mobile",
    "owner": "Jordan Lee",
    "status": "active",
    "budget": 7500,
    "progress": 35,
    "due": "2026-10-19"
  },
  {
    "id": "p20",
    "name": "Tide exports",
    "owner": "Taylor Reed",
    "status": "draft",
    "budget": 7850,
    "progress": 0,
    "due": "2026-10-20"
  },
  {
    "id": "p21",
    "name": "Umber archive",
    "owner": "Alex Morgan",
    "status": "done",
    "budget": 8200,
    "progress": 100,
    "due": "2026-10-21"
  },
  {
    "id": "p22",
    "name": "Willow library",
    "owner": "Sam Chen",
    "status": "active",
    "budget": 8550,
    "progress": 65,
    "due": "2026-10-22"
  }
];
export function readProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem('tvw-demo-projects'));
    if (Array.isArray(saved) && saved.length <= 500 && saved.every(p => p && typeof p.id === 'string' && typeof p.name === 'string' && typeof p.owner === 'string' && ['active','draft','done'].includes(p.status) && Number.isFinite(p.budget) && Number.isFinite(p.progress) && typeof p.due === 'string')) return saved;
  } catch { /* Use the example data if storage is unavailable or invalid. */ }
  return sampleProjects.map(project => ({ ...project }));
}
export function storeProjects(projects) {
  try { localStorage.setItem('tvw-demo-projects', JSON.stringify(projects)); return true; } catch { return false; }
}
