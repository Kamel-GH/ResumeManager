import { describe, expect, it } from "vitest";

import {
  createCsvSource,
  createVariablesFromCsvSource,
  inferVariableType,
  parseCsvText,
  slugifyVariableKey,
} from "@/features/data-mapping/lib/csv";

describe("data mapping CSV helpers", () => {
  it("parses a CSV file with delimiter detection and typed variables", () => {
    const parsed = parseCsvText(`Nom;Age;Actif;Date
"Ada, Lovelace";36;oui;2024-03-01
"Bob";29;non;2023-02-15`);

    expect(parsed.delimiter).toBe(";");
    expect(parsed.columns).toEqual(["Nom", "Age", "Actif", "Date"]);
    expect(parsed.rows[0]).toEqual({
      Nom: "Ada, Lovelace",
      Age: "36",
      Actif: "oui",
      Date: "2024-03-01",
    });

    const source = createCsvSource({
      fileName: "people.csv",
      ...parsed,
    });
    const variables = createVariablesFromCsvSource(source);

    expect(variables).toMatchObject([
      { key: "nom", label: "Nom", sourceColumn: "Nom", type: "text", sampleValue: "Ada, Lovelace" },
      { key: "age", label: "Age", sourceColumn: "Age", type: "number", sampleValue: "36" },
      { key: "actif", label: "Actif", sourceColumn: "Actif", type: "boolean", sampleValue: "oui" },
      { key: "date", label: "Date", sourceColumn: "Date", type: "date", sampleValue: "2024-03-01" },
    ]);
  });

  it("normalizes duplicate and empty headers", () => {
    const parsed = parseCsvText(`,Titre,Titre,\n1,2,3,4`);

    expect(parsed.columns).toEqual(["Colonne 1", "Titre", "Titre (2)", "Colonne 4"]);
    expect(parsed.rows[0]).toEqual({
      "Colonne 1": "1",
      Titre: "2",
      "Titre (2)": "3",
      "Colonne 4": "4",
    });
  });

  it("infers variable types and stable slugs from sample values", () => {
    expect(inferVariableType(["oui", "non", "true"])).toBe("boolean");
    expect(inferVariableType(["3.14", "42"])).toBe("number");
    expect(inferVariableType(["2024-03-01", "2024-04-02"])).toBe("date");
    expect(slugifyVariableKey("Prénom de l'utilisateur", 3)).toBe("prenom_de_l_utilisateur");
    expect(slugifyVariableKey("!!!", 3)).toBe("variable_3");
  });
});
