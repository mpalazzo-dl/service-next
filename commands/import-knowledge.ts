#!/usr/bin/env tsx
/**
 * Imports published Salesforce Knowledge articles into Contentful.
 *
 * This is what makes browse-by-topic and search-by-topic real: the Data 360
 * index is built from these same Knowledge records, so importing them gives
 * every search hit a Contentful article to resolve to, and every taxonomy
 * concept some articles to filter.
 *
 * The join key is `UrlName` — Salesforce's slug — which becomes `article.slug`.
 * Entry ids are derived from `KnowledgeArticleId`, so re-running updates in
 * place rather than duplicating.
 *
 *   npm run import-knowledge -- --dry     preview without writing
 *   npm run import-knowledge              import and publish
 *   npm run import-knowledge -- --limit 5 import the first 5 only
 */
import * as dotenv from "dotenv";
import TurndownService from "turndown";
// CommonJS packages under this ESM project: take the default export and pull
// the named function off it, which works for both interop shapes.
import richTextFromMarkdownPkg from "@contentful/rich-text-from-markdown";

const { richTextFromMarkdown } = richTextFromMarkdownPkg as unknown as {
  richTextFromMarkdown: (
    markdown: string,
    createNode?: (node: unknown) => Promise<unknown>,
  ) => Promise<any>;
};

dotenv.config();

const SF = process.env.SF_DOMAIN!.replace(/\/$/, "");
const SPACE = process.env.NEXT_PUBLIC_CF_SPACE!;
const ENVIRONMENT = process.env.NEXT_PUBLIC_CF_ENVIRONMENT!;
const CMA_TOKEN = process.env.NEXT_CF_MANAGEMENT_TOKEN!;
const CMA = `https://api.contentful.com/spaces/${SPACE}/environments/${ENVIRONMENT}`;

const LOCALE = "en-US";
const DRY = process.argv.includes("--dry");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Salesforce record types -> the `recordType` enum on the Contentful article.
 * `News` was added to the enum rather than folded into another value, because
 * 31 of the 100 articles are News and calling them anything else would be a
 * lie about the source.
 */
const RECORD_TYPE: Record<string, string> = {
  FAQ: "FAQ",
  Procedure: "How To",
  News: "News",
};

/** `Partner_API` -> `sfkb-partner-api`, matching the concepts already in the space. */
const conceptId = (dataCategoryName: string) =>
  `sfkb-${dataCategoryName.toLowerCase().replace(/_/g, "-")}`;

// --- Salesforce -------------------------------------------------------------

const sfToken = async (): Promise<string> => {
  const response = await fetch(`${SF}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SF_CLIENT_ID!,
      client_secret: process.env.SF_CLIENT_SECRET!,
    }),
  });
  const body = await response.json();
  if (!body.access_token) throw new Error(`SF token: ${JSON.stringify(body)}`);
  return body.access_token;
};

const soql = async (token: string, query: string): Promise<any[]> => {
  let url: string | null =
    `${SF}/services/data/v62.0/query?q=${encodeURIComponent(query)}`;
  const out: any[] = [];

  while (url) {
    const body: any = await (
      await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    ).json();
    if (body[0]?.errorCode) throw new Error(JSON.stringify(body));
    out.push(...body.records);
    url = body.nextRecordsUrl ? `${SF}${body.nextRecordsUrl}` : null;
  }

  return out;
};

// --- HTML -> Contentful rich text -------------------------------------------

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndown.remove(["style", "script"]);

/**
 * Knowledge bodies are HTML; Contentful wants a rich-text document. Markdown is
 * the intermediate step. Nodes the converter cannot represent (images, tables)
 * resolve to null and are dropped rather than failing the whole article.
 */
const htmlToRichText = async (...parts: (string | null | undefined)[]) => {
  const markdown = parts
    .filter(Boolean)
    .map((html) => turndown.turndown(String(html)))
    .join("\n\n")
    .trim();

  if (!markdown) return null;
  return richTextFromMarkdown(markdown, async () => null);
};

// --- Contentful -------------------------------------------------------------

const cma = (path: string, init: RequestInit = {}) =>
  fetch(`${CMA}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CMA_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      ...(init.headers ?? {}),
    },
  });

const localized = (fields: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(fields)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, { [LOCALE]: v }]),
  );

