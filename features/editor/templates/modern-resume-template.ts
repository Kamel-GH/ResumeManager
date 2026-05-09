import {
  EDITOR_PAGE_HEIGHT_PX,
  EDITOR_PAGE_WIDTH_PX,
} from "@/features/editor/components/editor-layout-constants";
import type {
  TemplateElement,
  TemplateElementStyle,
  TemplateElementType,
  TemplateSchema,
} from "@/features/editor/schema/template-schema";
import type { Rect } from "@/features/editor/types";

const PAGE_ID = "page-1";
const PAGE_2_ID = "page-2";
const PAGE_3_ID = "page-3";

let zIndex = 0;

export const modernResumeTemplate: TemplateSchema = {
  id: "modern-resume-template",
  name: "Modern Resume Template",
  version: 1,
  pages: [
    {
      id: PAGE_ID,
      name: "Cover",
      width: EDITOR_PAGE_WIDTH_PX,
      height: EDITOR_PAGE_HEIGHT_PX,
      margin: { top: 28, right: 28, bottom: 28, left: 28 },
    },
    {
      id: PAGE_2_ID,
      name: "Profile & Experience",
      width: 760,
      height: 540,
      margin: { top: 32, right: 32, bottom: 32, left: 32 },
    },
    {
      id: PAGE_3_ID,
      name: "Formations & Skills",
      width: 620,
      height: 620,
      margin: { top: 24, right: 24, bottom: 24, left: 24 },
    },
  ],
  elements: [
    shape(
      "page-background",
      rect(0, 0, EDITOR_PAGE_WIDTH_PX, EDITOR_PAGE_HEIGHT_PX),
      { shape: "rect" },
      { fill: "#ffffff" },
    ),
    shape(
      "sidebar-background",
      rect(0, 0, 190, EDITOR_PAGE_HEIGHT_PX),
      { shape: "rect" },
      { fill: "#1f334b" },
    ),
    shape(
      "profile-frame",
      rect(44, 38, 112, 112),
      { shape: "circle" },
      { fill: "#d8d2c8", stroke: "#ffffff", strokeWidth: 4 },
    ),
    shape("profile-hair", rect(83, 60, 34, 34), { shape: "circle" }, { fill: "#2b1f1c" }),
    shape("profile-face", rect(78, 71, 44, 44), { shape: "circle" }, { fill: "#e6b99d" }),
    shape(
      "profile-body",
      rect(66, 112, 72, 54),
      { shape: "rect", cornerRadius: 36 },
      { fill: "#1f2937" },
    ),
    shape(
      "profile-mouth",
      rect(90, 86, 20, 4),
      { shape: "rect", cornerRadius: 2 },
      { fill: "#111827" },
    ),

    sidebarTitle("contact-title", 205, "CONTACT"),
    sidebarText("contact-phone", 242, "[Téléphone]"),
    sidebarText("contact-email", 268, "[Email]"),
    sidebarText("contact-city", 294, "Paris, France"),
    sidebarText("contact-linkedin", 320, "linkedin.com/in/[PrénomNom]"),

    sidebarTitle("skills-title", 378, "COMPÉTENCES"),
    skill("skill-photoshop", 414, "Photoshop", "90%", 118),
    skill("skill-illustrator", 442, "Illustrator", "85%", 110),
    skill("skill-indesign", 470, "InDesign", "80%", 104),
    skill("skill-figma", 498, "Figma", "90%", 118),
    skill("skill-html", 526, "HTML / CSS", "75%", 98),

    sidebarTitle("languages-title", 596, "LANGUES"),
    language("language-french", 632, "Français", 5),
    language("language-english", 662, "Anglais", 4),
    language("language-spanish", 692, "Espagnol", 3),

    text(
      "name-and-firstname",
      rect(250, 58, 390, 66),
      "[Prénom] [Nom]",
      {
        fontFamily: "Georgia",
        fontSize: 45,
        fontWeight: "bold",
        color: "#0d1b2a",
        lineHeight: 1.1,
      },
      { selectable: true },
    ),
    shape(
      "post-badge",
      rect(314, 128, 128, 36),
      { shape: "rect", cornerRadius: 0 },
      { fill: "#fff6df" },
    ),
    text("post-text", rect(314, 132, 128, 28), "[Poste]", {
      fontSize: 21,
      fontWeight: "bold",
      color: "#e0b54f",
      letterSpacing: 3,
      textAlign: "center",
    }),
    text(
      "summary",
      rect(268, 178, 330, 62),
      "Professionnel créatif et rigoureux avec plus de 8 ans d'expérience\ndans la conception graphique et la direction artistique.\nJ'aide les marques à raconter leur histoire avec impact.",
      { fontSize: 12, color: "#334155", lineHeight: 1.45, textAlign: "center" },
    ),

    mainSection("experience-title", 255, "EXPÉRIENCE PROFESSIONNELLE"),
    shape("experience-timeline", rect(250, 310, 1, 230), { shape: "rect" }, { fill: "#e4bf6a" }),
    timelineDot("experience-dot-1", 310),
    timelineDot("experience-dot-2", 418),
    timelineDot("experience-dot-3", 526),
    experience(
      "experience-1",
      300,
      "2021 -\nAujourd'hui",
      "Directeur Artistique",
      "Studio Graphik - Paris",
    ),
    experience("experience-2", 408, "2018 - 2021", "Designer Senior", "Agence Nova - Paris"),
    experience("experience-3", 516, "2015 - 2018", "Designer Graphique", "Com&Vous - Lyon"),
    shape(
      "repeater-card",
      rect(568, 345, 86, 108),
      { shape: "rect", cornerRadius: 0, dash: [4, 3] },
      { fill: "#ffffff", stroke: "#8b5cf6" },
    ),
    text("repeater-label", rect(568, 383, 86, 18), "Expérience", {
      fontSize: 12,
      color: "#334155",
      textAlign: "center",
    }),
    shape(
      "repeater-pill",
      rect(580, 405, 62, 22),
      { shape: "rect", cornerRadius: 3 },
      { fill: "#ede9fe" },
    ),
    text("repeater-pill-text", rect(580, 411, 62, 12), "LISTE RÉPÉTÉE", {
      fontSize: 10,
      fontWeight: "bold",
      color: "#6c5cff",
      textAlign: "center",
    }),

    mainSection("education-title", 622, "FORMATION"),
    education("education-1", 675, "2014", "Master Direction Artistique", "ECV Paris"),
    education("education-2", 720, "2012", "Licence Design Graphique", "Université Lumière Lyon 2"),
  ].flat(),
};

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

