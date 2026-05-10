"use client";

import { useMemo } from "react";
import {
  NoResult,
  smallMutedText,
} from "@/features/editor/components/parts/editor-left-panel-common";
import type { EditorPageView } from "@/features/editor/selectors";

export function EditorLeftPagesPanel({
  pages,
  filter,
  onSelectPage,
}: {
  pages: EditorPageView[];
  filter: string;
  onSelectPage: (pageId: string) => void;
}) {
  const rows = useMemo(
    () =>
      pages.filter((page) =>
        matchesFilter(page, filter, [
          page.name,
          String(page.index),
          `${page.width}x${page.height}`,
          String(page.elementCount),
        ]),
      ),
    [filter, pages],
  );

  return (
    <div className="ef-page-list">
      {rows.map((page) => (
        <button
          key={page.id}
          className={["ef-page-card", page.active ? "is-active" : ""].join(" ")}
          type="button"
          onClick={() => onSelectPage(page.id)}
          title={page.name}
        >
          <span className="ef-page-preview" aria-hidden="true">
            <span className="ef-page-preview-fallback">
              <span>{page.index}</span>
            </span>
          </span>
          <span className="ef-page-meta">
            <span className="ef-page-number">{page.index}</span>
            <strong>{page.name}</strong>
            <span style={smallMutedText}>
              {page.width} × {page.height}
            </span>
            <span style={smallMutedText}>
              {page.elementCount} élément{page.elementCount > 1 ? "s" : ""}
            </span>
          </span>
        </button>
      ))}
      {rows.length === 0 ? <NoResult /> : null}
    </div>
  );
}

function matchesFilter<T>(
  _item: T,
  filter: string,
  candidates: Array<string | number | undefined | null>,
) {
  const needle = filter.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return candidates.some((candidate) =>
    String(candidate ?? "")
      .toLowerCase()
      .includes(needle),
  );
}
