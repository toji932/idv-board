import React from "react";

function pointsToSvg(points, w = 1000, h = 625) {
  if (!points || points.length === 0) return "";
  return points.map((p) => `${p.x * w},${p.y * h}`).join(" ");
}

function BoardCanvas({
  boardRef,
  mapType,
  currentMapUrl,
  activePhase,
  draftStroke,
  cipherSlots,
  selectedPieceId,
  selectedAnnotationId,
  strokeColors,
  onBoardPointerDown,
  onBoardPointerMove,
  onBoardPointerUp,
  onClearBoardSelection,
  onStartAnnotationDrag,
  onStartPieceDrag,
  onStartCipherDrag,
  onSelectAnnotation,
  onSelectPiece,
  setDrawMode,
}) {
  return (
    <div className="board-wrap">
      <div
        ref={boardRef}
        className={`board board-${mapType}`}
        style={{ backgroundImage: `url(${currentMapUrl})` }}
        onPointerDown={onBoardPointerDown}
        onPointerMove={onBoardPointerMove}
        onPointerUp={onBoardPointerUp}
        onPointerLeave={onBoardPointerUp}
        onClick={onClearBoardSelection}
      >
        <svg
          className="annotation-layer"
          viewBox="0 0 1000 625"
          preserveAspectRatio="none"
        >
        
          {activePhase?.annotations.map((ann) => {
            if (ann.type === "freehand") {
              const selected = selectedAnnotationId === ann.id;
              return (
                <g
                  key={ann.id}
                  onPointerDown={(e) => onStartAnnotationDrag(e, ann)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAnnotation(ann.id);
                  }}
                  style={{
                    cursor: "move",
                    color: ann.color || strokeColors[0].key,
                  }}
                >
                 <polyline
                    points={pointsToSvg(ann.points)}
                    fill="none"
                    stroke={ann.color || strokeColors[0].key}
                    strokeWidth={selected ? 7 : 5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                   />
                </g>
              );
            }

            if (ann.type === "text") {
              const selected = selectedAnnotationId === ann.id;
              return (
                <g
                  key={ann.id}
                  onPointerDown={(e) => onStartAnnotationDrag(e, ann)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAnnotation(ann.id);
                  }}
                  style={{ cursor: "move" }}
                >
                  <text
                    x={ann.x * 1000}
                    y={ann.y * 625}
                    fontSize="28"
                    fontWeight="700"
                    fill={selected ? "#7c2d12" : "#a16207"}
                    textAnchor="middle"
                  >
                    {ann.text}
                  </text>
                </g>
              );
            }

            return null;
          })}

           {draftStroke && (
             <g>
              <polyline
                 points={pointsToSvg(draftStroke.points)}
                 fill="none"
                 stroke={draftStroke.color}
                 strokeWidth="5"
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 opacity="0.85"
              />
             </g>
           )}
        </svg>

        <div className="cipher-board-layer">
  {cipherSlots.filter((slot) => slot.visible).map((slot) => (
    <div
      key={slot.id}
      className="cipher-map-box"
      style={{
        left: `${(slot.x ?? 0.2) * 100}%`,
        top: `${(slot.y ?? 0.2) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={(e) => onStartCipherDrag(e, slot)}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="cipher-map-value">{slot.value || "0"}</span>
    </div>
  ))}
</div>

        {activePhase?.pieces.map((piece) => {
          const selected = selectedPieceId === piece.id;
          return (
            <div
              key={piece.id}
              className={`piece ${selected ? "selected" : ""}`}
              style={{
                left: `${piece.x * 100}%`,
                top: `${piece.y * 100}%`,
              }}
              onPointerDown={(e) => onStartPieceDrag(e, piece)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPiece(piece.id);
                setDrawMode("select");
              }}
              title={piece.label}
            >
              <img
                className="piece-icon"
                src={piece.icon}
                alt={piece.name}
                draggable={false}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              <div className="piece-label">{piece.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BoardCanvas;