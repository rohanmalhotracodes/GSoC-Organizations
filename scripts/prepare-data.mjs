import fs from 'node:fs';
import path from 'node:path';
import {
  normalizeTechnologies,
  normalizeTopics,
} from './tag-normalization.mjs';

const root = process.cwd();
const rawDirectory = path.join(root, 'data', 'raw');
const outputFile = path.join(root, 'src', 'data', 'organizations.json');
const repositoryFile = path.join(root, 'api', 'repository-links.json');
const logoAssetsFile = path.join(root, 'data', 'logo-assets.json');
const logoAssets = fs.existsSync(logoAssetsFile)
  ? JSON.parse(fs.readFileSync(logoAssetsFile, 'utf8'))
  : {};

const files = fs
  .readdirSync(rawDirectory)
  .filter((file) => /^\d{4}\.json$/.test(file))
  .sort();

// The reference project keeps a small, reviewable alias table instead of
// guessing organization identity from fuzzy text similarity. These aliases
// cover known public-archive renames; the website URL check below handles the
// remaining unchanged organizations across years.
const organizationNameAliases = new Map([
  ['The Apertium Project', 'Apertium'],
  [
    'AOSSIE - Australian Open Source Software Innovation and Education',
    'AOSSIE',
  ],
  [
    'Berkman Center for Internet and Society',
    'Berkman Klein Center for Internet and Society',
  ],
  [
    'Berkman Klein Center for Internet & Society at Harvard University',
    'Berkman Klein Center for Internet and Society',
  ],
  [
    'Berkman Klein Center for Internet and Society at Harvard University',
    'Berkman Klein Center for Internet and Society',
  ],
  ['CiviCRM LLC', 'CiviCRM'],
  ['Ceph', 'Ceph Foundation'],
  ['Debian Project', 'Debian'],
  [
    'Digital Impact Alliance',
    'Digital Impact Alliance (DIAL) at UN Foundation',
  ],
  ['FOSSology Project', 'FOSSology'],
  ['GENIVI Development Platform', 'GENIVI Alliance'],
  ['KDE', 'KDE Community'],
  ['Liquid Galaxy Project', 'Liquid Galaxy project'],
  ['OSGeo - The Open Source Geospatial Foundation', 'OSGeo'],
  ['GFOSS - Open Technologies Alliance', 'Open Technologies Alliance - GFOSS'],
  ['Open Technologies Aliance - GFOSS', 'Open Technologies Alliance - GFOSS'],
  ['Open Roberta Lab', 'Open Roberta'],
  ['Zulip Open Source Project', 'Zulip'],
  ['Xi Editor Project', 'Xi Editor'],
  ['VideoLAN / VLMC Project', 'VideoLAN'],
  ['The syslog-ng project.', 'syslog-ng'],
  ['The syslog-ng project', 'syslog-ng'],
  ['The Eclipse Foundation', 'Eclipse Foundation'],
  ['shogun.ml', 'Shogun'],
  ['Shogun Machine Learning Toolbox', 'Shogun'],
  ['Robocomp', 'RoboComp'],
  ['Apache Software Foundation', 'The Apache Software Foundation'],
  ['Cloud Native Computing Foundation (CNCF)', 'CNCF'],
  ['GNOME', 'GNOME Foundation'],
  ['GNU Mailman', 'GNU Mailman Project'],
  ['Kodi Foundation', 'Kodi'],
]);

