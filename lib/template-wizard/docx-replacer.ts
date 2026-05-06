import PizZip from 'pizzip';

export type Mapping = { original: string; tag: string };

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Merge adjacent w:r runs within each paragraph so that text split
// across runs (common in Word) can be found by simple string search.
function mergeAdjacentRuns(xml: string): string {
  // Pattern: </w:t></w:r><w:r [optional attrs]><optional rPr><w:t [optional attrs]>
  // Replace the closing/opening pair with nothing so the text content merges
  return xml.replace(/<\/w:t><\/w:r><w:r(?:\s[^>]*)?>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t(?:\s[^>]*)?>/g, '');
}

export function applyMappings(docxBuffer: ArrayBuffer, mappings: Mapping[]): Uint8Array {
  const zip = new PizZip(docxBuffer);

  const targets = ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/footer1.xml', 'word/footer2.xml'];

  for (const target of targets) {
    const file = zip.file(target);
    if (!file) continue;

    let xml = file.asText();
    xml = mergeAdjacentRuns(xml);

    for (const { original, tag } of mappings) {
      if (!original.trim()) continue;
      // Try XML-escaped version first, then raw
      const xmlEscaped = escapeXml(original);
      xml = xml.replace(new RegExp(escapeRegex(xmlEscaped), 'g'), tag);
      if (xmlEscaped !== original) {
        xml = xml.replace(new RegExp(escapeRegex(original), 'g'), tag);
      }
    }

    zip.file(target, xml);
  }

  return zip.generate({ type: 'uint8array' });
}
