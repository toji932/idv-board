import React from "react";
import BoardCanvas from "./BoardCanvas";
import MetaBar from "./MetaBar";

const EMPTY_CIPHERS = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  value: "0",
  visible: false,
  x: 0.14 + 0.1 * i,
  y: 0.16,
}));

const STROKE_COLORS = [{ key: "#e11d48", label: "赤" }];
const noop = () => {};

function HiddenBoardExportRenderer({ exportRef, job }) {
  if (!job) {
    return <div className="bulk-hidden-export" aria-hidden="true" />;
  }

  const currentMapUrl = `/maps/${job.mapType}_${job.mapVariant}.png`;

  return (
    <div className="bulk-hidden-export" aria-hidden="true">
      <div ref={exportRef} className="export-area bulk-export-capture">
        <MetaBar meta={job.meta} mapType={job.mapType} mapVariant={job.mapVariant} />
        <BoardCanvas
          boardRef={null}
          mapType={job.mapType}
          currentMapUrl={currentMapUrl}
          activePhase={job.activePhase}
          draftStroke={null}
          cipherSlots={EMPTY_CIPHERS}
          selectedPieceId={null}
          selectedAnnotationId={null}
          strokeColors={STROKE_COLORS}
          onBoardPointerDown={noop}
          onBoardPointerMove={noop}
          onBoardPointerUp={noop}
          onClearBoardSelection={noop}
          onStartAnnotationDrag={noop}
          onStartPieceDrag={noop}
          onStartCipherDrag={noop}
          onSelectAnnotation={noop}
          onSelectPiece={noop}
          setDrawMode={noop}
        />
      </div>
    </div>
  );
}

export default HiddenBoardExportRenderer;
