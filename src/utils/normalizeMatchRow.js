import { getMapKeyFromPickM1 } from "./mapData";

function toText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toSpawnNo(value) {
  const v = toText(value);
  if (!v) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

export function normalizeMatchRow(row, findValueByHeader) {
  const pickM1 = toText(findValueByHeader(row, ["pick_M1", "pick_M"]));
  const mapKey = getMapKeyFromPickM1(pickM1);

  return {
    pickM1,
    mapKey,

    meta: {
      date: toText(findValueByHeader(row, ["日付"])),
      home: toText(findValueByHeader(row, ["Home"])),
      away: toText(findValueByHeader(row, ["Away"])),
      round: toText(findValueByHeader(row, ["R"])),
      half: toText(findValueByHeader(row, ["前後半", "前半後半", "陣営"])),
      survivorTeam: toText(findValueByHeader(row, ["S"])),
      hunterTeam: toText(findValueByHeader(row, ["H"])),
    },

    survivors: [
      {
        slot: "A",
        player: toText(findValueByHeader(row, ["使用者A"])),
        character: toText(findValueByHeader(row, ["使用キャラA"])),
        persona: toText(findValueByHeader(row, ["人格A"])),
        spawnNo: toSpawnNo(findValueByHeader(row, ["A"])),
      },
      {
        slot: "B",
        player: toText(findValueByHeader(row, ["使用者B"])),
        character: toText(findValueByHeader(row, ["使用キャラB"])),
        persona: toText(findValueByHeader(row, ["人格B"])),
        spawnNo: toSpawnNo(findValueByHeader(row, ["B"])),
      },
      {
        slot: "C",
        player: toText(findValueByHeader(row, ["使用者C"])),
        character: toText(findValueByHeader(row, ["使用キャラC"])),
        persona: toText(findValueByHeader(row, ["人格C"])),
        spawnNo: toSpawnNo(findValueByHeader(row, ["C"])),
      },
      {
        slot: "D",
        player: toText(findValueByHeader(row, ["使用者D"])),
        character: toText(findValueByHeader(row, ["使用キャラD"])),
        persona: toText(findValueByHeader(row, ["人格D"])),
        spawnNo: toSpawnNo(findValueByHeader(row, ["D"])),
      },
    ],

    hunter: {
      slot: "E",
      player: toText(findValueByHeader(row, ["使用者E"])),
      character: toText(findValueByHeader(row, ["使用キャラE"])),
      persona: toText(findValueByHeader(row, ["人格E"])),
      spawnNo: toSpawnNo(findValueByHeader(row, ["E"])),
    },
  };
}