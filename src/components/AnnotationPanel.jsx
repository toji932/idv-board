import React from "react";

function AnnotationPanel({
   strokeColors,
   currentStrokeColor,
   setCurrentStrokeColor,
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
       <label>描画色</label>
        <div className="color-row">
          {strokeColors.map((c) => (
            <button
              key={c.key}
              className={`color-chip ${
                currentStrokeColor === c.key ? "selected-color" : ""
              }`}
              style={{ backgroundColor: c.key }}
              onClick={() => setCurrentStrokeColor(c.key)}
               title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="button-row">
        <button
          className={drawMode === "freehand" ? "active-btn" : ""}
          onClick={() => {
            setDrawMode((prev) => (prev === "freehand" ? "select" : "freehand"));
             onClearSelections();
          }}
        >
          自由描画
        </button>

        <button onClick={onAddTextAnnotation}>テキスト追加</button>

        {selectedAnnotation && (
          <button onClick={() => onDeleteAnnotation(selectedAnnotation.id)}>
            選択注釈を削除
          </button>
        )}
      </div>

      <div className="hint">
        {drawMode === "freehand"
           ? "盤面上でドラッグすると自由に線を描けます"
           : "自由描画OFF"}
      </div>

       {selectedAnnotation?.type === "freehand" && (
  <div>
    <div className="field">
      <label>選択中の線の色</label>
      <div className="color-row">
        {strokeColors.map((c) => (
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
  </div>
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