function element(
  type: TemplateElementType,
  id: string,
  frame: Rect,
  props: TemplateElement["props"],
  style?: TemplateElementStyle,
): TemplateElement {
  return {
    id,
    pageId: PAGE_ID,
    type,
    frame,
    zIndex: zIndex++,
    locked: false,
    visible: true,
    props,
    style,
  };
}

function shape(
  id: string,
  frame: Rect,
  props: TemplateElement["props"],
  style?: TemplateElementStyle,
): TemplateElement {
  return element("shape", id, frame, props, style);
}

function text(
  id: string,
  frame: Rect,
  value: string,
  style: TemplateElementStyle,
  props: TemplateElement["props"] = {},
): TemplateElement {
  return element("text", id, frame, { ...props, text: value }, style);
}

function sidebarTitle(id: string, y: number, value: string): TemplateElement {
  return text(id, rect(34, y, 130, 18), value, {
    fontSize: 11,
    fontWeight: "bold",
    color: "#d9b86f",
    letterSpacing: 2,
  });
}

function sidebarText(id: string, y: number, value: string): TemplateElement {
  return text(id, rect(52, y, 134, 16), value, { fontSize: 11, color: "#ffffff" });
}

function skill(
  id: string,
  y: number,
  label: string,
  value: string,
  progressWidth: number,
): TemplateElement[] {
  return [
    text(`${id}-label`, rect(52, y, 86, 14), label, { fontSize: 11, color: "#f8fafc" }),
    text(`${id}-value`, rect(138, y, 32, 14), value, {
      fontSize: 11,
      color: "#f8fafc",
      textAlign: "right",
    }),
    shape(
      `${id}-track`,
      rect(52, y + 21, 128, 5),
      { shape: "rect", cornerRadius: 3 },
      { fill: "#64748b" },
    ),
    shape(
      `${id}-fill`,
      rect(52, y + 21, progressWidth, 5),
      { shape: "rect", cornerRadius: 3 },
      { fill: "#d9b86f" },
    ),
  ];
}

function language(id: string, y: number, label: string, activeDots: number): TemplateElement[] {
  return [
    text(`${id}-label`, rect(52, y, 82, 14), label, { fontSize: 11, color: "#ffffff" }),
    ...Array.from({ length: 5 }).map((_, index) =>
      shape(
        `${id}-dot-${index + 1}`,
        rect(134 + index * 16, y + 2, 8, 8),
        { shape: "circle" },
        { fill: index < activeDots ? "#ffffff" : "#94a3b8" },
      ),
    ),
  ];
}

function mainSection(id: string, y: number, title: string): TemplateElement[] {
  return [
    text(`${id}-icon`, rect(250, y, 26, 20), "🎓", { fontSize: 15, color: "#0d1b2a" }),
    text(`${id}-text`, rect(284, y, 320, 20), title, {
      fontSize: 15,
      fontWeight: "bold",
      color: "#0d1b2a",
      letterSpacing: 2,
    }),
    shape(`${id}-line`, rect(250, y + 31, 380, 1), { shape: "rect" }, { fill: "#d9b86f" }),
  ];
}

function timelineDot(id: string, y: number): TemplateElement {
  return shape(id, rect(246, y, 8, 8), { shape: "circle" }, { fill: "#e4bf6a" });
}

function experience(
  id: string,
  y: number,
  year: string,
  title: string,
  company: string,
): TemplateElement[] {
  return [
    text(`${id}-year`, rect(272, y, 90, 36), year, {
      fontSize: 12,
      color: "#334155",
      lineHeight: 1.4,
    }),
    text(`${id}-title`, rect(414, y, 210, 18), title, {
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f172a",
    }),
    text(`${id}-company`, rect(414, y + 24, 210, 16), company, {
      fontSize: 12,
      fontWeight: 600,
      color: "#334155",
    }),
    shape(
      `${id}-line-1`,
      rect(414, y + 52, 250, 5),
      { shape: "rect", cornerRadius: 3 },
      { fill: "#cbd5e1" },
    ),
    shape(
      `${id}-line-2`,
      rect(414, y + 68, 210, 5),
      { shape: "rect", cornerRadius: 3 },
      { fill: "#cbd5e1" },
    ),
  ];
}

function education(
  id: string,
  y: number,
  year: string,
  title: string,
  school: string,
): TemplateElement[] {
  return [
    text(`${id}-year`, rect(272, y, 90, 16), year, { fontSize: 12, color: "#334155" }),
    text(`${id}-title`, rect(414, y, 220, 18), title, {
      fontSize: 14,
      fontWeight: "bold",
      color: "#0f172a",
    }),
    text(`${id}-school`, rect(414, y + 24, 220, 16), school, { fontSize: 12, color: "#334155" }),
  ];
}
