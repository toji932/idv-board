import React from "react";

function MatchInfoPanel({ meta, onUpdateMeta }) {
  return (
    <section className="panel">
      <h2>試合情報</h2>

      <div className="grid2">
        <div className="field">
          <label>日付</label>
          <input
            type="text"
            value={meta.date}
            onChange={(e) => onUpdateMeta("date", e.target.value)}
            placeholder="yyyy-mm-dd"
          />
        </div>

        <div className="field">
          <label>セット(R)</label>
          <input
            type="text"
            value={meta.r}
            onChange={(e) => onUpdateMeta("r", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Home</label>
          <input
            type="text"
            value={meta.home}
            onChange={(e) => onUpdateMeta("home", e.target.value)}
          />
        </div>

        <div className="field">
          <label>Away</label>
          <input
            type="text"
            value={meta.away}
            onChange={(e) => onUpdateMeta("away", e.target.value)}
          />
        </div>

        <div className="field">
          <label>前後半</label>
          <input
            type="text"
            value={meta.half}
            onChange={(e) => onUpdateMeta("half", e.target.value)}
          />
        </div>

        <div className="field">
          <label>サバチーム名</label>
          <input
            type="text"
            value={meta.survivorTeam}
            onChange={(e) => onUpdateMeta("survivorTeam", e.target.value)}
          />
        </div>

        <div className="field field-full">
          <label>ハンターチーム名</label>
          <input
            type="text"
            value={meta.hunterTeam}
            onChange={(e) => onUpdateMeta("hunterTeam", e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

export default MatchInfoPanel;