"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createCsvSource, createVariablesFromCsvSource, type ParsedCsv } from "@/features/data-mapping/lib/csv";
import type { CsvRow, CsvSource, MappingVariable, VariableType } from "@/features/data-mapping/types";

export type VariablesStoreState = {
  source: CsvSource | null;
  variables: MappingVariable[];
  selectedVariableId: string | null;
  importCsvSource: (input: { fileName: string; parsed: ParsedCsv }) => void;
  clearSource: () => void;
  selectVariable: (id: string | null) => void;
  addVariable: () => void;
  removeVariable: (id: string) => void;
  updateVariable: (id: string, patch: Partial<Pick<MappingVariable, "key" | "label" | "sourceColumn" | "type" | "enabled">>) => void;
};

type PersistedVariablesState = Pick<VariablesStoreState, "source" | "variables" | "selectedVariableId">;

const emptyState: PersistedVariablesState = {
  source: null,
  variables: [],
  selectedVariableId: null,
};

export const useVariablesStore = create<VariablesStoreState>()(
  persist(
    (set, get) => ({
      ...emptyState,
      importCsvSource: ({ fileName, parsed }) => {
        const source = createCsvSource({
          fileName,
          delimiter: parsed.delimiter,
          columns: parsed.columns,
          rows: parsed.rows,
        });
        const variables = createVariablesFromCsvSource(source);

        set({
          source,
          variables,
          selectedVariableId: variables[0]?.id ?? null,
        });
      },
      clearSource: () =>
        set({
          ...emptyState,
        }),
      selectVariable: (id) => set({ selectedVariableId: id }),
      addVariable: () => {
        const nextIndex = get().variables.length + 1;
        const nextVariable: MappingVariable = {
          id: nanoid(10),
          key: `variable_${nextIndex}`,
          label: `Variable ${nextIndex}`,
          sourceColumn: null,
          type: "text",
          enabled: true,
          sampleValue: "",
        };

        set((state) => ({
          variables: [...state.variables, nextVariable],
          selectedVariableId: nextVariable.id,
        }));
      },
      removeVariable: (id) =>
        set((state) => {
          const index = state.variables.findIndex((variable) => variable.id === id);
          if (index === -1) {
            return state;
          }

          const nextVariables = state.variables.filter((variable) => variable.id !== id);
          const nextSelectedId = state.selectedVariableId === id ? nextVariables[index]?.id ?? nextVariables[index - 1]?.id ?? null : state.selectedVariableId;
          return {
            variables: nextVariables,
            selectedVariableId: nextSelectedId,
          };
        }),
      updateVariable: (id, patch) =>
        set((state) => {
          const source = state.source;
          const nextVariables = state.variables.map((variable) => {
            if (variable.id !== id) {
              return variable;
            }

            const sourceColumn = patch.sourceColumn !== undefined ? patch.sourceColumn : variable.sourceColumn;
            const sampleValue = resolveVariableSampleValue(source, sourceColumn);
            return {
              ...variable,
              ...patch,
              sourceColumn,
              sampleValue,
            };
          });

          return {
            variables: nextVariables,
          };
        }),
    }),
    {
      name: "resume-manager:variables-source",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedVariablesState => ({
        source: state.source,
        variables: state.variables,
        selectedVariableId: state.selectedVariableId,
      }),
    },
  ),
);

function resolveVariableSampleValue(source: CsvSource | null, sourceColumn: string | null) {
  if (!source || !sourceColumn) {
    return "";
  }

  const sample = source.rows.find((row) => (row[sourceColumn] ?? "").trim().length > 0)?.[sourceColumn] ?? "";
  return sample.trim();
}

export type { CsvRow, VariableType, MappingVariable };
