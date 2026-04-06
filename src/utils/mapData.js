export const MAP_OPTIONS = [
  { key: "leo", label: "レオ思" },
  { key: "park", label: "公園" },
　{ key: "hospital", label: "病院" },
  { key: "forest", label: "罪の森" },
  { key: "eversleep", label: "永眠町" },
  { key: "church", label: "教会" },
  { key: "lakeside", label: "湖景村" },
  { key: "factory", label: "工場" },
  { key: "china", label: "中華街" },
];

export function getMapLabel(mapType) {
  const hit = MAP_OPTIONS.find((m) => m.key === mapType);
  return hit ? hit.label : mapType;
}