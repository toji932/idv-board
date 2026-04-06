export const MAP_OPTIONS = [
  { key: "leo", label: "レオ思", aliases: ["レオ思", "レオ", "レオの思い出"] },
  { key: "park", label: "公園", aliases: ["公園", "月の河公園", "月の河"] },
  { key: "hospital", label: "病院", aliases: ["病院", "聖心病院"] },
  { key: "forest", label: "罪の森", aliases: ["罪の森", "森"] },
  { key: "eversleep", label: "永眠町", aliases: ["永眠町", "永眠"] },
  { key: "church", label: "教会", aliases: ["教会", "赤の教会"] },
  { key: "lakeside", label: "湖景村", aliases: ["湖景村", "湖景"] },
  { key: "factory", label: "工場", aliases: ["工場", "軍需工場"] },
  { key: "china", label: "中華街", aliases: ["中華街", "中華"] },
];

export function getMapLabel(mapType) {
  const hit = MAP_OPTIONS.find((m) => m.key === mapType);
  return hit ? hit.label : mapType;
}

export function getMapKeyFromPickM1(value) {
  const v = String(value || "").trim();
  if (!v) return "";

  const hit = MAP_OPTIONS.find(
    (m) => m.key === v || m.label === v || (m.aliases && m.aliases.includes(v))
  );
  return hit ? hit.key : "";
}

export function isSameMapByPickM1(pickM1, currentMapKey) {
  const pickKey = getMapKeyFromPickM1(pickM1);
  return !!pickKey && pickKey === currentMapKey;
}

export function getMapLabelFromPickM1(value) {
  const key = getMapKeyFromPickM1(value);
  return key ? getMapLabel(key) : String(value || "").trim();
}