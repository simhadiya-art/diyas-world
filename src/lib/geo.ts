// Builds the Map Room's outlines at build time (no map service, no client-side map library).
// The US (lower 48) is the main map; India sits in a postcard-style inset.
import { geoConicEqualArea, geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import { feature, mesh, merge } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import usTopo from 'us-atlas/states-10m.json';
import worldTopo from 'world-atlas/countries-50m.json';

export const MAP_W = 1000;
export const MAP_H = 620;
// India inset frame (top-right)
export const INSET = { x: 768, y: 30, w: 216, h: 250 };

const NOT_LOWER_48 = new Set(['02', '15', '60', '66', '69', '72', '78']);

let cache: ReturnType<typeof build> | null = null;

function build() {
  const us = simplify(presimplify(structuredClone(usTopo) as any), 0.0004) as any;
  const states = us.objects.states.geometries.filter((g: any) => !NOT_LOWER_48.has(String(g.id).padStart(2, '0')));
  const lower48 = merge(us, states);
  const borders = mesh(us, { type: 'GeometryCollection', geometries: states } as any, (a: any, b: any) => a !== b);

  const usProj = geoConicEqualArea()
    .parallels([29.5, 45.5])
    .rotate([96, 0])
    .center([0, 38.7])
    .fitExtent(
      [
        [24, 70],
        [732, 590],
      ],
      lower48 as any,
    );
  const usPath = geoPath(usProj).digits(1);

  const world = worldTopo as any;
  const india = feature(world, world.objects.countries).features.find((f: any) => f.id === '356');
  const pad = 22;
  const inProj = geoMercator().fitExtent(
    [
      [INSET.x + pad, INSET.y + pad + 18],
      [INSET.x + INSET.w - pad, INSET.y + INSET.h - pad],
    ],
    india as any,
  );
  const inPath = geoPath(inProj).digits(1);

  return {
    us: usPath(lower48 as any) ?? '',
    usBorders: usPath(borders as any) ?? '',
    india: inPath(india as any) ?? '',
    usProj,
    inProj,
  };
}

export function getMap() {
  cache ??= build();
  return cache;
}

export function project(coords: { lat: number; lon: number }, map: 'us' | 'india'): [number, number] {
  const { usProj, inProj } = getMap();
  const proj: GeoProjection = map === 'india' ? inProj : usProj;
  const p = proj([coords.lon, coords.lat]);
  return p ? [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] : [0, 0];
}
