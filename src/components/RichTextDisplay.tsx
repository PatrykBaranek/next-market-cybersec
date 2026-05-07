import { sanitizeHtml } from '@/lib/utils/sanitize';

// SECURITY (hardened): all user HTML passes through DOMPurify before rendering.
// Mitigates T1 (Stored XSS) and T2 (Reflected XSS) on description renders.
export function RichTextDisplay({ content }: { content: string }) {
  const clean = sanitizeHtml(content);
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: clean }} />;
}
