import React from "react";
import { MAP_OPTIONS } from "../utils/mapData";

function MapPanel({
  mapType,
  setMapType,
  mapVariant,
  setMapVariant,
}) {
  return (
    <section className="panel">
      <h2>背景マップ</h2>

      <div className="field">
        <label>マップ</label>
        <select value={mapType} onChange={(e) => setMapType(e.target.value)}>
          {MAP_OPTIONS.map((map) => (
            <option key={map.key} value={map.key}>
              {map.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>組</label>
        <select
          value={mapVariant}
          onChange={(e) => setMapVariant(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              第{n}組
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}

export default MapPanel;