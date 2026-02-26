import React from "react";

function ExcelImportPanel({
  workbook,
  selectedSheet,
  onImportWorkbook,
  onChangeSheet,
  searchText,
  setSearchText,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  filteredRows,
  onApplyRowToMeta,
  onClearFilters,
  findValueByHeader,
}) {
  return (
    <section className="panel">
      <h2>Excel試験連携</h2>

      <div className="field">
        <label>大会試合データ.xlsx</label>
        <input type="file" accept=".xlsx,.xls" onChange={onImportWorkbook} />
      </div>

      {workbook && (
        <>
          <div className="field">
            <label>シート</label>
            <select
              value={selectedSheet}
              onChange={(e) => onChangeSheet(e.target.value)}
            >
              {workbook.SheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>キーワード検索</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Home / Away / チーム名など"
            />
          </div>

          <div className="grid2">
            <div className="field">
              <label>日付From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="field">
              <label>日付To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="button-row">
            <button onClick={onClearFilters}>検索条件クリア</button>
          </div>

          <div className="rows-box">
            {filteredRows.slice(0, 50).map((row, idx) => (
              <button
                key={idx}
                className="row-item"
                onClick={() => onApplyRowToMeta(row)}
                title="クリックで試合情報へ反映"
              >
                <div>
                  {String(findValueByHeader(row, ["日付"]))} /{" "}
                  {String(findValueByHeader(row, ["Home"]))} vs{" "}
                  {String(findValueByHeader(row, ["Away"]))}
                </div>
                <div className="row-sub">
                  R:{String(findValueByHeader(row, ["R"]))} / 前後半:
                  {String(
                    findValueByHeader(row, ["前後半", "前半後半", "陣営"])
                  )}
                </div>
              </button>
            ))}

            {filteredRows.length > 50 && (
              <div className="hint">
                50件まで表示中です。検索で絞り込んでください。
              </div>
            )}

            {!filteredRows.length && (
              <div className="hint">一致する行がありません。</div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default ExcelImportPanel;