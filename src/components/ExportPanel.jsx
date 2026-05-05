import React from "react";

function ExportPanel({
  onExportJson,
  onExportBoardImage,
  onImportJson,
}) {
  return (
    <section className="panel">
      <h2>JSON / 書き出し</h2>

      <div className="button-row">
        <button onClick={onExportJson}>JSON保存</button>
        <button onClick={onExportBoardImage}>盤面画像を書き出し</button>
      </div>

      <div className="field">
        <label>JSON読込</label>
        <input
          type="file"
          accept=".json,application/json"
          onChange={onImportJson}
        />
      </div>
    </section>
  );
}

export default ExportPanel;