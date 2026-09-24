#!/usr/bin/env tsx

import dotenv from "dotenv";
import chalk from "chalk";
import fetch from "node-fetch";

dotenv.config();

const SPACE_ID = process.env.NEXT_PUBLIC_CF_SPACE;
const CMA_TOKEN = process.env.NEXT_CF_MANAGEMENT_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const PREVIEW_SECRET = process.env.NEXT_PUBLIC_CF_PREVIEW_SECRET;

if (!SPACE_ID || !CMA_TOKEN || !SITE_URL || !PREVIEW_SECRET) {
  console.error(
    chalk.red(
      "❌ Missing env. Required: NEXT_PUBLIC_CF_SPACE, NEXT_CF_MANAGEMENT_TOKEN, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_CF_PREVIEW_SECRET",
    ),
  );
  process.exit(1);
}

const ENVIRONMENT_NAME = "Live Preview";
const ENVIRONMENT_DESCRIPTION =
  "Live Preview URLs for the knowledge base";

const previewConfigs: { contentType: string; url: string }[] = [
  // Routable entries resolve to a real page by slug.
  {
    contentType: "apps",
    url: `${SITE_URL}/api/draft/app?locale={locale}&secret=${PREVIEW_SECRET}`,
  },
  {
    contentType: "page",
    url: `${SITE_URL}/api/draft/pages?slug={entry.fields.slug}&locale={locale}&secret=${PREVIEW_SECRET}`,
  },
  {
    contentType: "article",
    url: `${SITE_URL}/api/draft/articles?slug={entry.fields.slug}&locale={locale}&secret=${PREVIEW_SECRET}`,
  },
  // Everything else is a component with no page of its own, so it previews
  // standalone through /api/draft/entries. These previously pointed at
  // /api/draft/articles, which expects a slug and rejected the id outright.
  ...[
    "accordion",
    "accordions",
    "banner",
    "button",
    "card",
    "codeEmbed",
    "collection",
    "externalLink",
    "image",
    "infoPanel",
    "link",
    "linkText",
    "lockup",
    "menuItem",
    "dropdownMenu",
    "modal",
    "pdfDocument",
    "richTextSection",
    "videoEmbed",
  ].map((contentType) => ({
    contentType,
    url: `${SITE_URL}/api/draft/entries?id={entry.sys.id}&locale={locale}&secret=${PREVIEW_SECRET}`,
  })),
];

const CMA_BASE = `https://api.contentful.com/spaces/${SPACE_ID}/preview_environments`;
const HEADERS = {
  Authorization: `Bearer ${CMA_TOKEN}`,
  "Content-Type": "application/vnd.contentful.management.v1+json",
};

interface PreviewConfiguration {
  contentType: string;
  url: string;
  enabled: boolean;
  example: boolean;
}

interface PreviewEnvironment {
  sys: { id: string; version: number };
  name: string;
  description?: string;
  configurations: PreviewConfiguration[];
}

const buildConfigurations = (): PreviewConfiguration[] =>
  previewConfigs.map(({ contentType, url }) => ({
    contentType,
    url,
    enabled: true,
    example: false,
  }));

const mergeConfigurations = (
  existing: PreviewConfiguration[],
  next: PreviewConfiguration[],
): PreviewConfiguration[] => {
  const byContentType = new Map<string, PreviewConfiguration>();
  existing.forEach((c) => byContentType.set(c.contentType, c));
  next.forEach((c) => byContentType.set(c.contentType, c));
  return Array.from(byContentType.values());
};

const listPreviewEnvironments = async (): Promise<PreviewEnvironment[]> => {
  const res = await fetch(CMA_BASE, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Failed to list preview environments: ${await res.text()}`);
  }
  const json = (await res.json()) as { items: PreviewEnvironment[] };
  return json.items;
};

const createPreviewEnvironment = async (
  configurations: PreviewConfiguration[],
) => {
  const res = await fetch(CMA_BASE, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      name: ENVIRONMENT_NAME,
      description: ENVIRONMENT_DESCRIPTION,
      configurations,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to create preview environment: ${await res.text()}`,
    );
  }
  console.log(
    chalk.green(`✅ Created preview environment "${ENVIRONMENT_NAME}".`),
  );
};

const updatePreviewEnvironment = async (
  env: PreviewEnvironment,
  configurations: PreviewConfiguration[],
) => {
  const res = await fetch(`${CMA_BASE}/${env.sys.id}`, {
    method: "PUT",
    headers: {
      ...HEADERS,
      "X-Contentful-Version": env.sys.version.toString(),
    },
    body: JSON.stringify({
      name: ENVIRONMENT_NAME,
      description: ENVIRONMENT_DESCRIPTION,
      configurations,
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to update preview environment: ${await res.text()}`,
    );
  }
  console.log(
    chalk.green(`✅ Updated preview environment "${ENVIRONMENT_NAME}".`),
  );
};

(async () => {
  try {
    console.log(chalk.blueBright.bold("🚀 Configuring Live Preview URLs..."));
    previewConfigs.forEach(({ contentType, url }) => {
      console.log(`  • ${chalk.cyan(contentType)} → ${url}`);
    });

    const next = buildConfigurations();
    const existing = await listPreviewEnvironments();
    const match = existing.find((e) => e.name === ENVIRONMENT_NAME);

    if (match) {
      const merged = mergeConfigurations(match.configurations, next);
      await updatePreviewEnvironment(match, merged);
    } else {
      await createPreviewEnvironment(next);
    }

    console.log(chalk.greenBright.bold("🎉 Live Preview setup complete."));
  } catch (error) {
    console.error(chalk.red("❌ Failed to configure preview environments:"));
    console.error(error);
    process.exit(1);
  }
})();
