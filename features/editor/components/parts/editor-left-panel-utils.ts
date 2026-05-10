import { useMemo, useState } from "react";

import type { EditorLayerView, EditorObjectView } from "@/features/editor/selectors";

export type SortDir = "asc" | "desc" | null;

export function matchesFilter<T>(
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

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
}

export function uniqueBy<T>(items: T[], keySelector: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keySelector(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function groupLayersByPage(layers: EditorLayerView[]) {
  return layers.reduce<Map<string, string[]>>((groups, layer) => {
    const current = groups.get(layer.pageId);
    if (current) {
      current.push(layer.id);
      return groups;
    }

    groups.set(layer.pageId, [layer.id]);
    return groups;
  }, new Map());
}

export type LayerObjectGroup = {
  id: string;
  label: string;
  objects: EditorObjectView[];
};

export function groupObjectsForLayer(objects: EditorObjectView[]) {
  const direct: EditorObjectView[] = [];
  const grouped = new Map<string, LayerObjectGroup>();

  objects.forEach((object) => {
    const groupId = object.groupId;

    if (!groupId) {
      direct.push(object);
      return;
    }

    const existing = grouped.get(groupId);
    if (existing) {
      existing.objects.push(object);
      return;
    }

    grouped.set(groupId, {
      id: groupId,
      label: `Groupe ${grouped.size + 1}`,
      objects: [object],
    });
  });

  return {
    direct,
    groups: [...grouped.values()],
  };
}

export function readObjectGroupedState(object: EditorObjectView) {
  return object.groupId ? "groupé" : "direct";
}

export function useSort<T extends Record<string, unknown>>(
  rows: T[],
  initialKey: keyof T & string,
) {
  const [sort, setSort] = useState<{ key: keyof T & string; dir: SortDir }>({
    key: initialKey,
    dir: "asc",
  });

  const sorted = useMemo(() => {
    const copy = [...rows];

    if (!sort.dir) {
      return copy;
    }

    copy.sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];

      if (typeof va === "number" && typeof vb === "number") {
        return sort.dir === "asc" ? va - vb : vb - va;
      }

      return String(va ?? "").localeCompare(String(vb ?? ""), "fr") * (sort.dir === "asc" ? 1 : -1);
    });

    return copy;
  }, [rows, sort]);

  const toggle = (key: keyof T & string) =>
    setSort((state) =>
      state.key === key
        ? { key, dir: state.dir === "asc" ? "desc" : state.dir === "desc" ? null : "asc" }
        : { key, dir: "asc" },
    );

  const dirOf = (key: keyof T & string) => (sort.key === key ? sort.dir : null);

  return { sorted, toggle, dirOf };
}