const upsert = async (
  id: string,
  contentType: string,
  fields: Record<string, unknown>,
  concepts: string[] = [],
) => {
  const current = await cma(`/entries/${id}`);
  const version =
    current.status === 200 ? (await current.json()).sys.version : undefined;

  const body: Record<string, unknown> = { fields: localized(fields) };
  if (concepts.length) {
    body.metadata = {
      tags: [],
      concepts: concepts.map((c) => ({
        sys: { type: "Link", linkType: "TaxonomyConcept", id: c },
      })),
    };
  }

  const saved = await cma(`/entries/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "X-Contentful-Content-Type": contentType,
      ...(version ? { "X-Contentful-Version": String(version) } : {}),
    },
  });

  const savedBody = await saved.json();
  if (!savedBody.sys?.version) {
    throw new Error(`${id}: ${JSON.stringify(savedBody).slice(0, 400)}`);
  }

  const published = await cma(`/entries/${id}/published`, {
    method: "PUT",
    headers: { "X-Contentful-Version": String(savedBody.sys.version) },
  });

  if (published.status !== 200) {
    throw new Error(`${id} publish: ${(await published.text()).slice(0, 300)}`);
  }

  return version ? "updated" : "created";
};

// --- main -------------------------------------------------------------------

const main = async () => {
  for (const [name, value] of Object.entries({
    SF_DOMAIN: process.env.SF_DOMAIN,
    SF_CLIENT_ID: process.env.SF_CLIENT_ID,
    SF_CLIENT_SECRET: process.env.SF_CLIENT_SECRET,
    NEXT_PUBLIC_CF_SPACE: SPACE,
    NEXT_CF_MANAGEMENT_TOKEN: CMA_TOKEN,
  })) {
    if (!value) throw new Error(`Missing ${name}`);
  }

  const token = await sfToken();

  const articles = await soql(
    token,
    `SELECT Id, KnowledgeArticleId, Title, UrlName, Summary, ArticleNumber,
            VersionNumber, LastPublishedDate, RecordType.DeveloperName,
            Question__c, Answer__c, Body__c, Abstract__c,
            Procedure_Body__c, Procedure_Audience__c
     FROM Knowledge__kav
     WHERE PublishStatus='Online' AND Language='en_US'`,
  );

  const selections = await soql(
    token,
    "SELECT ParentId, DataCategoryName FROM Knowledge__DataCategorySelection",
  );

  const conceptsByArticle = new Map<string, string[]>();
  for (const selection of selections) {
    const list = conceptsByArticle.get(selection.ParentId) ?? [];
    list.push(conceptId(selection.DataCategoryName));
    conceptsByArticle.set(selection.ParentId, list);
  }

  // `slug` is unique. Any slug already held by a different entry belongs to
  // hand-authored content (the demo article), which should win over the
  // Salesforce copy — search still resolves to it, since both share the slug.
  const existing = await cma(
    "/entries?content_type=article&limit=1000&select=sys.id,fields.slug",
  );
  const slugOwner = new Map<string, string>();
  if (existing.status === 200) {
    const body = await existing.json();
    for (const item of body.items ?? []) {
      const slug = item.fields?.slug?.[LOCALE];
      if (slug) slugOwner.set(slug, item.sys.id);
    }
  }

  const targets = articles.slice(0, LIMIT);
  console.log(
    `${articles.length} online articles, ${selections.length} category selections` +
      (DRY ? " — dry run" : "") +
      (targets.length < articles.length ? ` — importing ${targets.length}` : ""),
  );

  const tally = { created: 0, updated: 0, failed: 0, skipped: 0 };

  for (const article of targets) {
    const type = article.RecordType?.DeveloperName;
    const recordType = RECORD_TYPE[type];

    if (!recordType) {
      console.warn(`\n  skip ${article.UrlName}: unmapped record type "${type}"`);
      tally.skipped++;
      continue;
    }

    const entryId = `sf-${article.KnowledgeArticleId}`;
    const seoId = `${entryId}-seo`;

    const owner = slugOwner.get(article.UrlName);
    if (owner && owner !== entryId) {
      console.warn(
        `\n  skip ${article.UrlName}: slug already held by ${owner}`,
      );
      tally.skipped++;
      continue;
    }
    const concepts = conceptsByArticle.get(article.Id) ?? [];

    // FAQ bodies read as question-then-answer; the others have a single body.
    const bodyCopy = await htmlToRichText(
      article.Question__c,
      article.Answer__c ?? article.Body__c ?? article.Procedure_Body__c,
      article.Abstract__c && !article.Summary ? article.Abstract__c : null,
    );

    const summary: string =
      article.Summary ??
      article.Abstract__c?.replace(/<[^>]+>/g, "").slice(0, 300) ??
      article.Title;

    if (!bodyCopy) {
      console.warn(`\n  skip ${article.UrlName}: no body content`);
      tally.skipped++;
      continue;
    }

    if (DRY) {
      console.log(
        `  ${entryId} ${recordType.padEnd(11)} ${String(article.UrlName).padEnd(48)} concepts=${concepts.join(",") || "-"}`,
      );
      continue;
    }

    try {
      // `article.seo` is required, so each article needs its own metadata entry.
      await upsert(seoId, "metadata", {
        internalTitle: `SEO: ${article.Title}`.slice(0, 255),
        title: article.Title,
        description: summary.slice(0, 300),
        searchEngineVisibility: "follow",
        searchIndex: "index",
      });
      await sleep(120);

      const result = await upsert(
        entryId,
        "article",
        {
          title: article.Title,
          slug: article.UrlName,
          summary,
          bodyCopy,
          recordType,
          channelVisibility: "Public",
          publishDate:
            article.LastPublishedDate ?? new Date().toISOString(),
          articleFeedback: { up: 0, down: 0 },
          seo: { sys: { type: "Link", linkType: "Entry", id: seoId } },
        },
        concepts,
      );

      tally[result as "created" | "updated"]++;
      process.stdout.write(result === "created" ? "+" : ".");
      await sleep(120);
    } catch (error) {
      tally.failed++;
      console.error(`\n  FAIL ${article.UrlName}: ${(error as Error).message}`);
    }
  }

  console.log("\n", tally);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
