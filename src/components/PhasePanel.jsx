import React from "react";

function PhasePanel({
  phases,
  activePhaseId,
  onChangePhase,
  onAddPhase,
  onRenamePhase,
  onDuplicatePhase,
  onDeletePhase,
}) {
  return (
    <section className="panel">
      <h2>フェーズ</h2>

      <div className="field">
        <label>現在のフェーズ</label>
        <select
          value={activePhaseId}
          onChange={(e) => onChangePhase(e.target.value)}
        >
          {phases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="button-row">
        <button onClick={onAddPhase}>追加</button>
        <button onClick={onRenamePhase}>名前変更</button>
        <button onClick={onDuplicatePhase}>複製</button>
        <button onClick={onDeletePhase}>削除</button>
      </div>
    </section>
  );
}

export default PhasePanel;