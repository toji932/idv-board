import React from "react";

function AnnotationPanel({
  arrowColors,
  currentArrowColor,
  setCurrentArrowColor,
  currentArrowBend,
  setCurrentArrowBend,
  drawMode,
  setDrawMode,
  onAddTextAnnotation,
  selectedAnnotation,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onClearSelections,
}) {
  return (
    <section className="panel">
      <h2>注釈</h2>

      <div className="field">
        <label>新規矢印の色</label>
        <div className="color-row">
          {arrowColors.map((c) => (
            <button
              key={c.key}
              className={`color-chip ${
                currentArrowColor === c.key ? "selected-color" : ""
              }`}
              style={{ backgroundColor: c.key }}
              onClick={() => setCurrentArrowColor(c.key)}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label>新規矢印の曲がり</label>
        <input
          type="range"
          min="0"
          max="0.5"
          step="0.01"
          value={currentArrowBend}
          onChange={(e) => setCurrentArrowBend(Number(e.target.value))}
        />
      </div>

      <div className="button-row">
        <button
          className={drawMode === "arrow" ? "active-btn" : ""}
          onClick={() => {
            setDrawMode((prev) => (prev === "arrow" ? "select" : "arrow"));
            onClearSelections();
          }}
        >
          曲線矢印描画
        </button>

        <button onClick={onAddTextAnnotation}>テキスト追加</button>

        {selectedAnnotation && (
          <button onClick={() => onDeleteAnnotation(selectedAnnotation.id)}>
            選択注釈を削除
          </button>
        )}
      </div>

      <div className="hint">
        {drawMode === "arrow"
          ? "盤面上でドラッグすると曲線矢印を引けます"
          : "矢印描画OFF"}
      </div>

      {selectedAnnotation?.type === "arrow" && (
        <>
          <div className="field">
            <label>選択中矢印の色</label>
            <div className="color-row">
              {arrowColors.map((c) => (
                <button
                  key={c.key}
                  className={`color-chip ${
                    selectedAnnotation.color === c.key ? "selected-color" : ""
                  }`}
                  style={{ backgroundColor: c.key }}
                  onClick={() =>
                    onUpdateAnnotation(selectedAnnotation.id, { color: c.key })
                  }
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <label>選択中矢印の曲がり</label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={Number(selectedAnnotation.bend ?? 0.2)}
              onChange={(e) =>
                onUpdateAnnotation(selectedAnnotation.id, {
                  bend: Number(e.target.value),
                })
              }
            />
          </div>
        </>
      )}

      {selectedAnnotation?.type === "text" && (
        <div className="field">
          <label>テキスト内容</label>
          <input
            type="text"
            value={selectedAnnotation.text}
            onChange={(e) =>
              onUpdateAnnotation(selectedAnnotation.id, { text: e.target.value })
            }
          />
        </div>
      )}
    </section>
  );
}

export default AnnotationPanel;