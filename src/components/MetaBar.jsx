import React from "react";
import { getMapLabel } from "../utils/mapData";

function MetaBar({ meta, mapType, mapVariant }) {
  return (
    <div className="meta-bar">
      <span>{meta.date || "日付未入力"}</span>
      <span>
        {meta.home || "Home"} vs {meta.away || "Away"}
      </span>
      <span>R: {meta.r || "-"}</span>
      <span>{meta.half || "前後半未入力"}</span>
      <span>サバ: {meta.survivorTeam || "-"}</span>
      <span>ハンター: {meta.hunterTeam || "-"}</span>
      <span>
       {getMapLabel(mapType)} / 第{mapVariant}組
      </span>
    </div>
  );
}

export default MetaBar;