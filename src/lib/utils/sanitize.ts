import DOMPurify from 'isomorphic-dompurify';

// SECURITY (hardened): strict allowlist of HTML tags/attrs for user-supplied descriptions.
// Strips <script>, on* event handlers, javascript: URIs, all unsafe constructs.
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote'];
const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}
