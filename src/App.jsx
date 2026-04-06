import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import "./App.css";
import CipherPanel from "./components/CipherPanel";
import MatchInfoPanel from "./components/MatchInfoPanel";
import PhasePanel from "./components/PhasePanel";
import PiecePanel from "./components/PiecePanel";
import AnnotationPanel from "./components/AnnotationPanel";
import ExcelImportPanel from "./components/ExcelImportPanel";
import MetaBar from "./components/MetaBar";
import BoardCanvas from "./components/BoardCanvas";
import MapPanel from "./components/MapPanel";
import ExportPanel from "./components/ExportPanel";
import { getMapKeyFromPickM1, getMapLabel, isSameMapByPickM1 } from "./utils/mapData";
import { normalizeMatchRow } from "./utils/normalizeMatchRow";
import { buildPiecesFromMatch } from "./utils/buildPiecesFromMatch";

const SURVIVOR_NAMES = [
  "エンジ", "オフェ", "カウボーイ", "バーメ", "バッツ", "ファウロ", "ポスト",
  "マジシャン", "医師", "応援団", "火災", "画家", "患者", "玩具", "気象", "記者",
  "騎士", "技師", "弓使い", "泣きピ", "教授", "曲芸師", "空軍", "幻灯師", "幸運児",
  "航海士", "骨董商", "昆虫", "祭司", "作曲家", "呪術師", "囚人", "小説家", "少女",
  "心眼", "心理", "人形師", "占い師", "脱出マスター", "探鉱者", "調香師", "庭師",
  "泥棒", "闘牛士", "納棺師", "弁護士", "墓守", "冒険家", "野人", "傭兵", "踊り子",
];

const HUNTER_NAMES = [
  "アイヴィ", "アン", "アンデッド", "イタカ", "オペラ", "ガラテア", "キーガン", "グレイス",
  "ジョゼフ", "バイオリニスト", "ハスター", "バルク", "ピエロ", "ビリヤード",
  "フールズゴールド", "フラバルー", "ボンボン", "リッパー", "ルキノ", "レオ", "悪夢",
  "隠者", "泣き虫", "芸者", "雑貨商", "鹿", "女王", "女王蜂", "蜘蛛", "破輪",
  "白黒無常", "魔女", "羊", "蝋人形師",
];

const STROKE_COLORS = [
  { key: "#e11d48", label: "赤" },
  { key: "#2563eb", label: "青" },
  { key: "#16a34a", label: "緑" },
  { key: "#ca8a04", label: "黄" },
  { key: "#7c3aed", label: "紫" },
];

