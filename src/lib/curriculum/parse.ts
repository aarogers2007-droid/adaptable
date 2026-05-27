import "server-only";

/**
 * CURRICULUM DOCUMENT PARSER
 *
 * Parses uploaded curriculum files (PDF, DOCX, PPTX, TXT) into
 * structured text organized by page/slide. Used as the first stage
 * of the curriculum ingestion pipeline.
 *
 * Dependencies: pdf-parse, mammoth, jszip
 */

// ── Types ──

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  pages: ParsedPage[];
}

// ── Scanned PDF detection ──

/** If extracted text is less than 50 chars per page on average, it's likely scanned */
const MIN_CHARS_PER_PAGE = 50;

class ScannedPDFError extends Error {
  constructor(pageCount: number, totalChars: number) {
    super(
      `This PDF appears to be scanned/image-based (${totalChars} characters extracted from ${pageCount} pages). ` +
      `OCR is not yet supported. Please upload a text-based PDF or a DOCX version of this document.`
    );
    this.name = "ScannedPDFError";
  }
}

// ── Parsers ──

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  const { PDFParse } = await import("pdf-parse");

  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();

    const pageCount = result.total || 1;
    const totalChars = result.text?.length ?? 0;

    // Detect scanned PDFs
    if (pageCount > 0 && totalChars / pageCount < MIN_CHARS_PER_PAGE) {
      throw new ScannedPDFError(pageCount, totalChars);
    }

    // Use per-page text from the result
    const pages: ParsedPage[] = result.pages
      .map((p) => ({
        pageNumber: p.num,
        text: p.text.trim(),
      }))
      .filter((p) => p.text.length > 0);

    return { pages };
  } finally {
    await parser.destroy();
  }
}

export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  const mammoth = await import("mammoth");

  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  if (!text.trim()) {
    return { pages: [] };
  }

  // DOCX has no real page concept — split into logical sections by double newlines
  // or treat as a single page
  const sections = text.split(/\n{3,}/);
  const pages: ParsedPage[] = sections
    .map((section: string, i: number) => ({
      pageNumber: i + 1,
      text: section.trim(),
    }))
    .filter((p: ParsedPage) => p.text.length > 0);

  return { pages };
}

export async function parsePPTX(buffer: Buffer): Promise<ParsedDocument> {
  const JSZip = (await import("jszip")).default;

  const zip = await JSZip.loadAsync(buffer);
  const pages: ParsedPage[] = [];

  // PPTX slides are stored as ppt/slides/slide{N}.xml
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0", 10);
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0", 10);
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async("text");
    const slideNum = parseInt(slidePath.match(/slide(\d+)/)?.[1] ?? "0", 10);

    // Extract text from <a:t> tags (PowerPoint text runs)
    const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      const slideText = textMatches
        .map((match: string) => {
          const content = match.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, "");
          return content.trim();
        })
        .filter((t: string) => t.length > 0)
        .join(" ");

      if (slideText.trim()) {
        pages.push({ pageNumber: slideNum, text: slideText.trim() });
      }
    }
  }

  return { pages };
}

export async function parseTXT(buffer: Buffer): Promise<ParsedDocument> {
  const text = buffer.toString("utf-8");

  if (!text.trim()) {
    return { pages: [] };
  }

  // Treat entire file as one page
  return {
    pages: [{ pageNumber: 1, text: text.trim() }],
  };
}

// ── Router ──

const PARSERS: Record<string, (buffer: Buffer) => Promise<ParsedDocument>> = {
  "application/pdf": parsePDF,
  "pdf": parsePDF,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parseDOCX,
  "docx": parseDOCX,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": parsePPTX,
  "pptx": parsePPTX,
  "text/plain": parseTXT,
  "txt": parseTXT,
};

/**
 * Parse a file buffer into structured text based on its MIME type or extension.
 * Throws if the file type is unsupported or the file appears to be scanned.
 */
export async function parseFile(buffer: Buffer, fileType: string): Promise<ParsedDocument> {
  const normalizedType = fileType.toLowerCase().replace(/^\./, "");
  const parser = PARSERS[normalizedType];

  if (!parser) {
    throw new Error(
      `Unsupported file type: "${fileType}". Supported types: PDF, DOCX, PPTX, TXT.`
    );
  }

  return parser(buffer);
}
