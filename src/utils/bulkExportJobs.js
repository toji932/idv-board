import * as XLSX from "xlsx";
import { getMapKeyFromPickM1, getMapLayoutCount, getMapLabel } from "./mapData";
import { normalizeMatchRow } from "./normalizeMatchRow";
import { buildPiecesFromMatch } from "./buildPiecesFromMatch";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateObject(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function normalizeDateValue(v) {
  if (v == null || v === "") return "";
  if (v instanceof Date) return formatDateObject(v);

  if (typeof v === "number" && Number.isFinite(v)) {
    if (v > 20000 && v < 60000) {
      try {
        return XLSX.SSF.format("yyyy-mm-dd", v);
      } catch {
        return String(v);
      }
    }
    return String(v);
  }

  const s = String(v).trim();
  if (!s) return "";

  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${pad2(ymd[2])}-${pad2(ymd[3])}`;

  const mdy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
if (mdy) {
  const month = Number(mdy[1]);
  const day = Number(mdy[2]);
  let year = Number(mdy[3]);

  if (year < 100) year += 2000;

  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }
}

  if (/^\d{5}$/.test(s)) {
    const num = Number(s);
    if (num > 20000 && num < 60000) {
      try {
        return XLSX.SSF.format("yyyy-mm-dd", num);
      } catch {
        return s;
      }
    }
  }

  return s;
}

function normalizeCellValue(v, headerName = "") {
  const h = String(headerName || "").trim();
  if (h === "日付" || h.toLowerCase() === "date") return normalizeDateValue(v);
  return v == null ? "" : String(v).trim();
}

export function readSheetRows(workbook, sheetName) {
  if (!workbook || !sheetName) return [];
  const ws = workbook.Sheets[sheetName];
  if (!ws) return [];

  const rows = XLSX.utils.sheet_to_json(ws, {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
    cellDates: true,
  });

  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[String(k).trim()] = normalizeCellValue(v, k);
    }
    return out;
  });
}

export function findValueByHeader(row, candidates) {
  if (!row) return "";
  const entries = Object.entries(row).map(([k, v]) => [String(k).trim(), v]);
  for (const name of candidates) {
    const hit = entries.find(([k]) => k === name);
    if (hit) return name === "日付" ? normalizeDateValue(hit[1]) : hit[1] ?? "";
  }
  return "";
}

function toText(v) {
  return String(v ?? "").trim();
}

function normalizeForCompare(value) {
  return toText(value).toLowerCase();
}

function splitTerms(value) {
  return String(value || "")
    .split(/[,,、\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function matchesOne(value, filterText) {
  const terms = splitTerms(filterText);
  if (!terms.length) return true;
  const actual = toText(value).toLowerCase();
  return terms.some((term) => actual === term.toLowerCase());
}

function getFirstExistingHeader(row, candidates) {
  const keys = new Set(Object.keys(row || {}).map((k) => String(k).trim()));
  return candidates.find((name) => keys.has(name)) || "";
}

export function resolveMapVariant(row, mapKey) {
  const layoutCount = getMapLayoutCount(mapKey);
  const header = getFirstExistingHeader(row, ["暗号機配置", "配置", "組", "cipher_layout"]);
  const raw = header ? findValueByHeader(row, [header]) : "";
  const n = Number(toText(raw));

  if (!header) {
    return { value: 1, source: "default", note: "暗号機配置列なし" };
  }
  if (!toText(raw)) {
    return { value: 1, source: "default", note: "暗号機配置空欄" };
  }
  if (!Number.isFinite(n) || n < 1 || n > layoutCount) {
    return { value: 1, source: "default", note: `暗号機配置不正: ${toText(raw)}` };
  }
  return { value: Math.floor(n), source: "data", note: "" };
}

function safeFilePart(value, fallback = "x") {
  const s = toText(value) || fallback;
  return s
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

export function makeExportFileName(job, index, ext = "png") {
  const m = job.meta || {};
  const parts = [
    String(index + 1).padStart(3, "0"),
    job.hunter?.character || "使用キャラEなし",
    m.date,
    `${m.home || "Home"}_vs_${m.away || "Away"}`,
    `R${m.r || m.round || ""}`,
    m.half,
    getMapLabel(job.mapType),
    `第${job.mapVariant}組`,
    job.hunter?.player,
  ].filter(Boolean);

  return `${safeFilePart(parts.join("_"))}.${ext}`;
}

export async function readWorkbookFile(file) {
  const buf = await file.arrayBuffer();
  return XLSX.read(buf, { type: "array", cellDates: true });
}

export function buildExportJobsFromWorkbook(workbook, sourceName, selectedSheetNames) {
  const sheetNames = selectedSheetNames?.length ? selectedSheetNames : workbook?.SheetNames || [];
  const jobs = [];

  for (const sheetName of sheetNames) {
    const rows = readSheetRows(workbook, sheetName);
    rows.forEach((row, idx) => {
      const normalized = normalizeMatchRow(row, findValueByHeader);
      const mapType = normalized.mapKey || getMapKeyFromPickM1(normalized.pickM1);
      if (!mapType) return;

      const variant = resolveMapVariant(row, mapType);
      const pieces = buildPiecesFromMatch(normalized);
      const meta = {
        date: normalized.meta.date,
        home: normalized.meta.home,
        away: normalized.meta.away,
        r: normalized.meta.round,
        half: normalized.meta.half,
        survivorTeam: normalized.meta.survivorTeam,
        hunterTeam: normalized.meta.hunterTeam,
      };

      jobs.push({
        id: `${sourceName}-${sheetName}-${idx}`,
        sourceName,
        sheetName,
        rowIndex: idx + 2,
        row,
        pickM1: normalized.pickM1,
        mapType,
        mapVariant: variant.value,
        mapVariantSource: variant.source,
        mapVariantNote: variant.note,
        meta,
        survivors: normalized.survivors,
        hunter: normalized.hunter,
        pieces,
        activePhase: { id: "bulk-phase", name: "Excel", pieces, annotations: [] },
      });
    });
  }

  return jobs;
}

export function filterExportJobs(jobs, filters) {
  return (jobs || []).filter((job) => {
    const row = job.row || {};
    if (!matchesOne(findValueByHeader(row, ["pick_M1", "pick_M", "マップ"]), filters.pickM1)) return false;
    if (!matchesOne(findValueByHeader(row, ["S"]), filters.survivorTeam)) return false;
    if (!matchesOne(findValueByHeader(row, ["H"]), filters.hunterTeam)) return false;
    if (!matchesOne(findValueByHeader(row, ["使用キャラE"]), filters.hunterCharacter)) return false;
    if (!matchesOne(findValueByHeader(row, ["使用者E"]), filters.hunterPlayer)) return false;

    const q = toText(filters.keyword).toLowerCase();
    if (q) {
      const haystack = Object.values(row).map((v) => toText(v)).join("\t").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

function compareText(a, b) {
  return toText(a).localeCompare(toText(b), "ja", { numeric: true });
}

function dateLikeToTime(value) {
  const s = toText(value);
  if (!s) return Number.MAX_SAFE_INTEGER;

  const normalized = s.replace(/\./g, "-").replace(/\//g, "-");

  // yyyy-m-d / yyyy-mm-dd
  const ymd = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d).getTime();
    }
  }

  // m-d-yy / m-d-yyyy
  // 例: 6/1/25 → 2025-06-01
  const mdy = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/);
  if (mdy) {
    const m = Number(mdy[1]);
    const d = Number(mdy[2]);
    let y = Number(mdy[3]);

    if (y < 100) y += 2000;

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d).getTime();
    }
  }

  const parsed = Date.parse(normalized);
  if (!Number.isNaN(parsed)) return parsed;

  return Number.MAX_SAFE_INTEGER;
}

function compareDateLike(a, b) {
  const at = dateLikeToTime(a);
  const bt = dateLikeToTime(b);

  if (at !== bt) return at - bt;

  return compareText(a, b);
}

function getHalfOrder(value) {
  const s = toText(value);

  if (s.includes("前")) return 0;
  if (s.includes("後")) return 1;

  return 9;
}

function compareHalf(a, b) {
  const ao = getHalfOrder(a);
  const bo = getHalfOrder(b);

  if (ao !== bo) return ao - bo;

  return compareText(a, b);
}

export function sortExportJobsByHunterCharacterOrder(jobs, hunterCharacterFilter) {
  const orderTerms = splitTerms(hunterCharacterFilter);

  if (!orderTerms.length) {
    return [...(jobs || [])].sort((a, b) => {
      const aMeta = a?.meta || {};
      const bMeta = b?.meta || {};

      return (
        compareDateLike(aMeta.date, bMeta.date) ||
        compareText(aMeta.r, bMeta.r) ||
        compareHalf(aMeta.half, bMeta.half) ||
        compareText(aMeta.home, bMeta.home) ||
        compareText(aMeta.away, bMeta.away) ||
        compareText(a.sourceName, b.sourceName) ||
        compareText(a.sheetName, b.sheetName) ||
        ((a.rowIndex || 0) - (b.rowIndex || 0))
      );
    });
  }

  const orderMap = new Map(
    orderTerms.map((name, index) => [normalizeForCompare(name), index])
  );

  return [...(jobs || [])].sort((a, b) => {
    const aChar = normalizeForCompare(a?.hunter?.character);
    const bChar = normalizeForCompare(b?.hunter?.character);

    const aRank = orderMap.has(aChar)
      ? orderMap.get(aChar)
      : Number.MAX_SAFE_INTEGER;

    const bRank = orderMap.has(bChar)
      ? orderMap.get(bChar)
      : Number.MAX_SAFE_INTEGER;

    // ① 最優先：使用キャラEの指定順
    if (aRank !== bRank) return aRank - bRank;

    const aMeta = a?.meta || {};
    const bMeta = b?.meta || {};

    // ② 同じ使用キャラEの中だけ日付順
    return (
      compareDateLike(aMeta.date, bMeta.date) ||
      compareText(aMeta.r, bMeta.r) ||
      compareHalf(aMeta.half, bMeta.half) ||
      compareText(aMeta.home, bMeta.home) ||
      compareText(aMeta.away, bMeta.away) ||
      compareText(a.sourceName, b.sourceName) ||
      compareText(a.sheetName, b.sheetName) ||
      ((a.rowIndex || 0) - (b.rowIndex || 0))
    );
  });
}