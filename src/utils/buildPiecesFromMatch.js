import { getSpawnPosition } from "./spawnPositions";

function clamp01(n) {
  return Math.max(0.03, Math.min(0.97, n));
}

function toBoardRatio(pos) {
  if (!pos) return null;

  if (
    typeof pos.x === "number" &&
    typeof pos.y === "number" &&
    pos.x >= 0 &&
    pos.x <= 1 &&
    pos.y >= 0 &&
    pos.y <= 1
  ) {
    return {
      x: clamp01(pos.x),
      y: clamp01(pos.y),
    };
  }

  return {
    x: clamp01((Number(pos.x) || 0) / 1000),
    y: clamp01((Number(pos.y) || 0) / 625),
  };
}

function makeFallbackPosition(index, role) {
  if (role === "hunter") {
    return { x: 0.72, y: 0.18 };
  }

  return {
    x: 0.12,
    y: clamp01(0.18 + index * 0.12),
  };
}

function getIconPath(role, name) {
  const folder = role === "survivor" ? "survivors" : "hunters";
  return `/icons/${folder}/${encodeURIComponent(name)}.png`;
}

function formatPersona(persona, role) {
  const text = String(persona || "").trim();
  if (!text) return "";

  if (role === "hunter") {
    if (text.length <= 4) return text;
    return text.slice(0, 2) + text.slice(-2);
  }

  return text.slice(0, 2);
}

function buildOnePiece({
  role,
  id,
  name,
  label,
  persona,
  spawnNo,
  mapKey,
  index,
}) {
  const rawPos =
    mapKey && spawnNo ? getSpawnPosition(mapKey, spawnNo) : null;

  const pos = toBoardRatio(rawPos) || makeFallbackPosition(index, role);

  return {
    id,
    role,
    name: name || "",
    label: label || name || "",
    persona: formatPersona(persona, role),
    icon: getIconPath(role, name || ""),
    x: pos.x,
    y: pos.y,
  };
}

export function buildPiecesFromMatch(normalized) {
  const mapKey = normalized?.mapKey || "";

  const survivorPieces = (normalized?.survivors || []).map((s, idx) =>
    buildOnePiece({
      role: "survivor",
      id: `piece-survivor-${s.slot}`,
      name: s.character,
      label: s.player || s.character,
      persona: s.persona,
      spawnNo: s.spawnNo,
      mapKey,
      index: idx,
    })
  );

  const h = normalized?.hunter || {};
  const hunterPiece = buildOnePiece({
    role: "hunter",
    id: "piece-hunter-E",
    name: h.character,
    label: h.player || h.character,
    persona: h.persona,
    spawnNo: h.spawnNo,
    mapKey,
    index: 0,
  });

  return [...survivorPieces, hunterPiece];
}