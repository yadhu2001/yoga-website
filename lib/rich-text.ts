const TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'span', 'h2', 'h3']);

export const fontFamilies = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: "'Times New Roman', Times, serif" },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
  { label: 'Palatino', value: "'Palatino Linotype', Palatino, serif" },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Segoe UI', value: "'Segoe UI', sans-serif" },
  { label: 'Calibri', value: 'Calibri, Candara, sans-serif' },
  { label: 'Cambria', value: 'Cambria, serif' },
] as const;

function fontKey(value: string) {
  return value
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const allowedFonts = new Map(fontFamilies.map((font) => [fontKey(font.value), font.value]));

export function matchFont(value?: string) {
  const key = fontKey(String(value || ''));
  if (!key) return '';
  const exact = allowedFonts.get(key);
  if (exact) return exact;
  const first = key.split(',')[0].trim();
  for (const [stackKey, stack] of allowedFonts) {
    if (stackKey.split(',')[0].trim() === first) return stack;
  }
  return '';
}

export function isRichHtml(value?: string) {
  return /<\/?[a-z][\s\S]*?>/i.test(String(value || ''));
}

export function plainText(value?: string) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeStyle(style: string) {
  const parts: string[] = [];
  const decoded = style.replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&amp;/gi, '&');
  for (const decl of decoded.split(';')) {
    const [rawProp, ...rest] = decl.split(':');
    if (!rawProp || !rest.length) continue;
    const prop = rawProp.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (prop === 'color' && /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\))$/i.test(value)) parts.push(`color: ${value}`);
    if (prop === 'font-size' && /^\d{1,2}(?:\.\d+)?(?:px|rem|em|%)$/.test(value)) {
      const size = parseFloat(value);
      if (size > 0 && size <= 72) parts.push(`font-size: ${value}`);
    }
    if (prop === 'font-family') {
      const font = matchFont(value);
      if (font) parts.push(`font-family: ${font}`);
    }
  }
  return parts.join('; ');
}

export function sanitizeRich(value?: string) {
  const input = String(value ?? '');
  if (!input.trim() || !isRichHtml(input)) return input;
  return input.replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?\s*([a-z0-9]+)([^>]*)>/gi, (match, tag: string, attrs: string) => {
    const name = tag.toLowerCase();
    if (!TAGS.has(name)) return '';
    if (match.trim().startsWith('</')) return `</${name}>`;
    if (name === 'br') return '<br>';
    if (name === 'span') {
      const style = attrs.match(/style\s*=\s*(['"])([\s\S]*?)\1/i);
      const safe = style ? safeStyle(style[2]) : '';
      return safe ? `<span style="${safe}">` : '<span>';
    }
    return `<${name}>`;
  });
}

export const richFields = ['description', 'heading', 'aboutHeading', 'heroTitle', 'heroSubtitle', 'heroNoteTitle', 'heroNoteText', 'heroPointOne', 'heroPointTwo', 'coursesHeading', 'coursesText', 'acharyaHeading', 'about', 'vision', 'mission', 'tagline', 'body', 'overview', 'curriculum', 'eligibility', 'certification', 'careers', 'closing', 'achievements', 'certifications', 'acharyaMessage', 'whyHeading', 'programsHeading', 'videoHeading', 'footerText', 'storeHeading', 'storeText', 'eventsDescription', 'instructorsDescription', 'qualification'] as const;
