import React, { useMemo, useState } from "react";
import {
  buildExportJobsFromWorkbook,
  filterExportJobs,
  readWorkbookFile,
  sortExportJobsByHunterCharacterOrder,
} from "../utils/bulkExportJobs";
import { getMapLabel as labelMap } from "../utils/mapData";

const EMPTY_FILTERS = {
  keyword: "",
  pickM1: "",
  survivorTeam: "",
  hunterTeam: "",
  hunterCharacter: "",
  hunterPlayer: "",
};

function BulkExportPanel({ onApplyJob, onExportPngZip, onExportPdf }) {
  const [loadedFiles, setLoadedFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [status, setStatus] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");

  const filteredJobs = useMemo(() => {
    const matched = filterExportJobs(jobs, filters);
    return sortExportJobsByHunterCharacterOrder(matched, filters.hunterCharacter);
  }, [jobs, filters]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setStatus("Excelを読み込み中...");
      const nextFiles = [];
      const nextJobs = [];

      for (const file of files) {
        const workbook = await readWorkbookFile(file);
        nextFiles.push({ name: file.name, sheetNames: workbook.SheetNames });
        nextJobs.push(...buildExportJobsFromWorkbook(workbook, file.name));
      }

      setLoadedFiles(nextFiles);
      setJobs(nextJobs);
      setSelectedJobId("");
      setStatus(`${files.length}ファイル / ${nextJobs.length}件を読み込みました。`);
    } catch (err) {
      console.error(err);
      setStatus("Excelの読み込みに失敗しました。");
      alert("Excelの読み込みに失敗しました。ファイル形式を確認してください。");
    } finally {
      e.target.value = "";
    }
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function applyJob(job) {
    setSelectedJobId(job.id);
    onApplyJob?.(job);
  }

  async function exportPng() {
    if (!filteredJobs.length) {
      alert("出力対象がありません。");
      return;
    }
    setStatus(`PNG zip出力中... 0/${filteredJobs.length}`);
    await onExportPngZip?.(filteredJobs, (done, total) => {
      setStatus(`PNG zip出力中... ${done}/${total}`);
    });
    setStatus(`PNG zip出力が完了しました。${filteredJobs.length}件`);
  }

  async function exportPdf() {
    if (!filteredJobs.length) {
      alert("出力対象がありません。");
      return;
    }
    setStatus(`PDF出力中... 0/${filteredJobs.length}`);
    await onExportPdf?.(filteredJobs, (done, total) => {
      setStatus(`PDF出力中... ${done}/${total}`);
    });
    setStatus(`PDF出力が完了しました。${filteredJobs.length}件`);
  }

  return (
    <section className="panel bulk-panel">
      <h2>Excel一括盤面出力</h2>

      <div className="field">
        <label>Excelファイル（複数選択可）</label>
        <input type="file" accept=".xlsx,.xls" multiple onChange={handleFiles} />
      </div>

      {!!loadedFiles.length && (
        <div className="bulk-file-list">
          {loadedFiles.map((file) => (
            <div key={file.name} className="hint">
              {file.name}（{file.sheetNames.length}シート）
            </div>
          ))}
        </div>
      )}

      <div className="grid2">
        <div className="field">
          <label>pick_M1</label>
          <input
            value={filters.pickM1}
            onChange={(e) => updateFilter("pickM1", e.target.value)}
            placeholder="例: 湖景村"
          />
        </div>
        <div className="field">
          <label>キーワード</label>
          <input
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            placeholder="任意"
          />
        </div>
        <div className="field">
          <label>S</label>
          <input
            value={filters.survivorTeam}
            onChange={(e) => updateFilter("survivorTeam", e.target.value)}
            placeholder="例: SZ"
          />
        </div>
        <div className="field">
          <label>H</label>
          <input
            value={filters.hunterTeam}
            onChange={(e) => updateFilter("hunterTeam", e.target.value)}
            placeholder="例: ZETA"
          />
        </div>
        <div className="field">
          <label>使用キャラE</label>
          <input
            value={filters.hunterCharacter}
            onChange={(e) => updateFilter("hunterCharacter", e.target.value)}
            placeholder="例: オペラ"
          />
        </div>
        <div className="field">
          <label>使用者E</label>
          <input
            value={filters.hunterPlayer}
            onChange={(e) => updateFilter("hunterPlayer", e.target.value)}
            placeholder="例: Alf"
          />
        </div>
      </div>

      <div className="hint">複数指定はカンマ区切りです。条件はAND一致です。使用キャラEを複数指定した場合、出力順は入力順で固定されます。</div>

      <div className="button-row bulk-actions">
        <button onClick={clearFilters}>条件クリア</button>
        <button onClick={exportPng} disabled={!filteredJobs.length}>PNG zip出力</button>
        <button onClick={exportPdf} disabled={!filteredJobs.length}>PDF出力</button>
      </div>

      <div className="hint">該当件数: {filteredJobs.length} / 読込件数: {jobs.length}</div>
      {status && <div className="hint">{status}</div>}

      <div className="rows-box bulk-rows">
        {filteredJobs.slice(0, 100).map((job, idx) => (
          <button
            key={job.id}
            className={`row-item ${selectedJobId === job.id ? "active-btn" : ""}`}
            onClick={() => applyJob(job)}
            title="クリックで現在の盤面に反映"
          >
            <div>
              {job.meta.date || "日付なし"} / {job.meta.home || "Home"} vs {job.meta.away || "Away"}
            </div>
            <div className="row-sub">
              {job.sourceName} / {job.sheetName} / R:{job.meta.r} / {job.meta.half} / {labelMap(job.mapType)} 第{job.mapVariant}組
              {job.mapVariantSource === "default" ? "（既定値）" : ""}
            </div>
            <div className="row-sub">
              S:{job.meta.survivorTeam} / H:{job.meta.hunterTeam} / E:{job.hunter?.character || ""} {job.hunter?.player || ""}
            </div>
            {job.mapVariantNote && <div className="row-sub">{job.mapVariantNote}</div>}
          </button>
        ))}

        {filteredJobs.length > 100 && (
          <div className="hint">100件まで表示中です。条件で絞り込んでください。</div>
        )}
        {!filteredJobs.length && <div className="hint">一致する行がありません。</div>}
      </div>
    </section>
  );
}

export default BulkExportPanel;
