// The assistant's replies: paragraphs, "1." / "-" lists, and **bold**. Built as React elements (never raw HTML),
// so nothing in a reply can inject markup. Anything else shows as plain text.
const LIST = /^\s*(?:[-*•]|\d+[.)])\s+/;

function inline(text, key) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4
      ? <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
      : part.replace(/\*\*/g, ""));
}

export default function RichText({ text }) {
  const blocks = [];
  let list = null;
  String(text || "").split(/\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) { list = null; return; }
    if (LIST.test(line)) {
      const ordered = /^\s*\d/.test(line);
      if (!list || list.ordered !== ordered) {
        list = { ordered, items: [] };
        blocks.push(list);
      }
      list.items.push(line.replace(LIST, ""));
      return;
    }
    list = null;
    blocks.push(line.replace(/^#+\s*/, ""));
  });
  return (
    <div className="rich">
      {blocks.map((b, i) => {
        if (typeof b === "string") return <p key={i}>{inline(b, i)}</p>;
        const Tag = b.ordered ? "ol" : "ul";
        return <Tag key={i}>{b.items.map((item, j) => <li key={j}>{inline(item, `${i}-${j}`)}</li>)}</Tag>;
      })}
    </div>
  );
}

// The same reply for reading aloud, without the marks.
export const plain = (text) => String(text || "").replace(/\*\*/g, "").replace(/^\s*(?:[-*•]|#+)\s+/gm, "");
