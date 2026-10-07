import sanitizeHtml from "sanitize-html";

// Admin-ийн Tiptap editor-ын үүсгэдэг HTML-ийг л зөвшөөрнө.
// <script>, onclick=, javascript: холбоос зэрэг XSS-ийг бүгдийг нь хасна.
const OPTIONS = {
  allowedTags: [
    "p", "br", "h1", "h2", "h3",
    "strong", "b", "em", "i", "u", "s", "mark", "code", "pre",
    "blockquote", "ul", "ol", "li", "hr",
    "a", "img",
    "div", "iframe", // YouTube embed
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    div: ["data-youtube-video"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    "*": ["style"],
  },
  // Зөвхөн текст зэрэгцүүлэлт (TextAlign extension)
  allowedStyles: {
    "*": { "text-align": [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  // Зөвхөн YouTube iframe
  allowedIframeHostnames: [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
  ],
  // Гадагш холбоос шинэ tab-д, аюулгүй нээгдэнэ
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
    }),
  },
};

/** Tiptap HTML → аюулгүй HTML. null/undefined бол тэр чигээр нь буцаана. */
export function cleanHtml(html) {
  if (html === undefined || html === null) return html;
  return sanitizeHtml(String(html), OPTIONS);
}