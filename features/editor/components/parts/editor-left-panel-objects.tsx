"use client";

import { Eye, EyeOff, Lock, LockOpen } from "lucide-react";
import { useMemo } from "react";
import {
  Badge,
  IconGlyph,
  NoResult,
} from "@/features/editor/components/parts/editor-left-panel-common";
import { type EditorObjectView, filterEditorObjectsView } from "@/features/editor/selectors";

const DEFAULT_OBJECT_TYPE_COLOR = {
  bg: "rgba(148, 163, 184, 0.16)",
  fg: "#cbd5e1",
  border: "rgba(148, 163, 184, 0.32)",
};

const OBJECT_TYPE_COLORS: Record<string, typeof DEFAULT_OBJECT_TYPE_COLOR> = {
  text: {
    bg: "rgba(59, 130, 246, 0.16)",
    fg: "#93c5fd",
    border: "rgba(59, 130, 246, 0.34)",
  },
  image: {
    bg: "rgba(16, 185, 129, 0.16)",
    fg: "#6ee7b7",
    border: "rgba(16, 185, 129, 0.34)",
  },
  shape: {
    bg: "rgba(168, 85, 247, 0.16)",
    fg: "#d8b4fe",
    border: "rgba(168, 85, 247, 0.34)",
  },
  chart: {
    bg: "rgba(245, 158, 11, 0.16)",
    fg: "#fcd34d",
    border: "rgba(245, 158, 11, 0.34)",
  },
};

export function EditorLeftObjectsPanel({
  objects,
  filter,
  typeFilter,
  layerFilter,
  pageFilter,
  onSelectObject,
}: {
  objects: EditorObjectView[];
  filter: string;
  typeFilter: string;
  layerFilter: string;
  pageFilter: string;
  onSelectObject: (object: EditorObjectView) => void;
}) {
  const rows = useMemo(
    () =>
      filterEditorObjectsView(objects, {
        text: filter,
        type: typeFilter,
        layer: layerFilter,
        page: pageFilter,
      }),
    [filter, layerFilter, objects, pageFilter, typeFilter],
  );

  return (
    <div className="ef-object-list">
      {rows.map((object) => (
        <button
          key={object.id}
          className={["ef-object-row", object.selected ? "is-selected" : ""].join(" ")}
          type="button"
          onClick={() => onSelectObject(object)}
          title={object.name}
        >
          <span className="ef-object-main">
            <Badge
              value={object.type}
              colorSet={OBJECT_TYPE_COLORS[object.type] ?? DEFAULT_OBJECT_TYPE_COLOR}
              width={44}
            />
            <span className="ef-object-title">
              <strong>{object.name}</strong>
              <span>
                Pg {object.pageIndex}
                {object.layerNumber ? ` · Cq ${object.layerNumber}` : ""}
              </span>
            </span>
          </span>

          <span className="ef-object-state" aria-hidden="true">
            {object.visible ? (
              <IconGlyph icon={Eye} size={14} />
            ) : (
              <IconGlyph icon={EyeOff} size={14} />
            )}
            {object.locked ? (
              <IconGlyph icon={Lock} size={14} />
            ) : (
              <IconGlyph icon={LockOpen} size={14} />
            )}
          </span>
        </button>
      ))}

      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}
