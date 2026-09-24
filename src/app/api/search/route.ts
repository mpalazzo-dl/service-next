import { NextRequest, NextResponse } from "next/server";

import {
  isSearchConfigured,
  searchIndexName,
  searchKnowledgeIndex,
  type SearchHit,
} from "@aces/salesforce";

/**
 * Thin HTTP wrapper over the Data 360 search so client components can query it.
 * Server components call `searchKnowledgeIndex` directly instead.
 */
export interface SearchResponse {
  hits: SearchHit[];
  index: string;
  /** False when Salesforce credentials are absent, so the UI can say so. */
  configured: boolean;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("k") ?? 10) || 10,
    50,
  );
  const minScore =
    Number(request.nextUrl.searchParams.get("minScore") ?? 0) || 0;

  if (!isSearchConfigured()) {
    // A missing org should not look like an empty result set.
    return NextResponse.json<SearchResponse>({
      hits: [],
      index: searchIndexName(),
      configured: false,
    });
  }

  try {
    const hits = await searchKnowledgeIndex(query, { limit, minScore });

    return NextResponse.json<SearchResponse>({
      hits,
      index: searchIndexName(),
      configured: true,
    });
  } catch (error) {
    console.error("Knowledge search failed:", error);
    return NextResponse.json(
      { error: "Search is temporarily unavailable." },
      { status: 502 },
    );
  }
}
