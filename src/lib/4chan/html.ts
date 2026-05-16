const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
};

function decodeEntity(entity: string) {
  if (entity.startsWith("#x")) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }

  if (entity.startsWith("#")) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  }

  return ENTITY_MAP[entity] ?? `&${entity};`;
}

export function cleanFourChanComment(comment?: string) {
  if (!comment) return "";

  return comment
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<wbr\s*\/?>/gi, "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&([a-zA-Z]+|#\d+|#x[\da-fA-F]+);/g, (_, entity: string) => decodeEntity(entity))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