const DEFAULT_CIPHERS = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  value: "0",
  visible: false,
  x: 0.14 + 0.10 * i, // 0..1（左→右）
  y: 0.16,            // 0..1（上）
}));

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateObject(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function normalizeDateValue(v) {
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

  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(s)) {
    const m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (m) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
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
  if (h === "日付" || h.toLowerCase() === "date") {
    return normalizeDateValue(v);
  }
  return v == null ? "" : String(v);
}

function readSheetRows(workbook, sheetName) {
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

function findValueByHeader(row, candidates) {
  if (!row) return "";
  const entries = Object.entries(row).map(([k, v]) => [String(k).trim(), v]);
  for (const name of candidates) {
    const hit = entries.find(([k]) => k === name);
    if (hit) {
      if (name === "日付") return normalizeDateValue(hit[1]);
      return hit[1] ?? "";
    }
  }
  return "";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function clamp01(n) {
  return clamp(n, 0, 1);
}

function makeDefaultPhase(name = "Phase 1") {
  return {
    id: uid("phase"),
    name,
    pieces: [],
    annotations: [],
  };
}

function iconPath(folder, fileBaseName) {
  return `/icons/${folder}/${encodeURIComponent(fileBaseName)}.png`;
}

export default function App() {
  const boardRef = useRef(null);
  const exportAreaRef = useRef(null);

  const initialPhase = useMemo(() => makeDefaultPhase("Phase 1"), []);
  const [phases, setPhases] = useState([initialPhase]);
  const [activePhaseId, setActivePhaseId] = useState(initialPhase.id);

  const [mapType, setMapType] = useState("leo");
  const [mapVariant, setMapVariant] = useState(1);

  const [meta, setMeta] = useState({
    date: "",
    home: "",
    away: "",
    r: "",
    half: "",
    survivorTeam: "",
    hunterTeam: "",
  });

  function changeActivePhase(nextPhaseId) {
  setActivePhaseId(nextPhaseId);
  setSelectedPieceId(null);
  setSelectedAnnotationId(null);
  setDrawMode("select");
}

　function clearSelections() {
  setSelectedPieceId(null);
  setSelectedAnnotationId(null);
}

function clearBoardSelection() {
  setSelectedPieceId(null);
  setSelectedAnnotationId(null);
}

function selectAnnotation(annotationId) {
  setSelectedAnnotationId(annotationId);
  setSelectedPieceId(null);
}

function selectPiece(pieceId) {
  setSelectedPieceId(pieceId);
  setSelectedAnnotationId(null);
}

　function clearExcelFilters() {
  setSearchText("");
  setDateFrom("");
  setDateTo("");
}

  const [cipherSlots, setCipherSlots] = useState(DEFAULT_CIPHERS);

  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);

  const [survivorChoice, setSurvivorChoice] = useState(SURVIVOR_NAMES[0] || "");
  const [hunterChoice, setHunterChoice] = useState(HUNTER_NAMES[0] || "");

  const [drawMode, setDrawMode] = useState("select"); // select | freehand
  const [draftStroke, setDraftStroke] = useState(null); // { color, points:[{x,y}...] }
  const [currentStrokeColor, setCurrentStrokeColor] = useState(STROKE_COLORS[0].key);

  const [workbook, setWorkbook] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [sheetRows, setSheetRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const activePhase = useMemo(
    () => phases.find((p) => p.id === activePhaseId) || phases[0],
    [phases, activePhaseId]
  );

  const currentMapUrl = useMemo(
    () => `/maps/${mapType}_${mapVariant}.png`,
    [mapType, mapVariant]
  );

  const filteredRows = useMemo(() => {
    return sheetRows.filter((row) => {
      const q = searchText.trim().toLowerCase();
      const rowDate = normalizeDateValue(findValueByHeader(row, ["日付"]));

      if (dateFrom && rowDate && rowDate < dateFrom) return false;
      if (dateTo && rowDate && rowDate > dateTo) return false;

      if (!q) return true;

      return Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      );
    });
  }, [sheetRows, searchText, dateFrom, dateTo]);

  const selectedPiece =
    activePhase?.pieces.find((p) => p.id === selectedPieceId) || null;

  const selectedAnnotation =
    activePhase?.annotations.find((a) => a.id === selectedAnnotationId) || null;

  function updateMeta(key, value) {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }

  function updateCipherValue(index, value) {
    setCipherSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, value } : slot))
    );
  }

  function toggleCipherVisible(index) {
    setCipherSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, visible: !slot.visible } : slot
      )
    );
  }

  function updateActivePhase(mutator) {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== activePhaseId) return p;
        return mutator(cloneDeep(p));
      })
    );
  }

  function addCharacterPiece(role, name) {
    if (!name) return;
    const folder = role === "survivor" ? "survivors" : "hunters";

    const newPiece = {
      id: uid("piece"),
      role,
      name,
      label: name,
      icon: iconPath(folder, name),
      x: 0.5,
      y: 0.5,
    };

    updateActivePhase((phase) => {
      phase.pieces.push(newPiece);
      return phase;
    });

    setSelectedPieceId(newPiece.id);
    setSelectedAnnotationId(null);
    setDrawMode("select");
  }

  function updatePiece(pieceId, patch) {
    updateActivePhase((phase) => {
      phase.pieces = phase.pieces.map((p) =>
        p.id === pieceId ? { ...p, ...patch } : p
      );
      return phase;
    });
  }

  function deletePiece(pieceId) {
    updateActivePhase((phase) => {
      phase.pieces = phase.pieces.filter((p) => p.id !== pieceId);
      return phase;
    });
    if (selectedPieceId === pieceId) setSelectedPieceId(null);
  }

  function addTextAnnotation() {
    const ann = {
      id: uid("ann"),
      type: "text",
      x: 0.5,
      y: 0.5,
      text: "テキスト",
    };

    updateActivePhase((phase) => {
      phase.annotations.push(ann);
      return phase;
    });

    setSelectedAnnotationId(ann.id);
    setSelectedPieceId(null);
    setDrawMode("select");
  }

  function updateAnnotation(annId, patch) {
    updateActivePhase((phase) => {
      phase.annotations = phase.annotations.map((a) =>
        a.id === annId ? { ...a, ...patch } : a
      );
      return phase;
    });
  }

  function deleteAnnotation(annId) {
    updateActivePhase((phase) => {
      phase.annotations = phase.annotations.filter((a) => a.id !== annId);
      return phase;
    });
    if (selectedAnnotationId === annId) setSelectedAnnotationId(null);
  }

  function addPhase() {
    const p = makeDefaultPhase(`Phase ${phases.length + 1}`);
    setPhases((prev) => [...prev, p]);
    setActivePhaseId(p.id);
    setSelectedPieceId(null);
    setSelectedAnnotationId(null);
    setDrawMode("select");
  }

  function renamePhase() {
    if (!activePhase) return;
    const name = window.prompt("新しいフェーズ名", activePhase.name);
    if (!name) return;
    setPhases((prev) =>
      prev.map((p) => (p.id === activePhase.id ? { ...p, name } : p))
    );
  }

  function duplicatePhase() {
    if (!activePhase) return;
    const copy = cloneDeep(activePhase);
    copy.id = uid("phase");
    copy.name = `${activePhase.name} copy`;
    copy.pieces = copy.pieces.map((p) => ({ ...p, id: uid("piece") }));
    copy.annotations = copy.annotations.map((a) => ({ ...a, id: uid("ann") }));
    setPhases((prev) => [...prev, copy]);
    setActivePhaseId(copy.id);
    setSelectedPieceId(null);
    setSelectedAnnotationId(null);
    setDrawMode("select");
  }

  function deletePhase() {
    if (phases.length <= 1) {
      alert("最後の1フェーズは削除できません。");
      return;
    }
    const idx = phases.findIndex((p) => p.id === activePhaseId);
    const next = phases.filter((p) => p.id !== activePhaseId);
    setPhases(next);
    setActivePhaseId(next[Math.max(0, idx - 1)].id);
    setSelectedPieceId(null);
    setSelectedAnnotationId(null);
    setDrawMode("select");
  }

  function exportJson() {
    const data = {
      meta,
      cipherSlots,
      mapType,
      mapVariant,
      phases,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "idv-board-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      if (data.meta) setMeta(data.meta);

      if (Array.isArray(data.cipherSlots) && data.cipherSlots.length === 7) {
        setCipherSlots(
          data.cipherSlots.map((slot, i) => ({
            id: i + 1,
            value: String(slot?.value ?? "0"),
            visible: Boolean(slot?.visible),
            x: typeof slot?.x === "number" ? slot.x : (DEFAULT_CIPHERS[i]?.x ?? 0.2),
            y: typeof slot?.y === "number" ? slot.y : (DEFAULT_CIPHERS[i]?.y ?? 0.2),
          }))
        );
      }

      if (data.mapType) setMapType(data.mapType);
      if (data.mapVariant) setMapVariant(data.mapVariant);

      if (Array.isArray(data.phases) && data.phases.length) {
        setPhases(data.phases);
        setActivePhaseId(data.phases[0].id);
        setSelectedPieceId(null);
        setSelectedAnnotationId(null);
        setDrawMode("select");
      }
    } catch {
      alert("JSONの読み込みに失敗しました。");
    }

    e.target.value = "";
  };

  reader.readAsText(file, "utf-8");
}

