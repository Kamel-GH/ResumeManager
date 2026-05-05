import { describe, expect, it } from "vitest";

import { resolveBindings } from "@/features/editor/binding/binding-engine";
import { buildCanonicalRenderTree } from "@/features/editor/layout-engine/layout-engine";
import type { TemplateSchema } from "@/features/editor/schema/template-schema";

describe("editor render pipeline foundation", () => {
  it("builds a canonical render tree from the bound template document", () => {
    const template: TemplateSchema = {
      id: "template-1",
      name: "Resume template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 794,
          height: 1123,
          margin: {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40,
          },
        },
      ],
      elements: [
        {
          id: "element-1",
          pageId: "page-1",
          type: "text",
          frame: {
            x: 80,
            y: 96,
            width: 320,
            height: 48,
          },
          zIndex: 1,
          locked: false,
          visible: true,
          bindingId: "candidate.name",
        },
      ],
    };

    const boundDocument = resolveBindings({
      template,
      data: {
        "candidate.name": "Ada Lovelace",
      },
    });
    const renderTree = buildCanonicalRenderTree(boundDocument);

    expect(renderTree.templateId).toBe("template-1");
    expect(renderTree.pages).toHaveLength(1);
    expect(renderTree.pages[0]?.children).toHaveLength(1);
    expect(renderTree.pages[0]?.children[0]?.props.bindingId).toBe("candidate.name");
    expect(boundDocument.resolvedBindings["candidate.name"]).toBe("Ada Lovelace");
    expect(boundDocument.validation.valid).toBe(true);
  });

  it("reports missing bindings instead of silently accepting empty data", () => {
    const template: TemplateSchema = {
      id: "template-2",
      name: "Resume template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 794,
          height: 1123,
          margin: { top: 40, right: 40, bottom: 40, left: 40 },
        },
      ],
      elements: [
        {
          id: "element-1",
          pageId: "page-1",
          type: "text",
          frame: { x: 80, y: 96, width: 320, height: 48 },
          zIndex: 1,
          locked: false,
          visible: true,
          bindingId: "candidate.title",
        },
      ],
    };

    const boundDocument = resolveBindings({ template, data: {} });

    expect(boundDocument.validation.valid).toBe(false);
    expect(boundDocument.validation.errors[0]).toMatchObject({
      path: "bindings.candidate.title",
      message: 'Missing data for binding "candidate.title"',
    });
    expect(boundDocument.resolvedBindings["candidate.title"]).toBeNull();
  });

  it("projects canonical object order to render tree order without changing layer order", () => {
    const template: TemplateSchema = {
      id: "template-order",
      name: "Order template",
      version: 1,
      pages: [
        {
          id: "page-1",
          name: "Page 1",
          width: 400,
          height: 300,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      ],
      elements: [
        {
          id: "layer-b-back",
          pageId: "page-1",
          type: "shape",
          frame: { x: 0, y: 0, width: 20, height: 20 },
          zIndex: 1,
          locked: false,
          visible: true,
          props: { shape: "rect", layerId: "layer-b", layerOrder: 2 },
        },
        {
          id: "layer-a-front",
          pageId: "page-1",
          type: "shape",
          frame: { x: 0, y: 0, width: 20, height: 20 },
          zIndex: 10,
          locked: false,
          visible: true,
          props: { shape: "rect", layerId: "layer-a", layerOrder: 1 },
        },
        {
          id: "layer-a-back",
          pageId: "page-1",
          type: "shape",
          frame: { x: 0, y: 0, width: 20, height: 20 },
          zIndex: 1,
          locked: false,
          visible: true,
          props: { shape: "rect", layerId: "layer-a", layerOrder: 1 },
        },
      ],
    };

    const renderTree = buildCanonicalRenderTree(resolveBindings({ template, data: {} }));

    expect(renderTree.pages[0]?.children.map((node) => node.id)).toEqual(["layer-a-back", "layer-a-front", "layer-b-back"]);
  });
});
