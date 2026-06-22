const { badRequest } = require("./httpError");

function parsePageSelection(selection, totalPages) {
  if (!selection || !String(selection).trim()) return [0];

  const pages = new Set();
  const parts = String(selection).split(",").map(part => part.trim()).filter(Boolean);

  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      pages.add(Number(part) - 1);
      continue;
    }

    const range = part.match(/^(\d+)-(\d+)$/);
    if (!range) {
      throw badRequest("Use page numbers like 1,3-5.", "INVALID_PAGE_RANGE");
    }

    const start = Number(range[1]);
    const end = Number(range[2]);
    if (start > end) {
      throw badRequest("Page range start must be before the end.", "INVALID_PAGE_RANGE");
    }

    for (let page = start; page <= end; page += 1) {
      pages.add(page - 1);
    }
  }

  const selected = [...pages].sort((a, b) => a - b);
  if (!selected.length || selected.some(page => page < 0 || page >= totalPages)) {
    throw badRequest(`Page selection must be between 1 and ${totalPages}.`, "PAGE_OUT_OF_RANGE");
  }

  return selected;
}

module.exports = {
  parsePageSelection
};