async function exportBoardImage() {
  if (!exportAreaRef.current) return;

  const canvas = await html2canvas(exportAreaRef.current, {
    useCORS: true,
    backgroundColor: null,
  });

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "idv-board.png";
  a.click();
}

  async function importWorkbook(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, {
        type: "array",
        cellDates: true,
      });

      setWorkbook(wb);
      const first = wb.SheetNames[0] || "";
      setSelectedSheet(first);
      setSheetRows(readSheetRows(wb, first));
    } catch {
      alert("Excelの読み込みに失敗しました。");
    }

    e.target.value = "";
  }

  function changeSheet(name) {
    setSelectedSheet(name);
    setSheetRows(readSheetRows(workbook, name));
  }

function applyRowToMeta(row) {
  const normalized = normalizeMatchRow(row, findValueByHeader);
  const rowMapKey = normalized.mapKey;
  const currentMapKey = mapType;

  if (!rowMapKey) {
    alert(`pick_M1 をマップに変換できません: ${normalized.pickM1 || ""}`);
    return;
  }

  if (!isSameMapByPickM1(normalized.pickM1, currentMapKey)) {
    alert(
      `データのマップ(${getMapLabel(rowMapKey)})と現在の盤面(${getMapLabel(currentMapKey)})が一致しません`
    );
    return;
  }

  const nextPieces = buildPiecesFromMatch(normalized);

  setMeta((prev) => ({
    ...prev,
    date: normalized.meta.date,
    home: normalized.meta.home,
    away: normalized.meta.away,
    r: normalized.meta.round,
    half: normalized.meta.half,
    survivorTeam: normalized.meta.survivorTeam,
    hunterTeam: normalized.meta.hunterTeam,
  }));

  setPhases((prev) =>
    prev.map((phase) =>
      phase.id === activePhaseId
        ? {
            ...phase,
            pieces: nextPieces,
          }
        : phase
    )
  );

  setSelectedPieceId(null);
  setSelectedAnnotationId(null);
  setDrawMode("select");
}

  function getBoardPointFromEvent(ev) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clamp01((ev.clientX - rect.left) / rect.width),
      y: clamp01((ev.clientY - rect.top) / rect.height),
    };
  }

  function handleBoardPointerDown(ev) {
  if (drawMode !== "freehand") return;
  const pt = getBoardPointFromEvent(ev);
  if (!pt) return;

  setDraftStroke({
    color: currentStrokeColor,
    points: [pt],
  });
}