function clean(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function plainText(value = '') {
  return clean(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return clean(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function canonicalOrganizationName(value) {
  let name = clean(value);
  const visited = new Set();
  while (organizationNameAliases.has(name) && !visited.has(name)) {
    visited.add(name);
    name = organizationNameAliases.get(name);
  }
  return name;
}

function organizationUrlIdentity(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    const host = url.hostname.replace(/^www\./, '').toLocaleLowerCase();
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    return `${host}${pathname}`;
  } catch {
    return '';
  }
}

function safeUrl(value = '') {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value : '';
  } catch {
    return '';
  }
}

function sourceHost(hostname) {
  const host = hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'github.com') return 'GitHub';
  if (host === 'gitlab.com') return 'GitLab';
  if (host === 'codeberg.org') return 'Codeberg';
  if (host === 'sr.ht' || host.endsWith('.sr.ht')) return 'SourceHut';
  return 'Self-hosted Git';
}

function repositoryFromUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = sourceHost(url.hostname);
    const knownHost = ['GitHub', 'GitLab', 'Codeberg', 'SourceHut'].includes(
      host,
    );
    const looksLikeGit =
      knownHost || /git|code|source|forge|invent|projects/i.test(url.hostname);
    if (!looksLikeGit) return null;

    const segments = url.pathname.split('/').filter(Boolean);
    if (!segments.length) return null;
    let repositoryUrl = `${url.protocol}//${url.host}/${segments.slice(0, 2).join('/')}`;
    if (host === 'SourceHut')
      repositoryUrl = `${url.protocol}//${url.host}/${segments.slice(0, 2).join('/')}`;
    if (segments.length === 1)
      repositoryUrl = `${url.protocol}//${url.host}/${segments[0]}`;

    return {
      label: segments.length > 1 ? 'Source repository' : 'Organization profile',
      url: repositoryUrl.replace(/\.git$/, ''),
      host,
      verified: false,
    };
  } catch {
    return null;
  }
}

