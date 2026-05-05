import React from "react";

function PiecePanel({
  survivorNames,
  hunterNames,
  survivorChoice,
  setSurvivorChoice,
  hunterChoice,
  setHunterChoice,
  onAddCharacterPiece,
  selectedPiece,
  onUpdatePiece,
  onDeletePiece,
}) {
  return (
    <section className="panel">
      <h2>駒追加</h2>

      <div className="field">
        <label>サバイバー</label>
        <div className="inline-row">
          <select
            value={survivorChoice}
            onChange={(e) => setSurvivorChoice(e.target.value)}
          >
            {survivorNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button onClick={() => onAddCharacterPiece("survivor", survivorChoice)}>
            追加
          </button>
        </div>
      </div>

      <div className="field">
        <label>ハンター</label>
        <div className="inline-row">
          <select
            value={hunterChoice}
            onChange={(e) => setHunterChoice(e.target.value)}
          >
            {hunterNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button onClick={() => onAddCharacterPiece("hunter", hunterChoice)}>
            追加
          </button>
        </div>
      </div>

      {selectedPiece ? (
        <>
          <div className="field">
            <label>選択中の駒ラベル</label>
            <input
              type="text"
              value={selectedPiece.label}
              onChange={(e) =>
                onUpdatePiece(selectedPiece.id, { label: e.target.value })
              }
            />
          </div>

          <div className="button-row">
            <button onClick={() => onDeletePiece(selectedPiece.id)}>
              駒を削除
            </button>
          </div>
        </>
      ) : (
        <div className="hint">
          盤面上の駒をクリックするとラベル編集できます
        </div>
      )}
    </section>
  );
}

export default PiecePanel;