function handleBoardPointerMove(ev) {
  if (!draftStroke) return;
  const pt = getBoardPointFromEvent(ev);
  if (!pt) return;

  setDraftStroke((prev) =>
    prev ? { ...prev, points: [...prev.points, pt] } : prev
  );
}

function handleBoardPointerUp() {
  if (!draftStroke) return;

  if ((draftStroke.points?.length || 0) >= 2) {
    const ann = {
      id: uid("ann"),
      type: "freehand",
      color: draftStroke.color,
      points: draftStroke.points,
    };

    updateActivePhase((phase) => {
      phase.annotations.push(ann);
      return phase;
    });

    setSelectedAnnotationId(ann.id);
    setSelectedPieceId(null);
  }

  setDraftStroke(null);
  setDrawMode("select");
}

  function startPieceDrag(ev, piece) {
    ev.stopPropagation();
    setSelectedPieceId(piece.id);
    setSelectedAnnotationId(null);
    setDrawMode("select");

    const startX = ev.clientX;
    const startY = ev.clientY;
    const origX = piece.x;
    const origY = piece.y;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    function onMove(e) {
      const dx = (e.clientX - startX) / rect.width;
      const dy = (e.clientY - startY) / rect.height;
      updatePiece(piece.id, {
        x: clamp(origX + dx, 0.03, 0.97),
        y: clamp(origY + dy, 0.03, 0.97),
      });
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

function startCipherDrag(ev, slot) {
  console.log("cipher down", slot.id);
  ev.stopPropagation();
  setSelectedPieceId(null);
  setSelectedAnnotationId(null);
  setDrawMode("select");

  const startX = ev.clientX;
  const startY = ev.clientY;
  const origX = slot.x ?? 0.2;
  const origY = slot.y ?? 0.2;

  const rect = boardRef.current?.getBoundingClientRect();
  if (!rect) return;

  function onMove(e) {
    const dx = (e.clientX - startX) / rect.width;
    const dy = (e.clientY - startY) / rect.height;

    setCipherSlots((prev) =>
      prev.map((c) =>
        c.id === slot.id
          ? { ...c, x: clamp01(origX + dx), y: clamp01(origY + dy) }
          : c
      )
    );
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

function startAnnotationDrag(ev, ann) {
  ev.stopPropagation();
  setSelectedAnnotationId(ann.id);
  setSelectedPieceId(null);
  setDrawMode("select");

  const startX = ev.clientX;
  const startY = ev.clientY;
  const base = cloneDeep(ann);
  const rect = boardRef.current?.getBoundingClientRect();
  if (!rect) return;

  function onMove(e) {
    const dx = (e.clientX - startX) / rect.width;
    const dy = (e.clientY - startY) / rect.height;

    if (ann.type === "freehand") {
      updateAnnotation(ann.id, {
        points: (base.points || []).map((p) => ({
          x: clamp01(p.x + dx),
          y: clamp01(p.y + dy),
        })),
      });
    } else if (ann.type === "text") {
      updateAnnotation(ann.id, {
        x: clamp01(base.x + dx),
        y: clamp01(base.y + dy),
      });
    }
  }

  function onUp() {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
}

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>第五人格 戦術ボード</h1>

  <MapPanel
    mapType={mapType}
    setMapType={setMapType}
    mapVariant={mapVariant}
    setMapVariant={setMapVariant}
  />

  <PhasePanel
    phases={phases}
    activePhaseId={activePhaseId}
    onChangePhase={changeActivePhase}
    onAddPhase={addPhase}
    onRenamePhase={renamePhase}
    onDuplicatePhase={duplicatePhase}
    onDeletePhase={deletePhase}
  />

  <PiecePanel
    survivorNames={SURVIVOR_NAMES}
    hunterNames={HUNTER_NAMES}
    survivorChoice={survivorChoice}
    setSurvivorChoice={setSurvivorChoice}
    hunterChoice={hunterChoice}
    setHunterChoice={setHunterChoice}
    onAddCharacterPiece={addCharacterPiece}
    selectedPiece={selectedPiece}
    onUpdatePiece={updatePiece}
    onDeletePiece={deletePiece}
  />

  <AnnotationPanel
  strokeColors={STROKE_COLORS}
  currentStrokeColor={currentStrokeColor}
  setCurrentStrokeColor={setCurrentStrokeColor}
  drawMode={drawMode}
  setDrawMode={setDrawMode}
  onAddTextAnnotation={addTextAnnotation}
  selectedAnnotation={selectedAnnotation}
  onDeleteAnnotation={deleteAnnotation}
  onUpdateAnnotation={updateAnnotation}
  onClearSelections={clearSelections}
/>

  <CipherPanel
    cipherSlots={cipherSlots}
    onChangeValue={updateCipherValue}
    onToggleVisible={toggleCipherVisible}
  />

  <MatchInfoPanel
    meta={meta}
    onUpdateMeta={updateMeta}
  />

  <ExcelImportPanel
    workbook={workbook}
    selectedSheet={selectedSheet}
    onImportWorkbook={importWorkbook}
    onChangeSheet={changeSheet}
    searchText={searchText}
    setSearchText={setSearchText}
    dateFrom={dateFrom}
    setDateFrom={setDateFrom}
    dateTo={dateTo}
    setDateTo={setDateTo}
    filteredRows={filteredRows}
    onApplyRowToMeta={applyRowToMeta}
    onClearFilters={clearExcelFilters}
    findValueByHeader={findValueByHeader}
  />

  <ExportPanel
    onExportJson={exportJson}
    onExportBoardImage={exportBoardImage}
    onImportJson={importJson}
  />
</aside>

      <main className="main">
  <div ref={exportAreaRef} className="export-area">
    <MetaBar
      meta={meta}
      mapType={mapType}
      mapVariant={mapVariant}
    />

    <BoardCanvas
      boardRef={boardRef}
      mapType={mapType}
      currentMapUrl={currentMapUrl}
      activePhase={activePhase}
      draftStroke={draftStroke}
      cipherSlots={cipherSlots}
      selectedPieceId={selectedPieceId}
      selectedAnnotationId={selectedAnnotationId}
      strokeColors={STROKE_COLORS}
      onBoardPointerDown={handleBoardPointerDown}
      onBoardPointerMove={handleBoardPointerMove}
      onBoardPointerUp={handleBoardPointerUp}
      onClearBoardSelection={clearBoardSelection}
      onStartAnnotationDrag={startAnnotationDrag}
      onStartPieceDrag={startPieceDrag}
      onStartCipherDrag={startCipherDrag}
      onSelectAnnotation={selectAnnotation}
      onSelectPiece={selectPiece}
      setDrawMode={setDrawMode}
    />
  </div>
</main>
  </div>
  );
}