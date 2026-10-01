const TAGS = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'span', 'h2', 'h3']);

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
  for (const decl of style.split(';')) {
    const [rawProp, ...rest] = decl.split(':');
    if (!rawProp || !rest.length) continue;
    const prop = rawProp.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (prop === 'color' && /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\))$/i.test(value)) parts.push(`color: ${value}`);
    if (prop === 'font-size' && /^\d{1,2}(?:\.\d+)?(?:px|rem|em|%)$/.test(value)) {
      const size = parseFloat(value);
      if (size > 0 && size <= 72) parts.push(`font-size: ${value}`);
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

export const richFields = ['description', 'heading', 'aboutHeading', 'heroTitle', 'heroSubtitle', 'about', 'vision', 'mission', 'tagline', 'body', 'overview', 'curriculum', 'eligibility', 'certification', 'careers', 'closing', 'achievements', 'certifications', 'acharyaMessage', 'footerText', 'storeText'] as const;
