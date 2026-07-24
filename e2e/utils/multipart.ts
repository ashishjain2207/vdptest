import { expect, Request } from '@playwright/test';

export type ParsedMultipart = {
  fields: Record<string, string[]>;
  fileParts: Array<{ name: string; filename: string }>;
  raw: string;
};

function parseContentDisposition(dispositionLine: string): { name?: string; filename?: string } {
  const nameMatch = /name="([^"]+)"/i.exec(dispositionLine);
  const fileMatch = /filename="([^"]*)"/i.exec(dispositionLine);
  return {
    name: nameMatch?.[1],
    filename: fileMatch?.[1],
  };
}

export function parseMultipartRequest(request: Request): ParsedMultipart {
  const buffer = request.postDataBuffer();
  expect(buffer).toBeTruthy();

  const headers = request.headers();
  const contentTypeHeader = headers['content-type'] ?? headers['Content-Type'] ?? '';
  const boundaryMatch = /boundary=([^;]+)/i.exec(contentTypeHeader);
  expect(boundaryMatch, `Expected multipart boundary in ${contentTypeHeader}`).not.toBeNull();
  const boundary = boundaryMatch?.[1] ?? '';

  const raw = buffer ? buffer.toString('utf8') : '';
  const sections = raw.split(`--${boundary}`);
  const fields: Record<string, string[]> = {};
  const fileParts: Array<{ name: string; filename: string }> = [];

  for (const section of sections) {
    if (!section || section === '--\r\n' || section === '--') {
      continue;
    }

    const normalized = section.startsWith('\r\n') ? section.slice(2) : section;
    const headerEnd = normalized.indexOf('\r\n\r\n');
    if (headerEnd < 0) {
      continue;
    }

    const headerBlock = normalized.slice(0, headerEnd);
    const bodyBlock = normalized
      .slice(headerEnd + 4)
      .replace(/\r\n$/, '')
      .replace(/\r\n--$/, '');

    const contentDispositionLine = headerBlock
      .split('\r\n')
      .find((line) => line.toLowerCase().startsWith('content-disposition:'));

    if (!contentDispositionLine) {
      continue;
    }

    const parsed = parseContentDisposition(contentDispositionLine);
    if (!parsed.name) {
      continue;
    }

    if (parsed.filename !== undefined) {
      fileParts.push({ name: parsed.name, filename: parsed.filename });
      continue;
    }

    fields[parsed.name] ??= [];
    fields[parsed.name].push(bodyBlock);
  }

  return { fields, fileParts, raw };
}
