// SECURITY (typical): renders user-supplied HTML via dangerouslySetInnerHTML WITHOUT sanitization.
// This is the primary Stored XSS sink (T1, T2). Developer "forgot" to sanitize — typical bug.
// baseline diff: identical (also vulnerable).
// hardened diff: replaced with isomorphic-dompurify sanitization with strict allowlist.
export function RichTextDisplay({ content }: { content: string }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
}
