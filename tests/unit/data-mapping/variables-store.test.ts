import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localStorageMock = createLocalStorageMock();
vi.stubGlobal("localStorage", localStorageMock);

const { parseCsvText } = await import("@/features/data-mapping/lib/csv");
const { useVariablesStore } = await import("@/features/data-mapping/stores/variables-store");

describe("variables store", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useVariablesStore.setState({
      source: null,
      variables: [],
      selectedVariableId: null,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
    useVariablesStore.setState({
      source: null,
      variables: [],
      selectedVariableId: null,
    });
  });

  it("imports a CSV source and derives variables from the headers", () => {
    useVariablesStore.getState().importCsvSource({
      fileName: "resume.csv",
      parsed: parseCsvText(`Nom;Ville
Ada;Paris
Grace;London`),
    });

    const state = useVariablesStore.getState();
    expect(state.source?.fileName).toBe("resume.csv");
    expect(state.source?.columns).toEqual(["Nom", "Ville"]);
    expect(state.variables.map((variable) => variable.label)).toEqual(["Nom", "Ville"]);
    expect(state.selectedVariableId).toBe(state.variables[0]?.id ?? null);
  });

  it("lets custom variables be added, selected and updated from the current source", () => {
    useVariablesStore.getState().importCsvSource({
      fileName: "resume.csv",
      parsed: parseCsvText(`Nom,Age\nAda,36`),
    });

    const addResult = useVariablesStore.getState().addVariable();
    const stateAfterAdd = useVariablesStore.getState();
    const lastVariable = stateAfterAdd.variables.at(-1);

    expect(addResult).toBeUndefined();
    expect(lastVariable?.label).toBe("Variable 3");
    expect(stateAfterAdd.selectedVariableId).toBe(lastVariable?.id ?? null);

    if (!lastVariable) {
      return;
    }

    useVariablesStore.getState().updateVariable(lastVariable.id, {
      sourceColumn: "Age",
      key: "age_personne",
      label: "Âge",
    });

    const updated = useVariablesStore
      .getState()
      .variables.find((variable) => variable.id === lastVariable.id);
    expect(updated).toMatchObject({
      key: "age_personne",
      label: "Âge",
      sourceColumn: "Age",
      sampleValue: "36",
    });

    useVariablesStore.getState().updateVariable(lastVariable.id, {
      sourceColumn: null,
    });

    expect(
      useVariablesStore.getState().variables.find((variable) => variable.id === lastVariable.id)
        ?.sampleValue,
    ).toBe("");
  });

  it("removes variables and keeps the selection on a surviving row", () => {
    useVariablesStore.getState().importCsvSource({
      fileName: "resume.csv",
      parsed: parseCsvText(`Nom,Age,Email\nAda,36,a@example.com`),
    });

    const state = useVariablesStore.getState();
    const removedId = state.variables[1]?.id;
    const expectedNextSelection = state.variables[2]?.id ?? state.variables[0]?.id ?? null;

    expect(removedId).toBeDefined();
    if (!removedId) {
      return;
    }

    useVariablesStore.getState().selectVariable(removedId);
    useVariablesStore.getState().removeVariable(removedId);

    const after = useVariablesStore.getState();
    expect(after.variables.some((variable) => variable.id === removedId)).toBe(false);
    expect(after.selectedVariableId).toBe(expectedNextSelection);
  });
});

function createLocalStorageMock() {
  const data = new Map<string, string>();

  return {
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    get length() {
      return data.size;
    },
  } as Storage;
}
