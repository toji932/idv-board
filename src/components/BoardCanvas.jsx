import React from "react";

function BoardCanvas({
  boardRef,
  mapType,
  currentMapUrl,
  activePhase,
  draftArrow,
  cipherSlots,
  selectedPieceId,
  selectedAnnotationId,
  arrowColors,
  onBoardPointerDown,
  onBoardPointerMove,
  onBoardPointerUp,
  onClearBoardSelection,
  onStartAnnotationDrag,
  onStartPieceDrag,
  onSelectAnnotation,
  onSelectPiece,
  arrowPathD,
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
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 0, 12 5, 0 10" fill="currentColor" />
            </marker>
          </defs>

          {activePhase?.annotations.map((ann) => {
            if (ann.type === "arrow") {
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
                    color: ann.color || arrowColors[0].key,
                  }}
                >
                  <path
                    d={arrowPathD(ann)}
                    fill="none"
                    stroke={ann.color || arrowColors[0].key}
                    strokeWidth={selected ? 7 : 5}
                    strokeLinecap="round"
                    markerEnd="url(#arrowhead)"
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

          {draftArrow && (
            <g style={{ color: draftArrow.color }}>
              <path
                d={arrowPathD(draftArrow)}
                fill="none"
                stroke={draftArrow.color}
                strokeWidth="5"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
                opacity="0.85"
              />
            </g>
          )}
        </svg>

        <div className="cipher-board-layer">
          {cipherSlots
            .filter((slot) => slot.visible)
            .map((slot) => (
              <div key={slot.id} className="cipher-map-box">
                <span className="cipher-map-id">{slot.id}</span>
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