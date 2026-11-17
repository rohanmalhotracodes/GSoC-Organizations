import type { APIRoute } from 'astro';
import organizationsData from '../data/organizations.json';
import {
  buildFirstTimeHub,
  buildTaxonomyHubs,
  buildYearHubs,
} from '../lib/hubs';
import type { Organization } from '../types';

export const prerender = true;

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site ?? new URL('https://gsocorganizations.xyz');
  const organizations = organizationsData as Organization[];
  const yearHubs = buildYearHubs(organizations);
  const technologyHubs = buildTaxonomyHubs(organizations, 'technology');
  const topicHubs = buildTaxonomyHubs(organizations, 'topic');
  const categoryHubs = buildTaxonomyHubs(organizations, 'category');
  const firstTimeHub = buildFirstTimeHub(organizations);
  const paths = [
    '/',
    '/about/',
    '/years/',
    '/technologies/',
    '/topics/',
    '/categories/',
    `/new-in-${firstTimeHub.year}/`,
    ...yearHubs.map((hub) => `/year/${hub.year}/`),
    ...technologyHubs.map((hub) => `/technology/${hub.slug}/`),
    ...topicHubs.map((hub) => `/topic/${hub.slug}/`),
    ...categoryHubs.map((hub) => `/category/${hub.slug}/`),
    ...organizations.map((organization) => `/org/${organization.slug}/`),
  ];
  const urls = paths
    .map(
      (path) =>
        `  <url><loc>${escapeXml(new URL(path, baseUrl).href)}</loc></url>`,
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
};
