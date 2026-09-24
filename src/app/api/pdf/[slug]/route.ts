import { NextRequest, NextResponse } from "next/server";
import { gql } from "@apollo/client";

import { cfClient } from "@aces/contentful";

const PdfDocumentQuery = gql`
  query ($slug: String!) {
    pdfDocumentCollection(where: { slug: $slug }) {
      items {
        pdf {
          url
        }
      }
    }
  }
`;

const fetchPdfDocumentData = async (slug: string) => {
  try {
    const pageResponse = await cfClient.query({
      query: PdfDocumentQuery,
      variables: { slug },
    });

    return pageResponse.data.pdfDocumentCollection.items;
  } catch (error) {
    console.error("Error fetching PDF document:", error);
    return [];
  }
};

export async function GET(request: NextRequest) {
  const urlParts = request.nextUrl.pathname.split("/");
  const slug = urlParts[urlParts.length - 1];

  if (!slug) {
    return new NextResponse("Missing slug parameter", { status: 400 });
  }

  const pageData = await fetchPdfDocumentData(slug);

  if (!pageData.length || !pageData[0].pdf?.url) {
    return new NextResponse("Invalid PDF Document", { status: 404 });
  }

  try {
    const pdfUrl = pageData[0].pdf.url;
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      return new NextResponse("Failed to fetch PDF", { status: 500 });
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${slug}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error fetching the PDF:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
