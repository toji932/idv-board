import React from "react";

function CipherPanel({ cipherSlots, onChangeValue, onToggleVisible }) {
  return (
    <section className="panel">
      <h2>暗号機進捗</h2>

      <div className="cipher-tool-grid">
        {cipherSlots.map((slot, index) => (
          <div className="cipher-tool-row" key={slot.id}>
            <span className="cipher-tool-label">{slot.id}</span>

            <input
              type="text"
              value={slot.value}
              onChange={(e) => onChangeValue(index, e.target.value)}
            />

            <button onClick={() => onToggleVisible(index)}>
              {slot.visible ? "非表示" : "表示"}
            </button>
          </div>
        ))}
      </div>

      <div className="hint">
        各行の「表示」で、その枠だけマップ上に出せます
      </div>
    </section>
  );
}

export default CipherPanel;