const manualRepositories = {
  FOSDEM: {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://git.fosdem.org/FOSDEM',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-13',
      },
      {
        label: 'GitHub organization',
        url: 'https://github.com/FOSDEM',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-13',
      },
    ],
    organizationProfile: 'https://git.fosdem.org/FOSDEM',
    source: 'manual',
  },
  freifunk: {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://github.com/freifunk',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-11',
      },
    ],
    organizationProfile: 'https://github.com/freifunk',
    source: 'manual',
  },
  'The FreeBSD Project': {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://github.com/freebsd',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-12',
      },
    ],
    organizationProfile: 'https://github.com/freebsd',
    source: 'manual',
  },
  Debian: {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://salsa.debian.org/debian',
        host: 'GitLab',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://salsa.debian.org/debian',
    source: 'manual',
  },
  'Gambit: The package for computation in game theory': {
    repositories: [
      {
        label: 'Gambit source repository',
        url: 'https://github.com/gambitproject/gambit',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://github.com/gambitproject',
    source: 'manual',
  },
  Ganeti: {
    repositories: [
      {
        label: 'Ganeti source repository',
        url: 'https://github.com/ganeti/ganeti',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://github.com/ganeti',
    source: 'manual',
  },
  'Global Alliance for Genomics and Health': {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://github.com/ga4gh',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-11',
      },
    ],
    organizationProfile: 'https://github.com/ga4gh',
    source: 'manual',
  },
  'GNSS-SDR': {
    repositories: [
      {
        label: 'GNSS-SDR source repository',
        url: 'https://github.com/gnss-sdr/gnss-sdr',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://github.com/gnss-sdr',
    source: 'manual',
  },
  'Genes, Genomes and Variation': {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://github.com/Ensembl',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-11',
      },
    ],
    organizationProfile: 'https://github.com/Ensembl',
    source: 'manual',
  },
  'Gentoo Foundation': {
    repositories: [
      {
        label: 'Official GitHub organization',
        url: 'https://github.com/gentoo',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-11',
      },
      {
        label: 'Official Codeberg organization',
        url: 'https://codeberg.org/gentoo',
        host: 'Codeberg',
        verified: true,
        lastChecked: '2026-11-11',
      },
    ],
    organizationProfile: 'https://github.com/gentoo',
    source: 'manual',
  },
  AboutCode: {
    repositories: [
      {
        label: 'AboutCode repositories',
        url: 'https://github.com/aboutcode-org',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-10',
      },
    ],
    organizationProfile: 'https://github.com/aboutcode-org',
    source: 'manual',
  },
  'Ceph Foundation': {
    repositories: [
      {
        label: 'Ceph repositories',
        url: 'https://github.com/ceph',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-10',
      },
    ],
    organizationProfile: 'https://github.com/ceph',
    source: 'manual',
  },
  'Fedora Project': {
    repositories: [
      {
        label: 'Fedora dist-git (src.fedoraproject.org)',
        url: 'https://src.fedoraproject.org/',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-14',
      },
      {
        label: 'Fedora Infrastructure on GitHub',
        url: 'https://github.com/fedora-infra',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-14',
      },
      {
        label: 'Fedora on GitLab',
        url: 'https://gitlab.com/fedora',
        host: 'GitLab',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://src.fedoraproject.org/',
    source: 'manual',
  },
  '52°North Spatial Information Research GmbH': {
    repositories: [
      {
        label: '52°North repositories',
        url: 'https://github.com/52North',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-10',
      },
    ],
    organizationProfile: 'https://github.com/52North',
    source: 'manual',
  },
  'Academy Software Foundation': {
    repositories: [
      {
        label: 'Academy Software Foundation repositories',
        url: 'https://github.com/AcademySoftwareFoundation',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-10',
      },
    ],
    organizationProfile: 'https://github.com/AcademySoftwareFoundation',
    source: 'manual',
  },
  'Drupal Association': {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://git.drupalcode.org/project',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://git.drupalcode.org/project',
    source: 'manual',
  },
  '3DTK': {
    repositories: [
      {
        label: '3DTK source repository',
        url: 'https://github.com/JMUWRobotics/3DTK',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-10',
      },
    ],
    organizationProfile: 'https://github.com/JMUWRobotics/3DTK',
    source: 'manual',
  },
  Metasploit: {
    repositories: [
      {
        label: 'Metasploit Framework',
        url: 'https://github.com/rapid7/metasploit-framework',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://github.com/rapid7',
    source: 'manual',
  },
  Jenkins: {
    repositories: [
      {
        label: 'Jenkins core',
        url: 'https://github.com/jenkinsci/jenkins',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://github.com/jenkinsci',
    source: 'manual',
  },
  'Godot Engine': {
    repositories: [
      {
        label: 'Godot Engine',
        url: 'https://github.com/godotengine/godot',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://github.com/godotengine',
    source: 'manual',
  },
  OpenStreetMap: {
    repositories: [
      {
        label: 'OpenStreetMap repositories',
        url: 'https://github.com/openstreetmap',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://github.com/openstreetmap',
    source: 'manual',
  },
  'Blender Foundation': {
    repositories: [
      {
        label: 'Blender',
        url: 'https://projects.blender.org/blender/blender',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://projects.blender.org/blender',
    source: 'manual',
  },
  FFmpeg: {
    repositories: [
      {
        label: 'Official repositories',
        url: 'https://git.ffmpeg.org/ffmpeg.git',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-13',
      },
      {
        label: 'GitHub organization',
        url: 'https://github.com/FFmpeg',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-13',
      },
    ],
    organizationProfile: 'https://git.ffmpeg.org/',
    source: 'manual',
  },
  'KDE Community': {
    repositories: [
      {
        label: 'KDE Invent repositories',
        url: 'https://invent.kde.org/',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://invent.kde.org/',
    source: 'manual',
  },
  'Python Software Foundation': {
    repositories: [
      {
        label: 'Python repositories',
        url: 'https://github.com/python',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://github.com/python',
    source: 'manual',
  },
  'CERN-HSF': {
    repositories: [
      {
        label: 'HEP Software Foundation repositories',
        url: 'https://github.com/HSF',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://github.com/HSF',
    source: 'manual',
  },
  VideoLAN: {
    repositories: [
      {
        label: 'VideoLAN repositories',
        url: 'https://code.videolan.org/videolan',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-14',
      },
    ],
    organizationProfile: 'https://code.videolan.org/videolan',
    source: 'manual',
  },
  Git: {
    repositories: [
      {
        label: 'Git',
        url: 'https://git.kernel.org/pub/scm/git/git.git',
        host: 'Self-hosted Git',
        verified: true,
        lastChecked: '2026-11-05',
      },
    ],
    organizationProfile: 'https://git.kernel.org/pub/scm/git/',
    source: 'manual',
  },
  'OpenMS Inc': {
    repositories: [
      {
        label: 'OpenMS Inc',
        url: 'https://github.com/OpenMS/OpenMS',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-13',
      },
    ],
    organizationProfile: 'https://github.com/OpenMS',
    source: 'manual',
  },
  Discourse: {
    repositories: [
      {
        label: 'Discourse',
        url: 'https://github.com/discourse/discourse',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-13',
      },
      {
        label: 'GitHub organization',
        url: 'https://github.com/discourse',
        host: 'GitHub',
        verified: true,
        lastChecked: '2026-11-13',
      },
    ],
    organizationProfile: 'https://github.com/discourse',
    source: 'manual',
  },
};

class UnionFind {
  constructor(size) {
    this.parents = Array.from({ length: size }, (_, index) => index);
  }

  find(index) {
    if (this.parents[index] !== index) {
      this.parents[index] = this.find(this.parents[index]);
    }
    return this.parents[index];
  }

  union(first, second) {
    const firstRoot = this.find(first);
    const secondRoot = this.find(second);
    if (firstRoot !== secondRoot) this.parents[firstRoot] = secondRoot;
  }
}

const records = [];

for (const file of files) {
  const document = JSON.parse(
    fs.readFileSync(path.join(rawDirectory, file), 'utf8'),
  );
  const year = Number(document.year || path.basename(file, '.json'));
  for (const raw of document.organizations || []) {
    const name = canonicalOrganizationName(raw.name);
    if (name) records.push({ raw, year, name });
  }
}

const identities = new UnionFind(records.length);
const firstByName = new Map();
const firstByWebsite = new Map();

records.forEach((record, index) => {
  const nameKey = record.name.toLocaleLowerCase();
  const websiteKey = organizationUrlIdentity(record.raw.url);
  if (firstByName.has(nameKey))
    identities.union(index, firstByName.get(nameKey));
  else firstByName.set(nameKey, index);
  if (websiteKey) {
    if (firstByWebsite.has(websiteKey)) {
      identities.union(index, firstByWebsite.get(websiteKey));
    } else {
      firstByWebsite.set(websiteKey, index);
    }
  }
});

const groupedRecords = new Map();
records.forEach((record, index) => {
  const root = identities.find(index);
  const group = groupedRecords.get(root) || [];
  group.push(record);
  groupedRecords.set(root, group);
});

function combineOrganizationRecords(group) {
  group.sort((a, b) => a.year - b.year);
  const mostRecent = group.at(-1);
  const existing = {
    slug: slugify(mostRecent.name),
    name: mostRecent.name,
    logo: '',
    description: '',
    website: '',
    category: 'Other',
    ideasUrl: '',
    contributionGuide: '',
    communityLinks: [],
    technologies: [],
    topics: [],
    participations: [],
    repositoryCandidates: [],
  };
  const recentTagStart = Math.max(0, group.length - 3);

  group.forEach(({ raw, year, name }, groupIndex) => {
    existing.name = name;
    existing.slug = slugify(name);
    existing.logo = safeUrl(raw.image_url) || existing.logo;
    existing.description = plainText(raw.description) || existing.description;
    existing.website = safeUrl(raw.url) || existing.website;
    existing.category = clean(raw.category) || existing.category;
    existing.ideasUrl = safeUrl(raw.ideas_url) || existing.ideasUrl;
    existing.contributionGuide =
      safeUrl(raw.guide_url) || existing.contributionGuide;
    if (groupIndex >= recentTagStart) {
      existing.technologies = normalizeTechnologies([
        ...existing.technologies,
        ...(raw.technologies || []),
      ]);
      existing.topics = normalizeTopics([
        ...existing.topics,
        ...(raw.topics || []),
      ]);
    }
    existing.repositoryCandidates.unshift(
      raw.ideas_url,
      raw.guide_url,
      raw.url,
    );

    const communityLinks = [
      ['Chat / community', raw.irc_channel],
      ['Mailing list', raw.mailing_list],
      ['Contact', raw.contact_email],
      ['Blog', raw.blog_url],
    ];
    for (const [label, value] of communityLinks) {
      const url = safeUrl(value);
      if (url && !existing.communityLinks.some((link) => link.url === url)) {
        existing.communityLinks.push({ label, url });
      }
    }

    const projects = (raw.projects || []).map((project) => {
      return {
        title: clean(project.title) || 'Untitled project',
        shortDescription: plainText(project.short_description),
        description: plainText(project.description),
        contributor: clean(project.student_name),
        codeUrl: safeUrl(project.code_url) || undefined,
        projectUrl: safeUrl(project.project_url) || undefined,
        inferredTechnologies: [],
      };
    });

    const priorIndex = existing.participations.findIndex(
      (item) => item.year === year,
    );
    const participation = {
      year,
      projectCount: Number(raw.num_projects) || projects.length,
      projects,
      archiveUrl: safeUrl(raw.projects_url) || undefined,
    };
    if (priorIndex >= 0) existing.participations[priorIndex] = participation;
    else existing.participations.push(participation);
  });

  for (const participation of existing.participations) {
    for (const project of participation.projects) {
      const searchable =
        `${project.title} ${project.shortDescription} ${project.description}`.toLocaleLowerCase();
      project.inferredTechnologies = existing.technologies
        .filter((tag) => {
          const normalized = tag.toLocaleLowerCase();
          return normalized.length > 1 && searchable.includes(normalized);
        })
        .slice(0, 6);
    }
  }
  return existing;
}

const repositoryLinks = {};
const organizations = [...groupedRecords.values()]
  .map(combineOrganizationRecords)
  .map((org) => {
    org.participations.sort((a, b) => b.year - a.year);
    const manual = manualRepositories[org.name];
    const derived = org.repositoryCandidates
      .map(repositoryFromUrl)
      .find(Boolean);
    const repository =
      manual ||
      (derived
        ? {
            repositories: [derived],
            organizationProfile:
              derived.label === 'Organization profile'
                ? derived.url
                : undefined,
            source: 'derived',
          }
        : {
            repositories: [],
            organizationProfile: `https://www.google.com/search?q=${encodeURIComponent(`${org.name} source code repository`)}`,
            source: 'search',
          });
    repositoryLinks[org.name] = repository;
    const years = org.participations.map((item) => item.year);
    const localLogo = logoAssets[org.slug];
    const result = {
      slug: org.slug,
      name: org.name,
      logo:
        localLogo?.source === org.logo && localLogo?.path
          ? localLogo.path
          : org.logo,
      description: org.description,
      website: org.website,
      category: org.category,
      ideasUrl: org.ideasUrl,
      contributionGuide: org.contributionGuide,
      communityLinks: org.communityLinks,
      technologies: org.technologies,
      topics: org.topics,
      years,
      latestYear: Math.max(...years),
      totalProjects: org.participations.reduce(
        (sum, item) => sum + item.projectCount,
        0,
      ),
      participationCount: years.length,
      participations: org.participations,
      repository,
    };
    return result;
  })
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outputFile, `${JSON.stringify(organizations, null, 2)}\n`);
fs.writeFileSync(
  repositoryFile,
  `${JSON.stringify(repositoryLinks, null, 2)}\n`,
);
console.log(
  `Prepared ${organizations.length} organizations from ${files.length} annual datasets.`,
);
