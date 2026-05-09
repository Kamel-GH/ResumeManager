export type EditorVariableType = "TEXTE" | "IMAGE" | "LISTE" | "TABLE";
export type EditorPresetType =
  | "EXPERIENCES"
  | "FORMATIONS"
  | "LANGUES"
  | "COMPETENCES"
  | "INTERETS";
export type EditorObjectType =
  | "text"
  | "image"
  | "shape"
  | "chart"
  | "variable"
  | "preset"
  | "group";
export type EditorPageOrientation = "portrait" | "landscape" | "square" | "custom";

export type EditorVariableMock = {
  id: string;
  label: string;
  token: string;
  type: EditorVariableType;
  mappedPath: string;
  required: boolean;
  sampleValue: string;
};

export type EditorPresetMock = {
  id: string;
  label: string;
  token: string;
  type: EditorPresetType;
  mappedPath: string;
  repeatable: true;
  sampleItemsCount: number;
  description: string;
};

export type EditorImageMock = {
  id: string;
  name: string;
  category: string;
  src: string;
  width: number;
  height: number;
  tags: string[];
  favorite: boolean;
  createdAt: string;
};

export type EditorTextBlockMock = {
  id: string;
  name: string;
  category: string;
  preview: string;
  tags: string[];
  html: string;
  favorite: boolean;
};

export type EditorShapeMock = {
  id: string;
  name: string;
  category: string;
  type: string;
  svg: string;
  tags: string[];
  fillMode: "transparent" | "opaque" | "color" | "mono";
  favorite: boolean;
};

export type EditorIconMock = {
  id: string;
  name: string;
  category: string;
  variant: "color" | "mono";
  svg?: string;
  iconName?: string;
  tags: string[];
  favorite: boolean;
};

export type EditorEmojiMock = {
  id: string;
  emoji: string;
  name: string;
  category: string;
  tags: string[];
};

export type EditorLayerMock = {
  id: string;
  number: number;
  name: string;
  page: number;
  visible: boolean;
  locked: boolean;
  active: boolean;
  objectIds: string[];
};

export type EditorObjectMock = {
  id: string;
  type: EditorObjectType;
  name: string;
  page: number;
  layerNumber: number;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EditorPageMock = {
  id: string;
  number: number;
  name: string;
  width: number;
  height: number;
  orientation: EditorPageOrientation;
  previewSvg: string;
  active: boolean;
};

const variableSeeds: Omit<EditorVariableMock, "id">[] = [
  ["Prénom", "[Prénom]", "TEXTE", "candidate.firstName", true, "Lucas"],
  ["Nom", "[Nom]", "TEXTE", "candidate.lastName", true, "Dupont"],
  ["Photo", "[Photo]", "IMAGE", "candidate.photo", false, "portrait-lucas.jpg"],
  ["Email", "[Email]", "TEXTE", "candidate.email", true, "lucas.dupont@email.fr"],
  ["Téléphone", "[Téléphone]", "TEXTE", "candidate.phone", true, "+33 6 18 42 77 10"],
  ["Ville", "[Ville]", "TEXTE", "candidate.city", false, "Paris"],
  ["Adresse", "[Adresse]", "TEXTE", "candidate.address", false, "14 rue des Archives"],
  ["Code postal", "[CodePostal]", "TEXTE", "candidate.postalCode", false, "75003"],
  ["Pays", "[Pays]", "TEXTE", "candidate.country", false, "France"],
  ["Poste", "[Poste]", "TEXTE", "candidate.jobTitle", true, "Directeur Artistique"],
  [
    "Profil",
    "[Profil]",
    "TEXTE",
    "candidate.summary",
    true,
    "Créatif rigoureux avec 8 ans d'expérience.",
  ],
  [
    "LinkedIn",
    "[LinkedIn]",
    "TEXTE",
    "candidate.links.linkedin",
    false,
    "linkedin.com/in/lucasdupont",
  ],
  ["Portfolio", "[Portfolio]", "TEXTE", "candidate.links.portfolio", false, "lucasdupont.studio"],
  ["Site web", "[SiteWeb]", "TEXTE", "candidate.links.website", false, "lucasdupont.fr"],
  ["Date de naissance", "[DateNaissance]", "TEXTE", "candidate.birthDate", false, "12/04/1992"],
  ["Nationalité", "[Nationalité]", "TEXTE", "candidate.nationality", false, "Française"],
  ["Permis", "[Permis]", "TEXTE", "candidate.drivingLicense", false, "Permis B"],
  ["Disponibilité", "[Disponibilité]", "TEXTE", "candidate.availability", false, "Préavis 1 mois"],
  ["Salaire souhaité", "[SalaireSouhaité]", "TEXTE", "candidate.expectedSalary", false, "48 k€"],
  ["Expériences", "[Expériences]", "LISTE", "candidate.experiences", true, "3 expériences"],
  ["Formations", "[Formations]", "LISTE", "candidate.education", true, "2 formations"],
  ["Compétences", "[Compétences]", "LISTE", "candidate.skills", true, "5 compétences"],
  ["Langues", "[Langues]", "TABLE", "candidate.languages", false, "Français, Anglais, Espagnol"],
  [
    "Certifications",
    "[Certifications]",
    "LISTE",
    "candidate.certifications",
    false,
    "Google UX Design",
  ],
  ["Intérêts", "[Intérêts]", "LISTE", "candidate.interests", false, "Photo, gastronomie"],
  ["Références", "[Références]", "LISTE", "candidate.references", false, "2 références"],
  ["Soft skills", "[SoftSkills]", "LISTE", "candidate.softSkills", false, "Leadership, écoute"],
  ["Outils", "[Outils]", "LISTE", "candidate.tools", false, "Figma, InDesign"],
  ["Secteur", "[Secteur]", "TEXTE", "candidate.industry", false, "Design & branding"],
  [
    "Résumé court",
    "[RésuméCourt]",
    "TEXTE",
    "candidate.shortSummary",
    false,
    "Designer orienté marque.",
  ],
  [
    "Accroche",
    "[Accroche]",
    "TEXTE",
    "candidate.tagline",
    false,
    "Créer des identités mémorables.",
  ],
  [
    "Photo couverture",
    "[PhotoCouverture]",
    "IMAGE",
    "candidate.coverImage",
    false,
    "cover-branding.jpg",
  ],
  ["Logo entreprise", "[LogoEntreprise]", "IMAGE", "company.logo", false, "studio-graphik.svg"],
  ["Nom entreprise", "[Entreprise]", "TEXTE", "company.name", false, "Studio Graphik"],
  [
    "Mission actuelle",
    "[MissionActuelle]",
    "TEXTE",
    "candidate.currentMission",
    false,
    "Refonte identité premium",
  ],
  [
    "Projet clé",
    "[ProjetClé]",
    "TEXTE",
    "candidate.featuredProject",
    false,
    "Campagne Maison Rivage",
  ],
  ["Prix", "[Prix]", "LISTE", "candidate.awards", false, "2 prix design"],
  ["Publications", "[Publications]", "LISTE", "candidate.publications", false, "3 articles"],
  ["Disponibilité voyage", "[Mobilité]", "TEXTE", "candidate.mobility", false, "France et Europe"],
  ["QR Code", "[QRCode]", "IMAGE", "candidate.qrCode", false, "qr-portfolio.svg"],
].map(
  ([label, token, type, mappedPath, required, sampleValue]) =>
    ({ label, token, type, mappedPath, required, sampleValue }) as Omit<EditorVariableMock, "id">,
);

export const variables: EditorVariableMock[] = variableSeeds.map((variable, index) => ({
  id: `var-${String(index + 1).padStart(2, "0")}`,
  ...variable,
}));

const presetSeeds: Omit<EditorPresetMock, "id" | "repeatable">[] = [
  [
    "Expérience senior",
    "{experience_senior}",
    "EXPERIENCES",
    "candidate.experiences",
    3,
    "Poste, entreprise, période et réalisations senior.",
  ],
  [
    "Expérience junior",
    "{experience_junior}",
    "EXPERIENCES",
    "candidate.experiences",
    2,
    "Bloc compact pour débuts de carrière.",
  ],
  [
    "Expérience freelance",
    "{experience_freelance}",
    "EXPERIENCES",
    "candidate.freelanceMissions",
    4,
    "Missions indépendantes avec clients et livrables.",
  ],
  [
    "Expérience management",
    "{experience_management}",
    "EXPERIENCES",
    "candidate.managementExperience",
    3,
    "Encadrement, équipe et périmètre.",
  ],
  [
    "Stage",
    "{experience_stage}",
    "EXPERIENCES",
    "candidate.internships",
    2,
    "Expériences stage et alternance.",
  ],
  [
    "Formation école",
    "{formation_ecole}",
    "FORMATIONS",
    "candidate.education",
    2,
    "École, diplôme, ville et année.",
  ],
  [
    "Formation licence",
    "{formation_licence}",
    "FORMATIONS",
    "candidate.education",
    1,
    "Cursus universitaire licence.",
  ],
  [
    "Formation master",
    "{formation_master}",
    "FORMATIONS",
    "candidate.education",
    1,
    "Cursus master détaillé.",
  ],
  [
    "Formation MOOC",
    "{formation_mooc}",
    "FORMATIONS",
    "candidate.onlineCourses",
    5,
    "Cours en ligne et certifications.",
  ],
  [
    "Formation BTS",
    "{formation_bts}",
    "FORMATIONS",
    "candidate.education",
    1,
    "Bloc court formation BTS.",
  ],
  [
    "Langues niveau",
    "{langues_niveau}",
    "LANGUES",
    "candidate.languages",
    3,
    "Langue, niveau CECRL et score.",
  ],
  [
    "Langues pastilles",
    "{langues_pastilles}",
    "LANGUES",
    "candidate.languages",
    3,
    "Niveaux visuels par points.",
  ],
  [
    "Compétences barres",
    "{competences_barres}",
    "COMPETENCES",
    "candidate.skills",
    6,
    "Compétences avec jauges horizontales.",
  ],
  [
    "Compétences tags",
    "{competences_tags}",
    "COMPETENCES",
    "candidate.skills",
    10,
    "Nuage de tags catégorisés.",
  ],
  [
    "Compétences outils",
    "{competences_outils}",
    "COMPETENCES",
    "candidate.tools",
    8,
    "Outils métier avec niveau.",
  ],
  [
    "Intérêts simples",
    "{interets_simples}",
    "INTERETS",
    "candidate.interests",
    5,
    "Liste courte de centres d'intérêt.",
  ],
  [
    "Intérêts icônes",
    "{interets_icones}",
    "INTERETS",
    "candidate.interests",
    5,
    "Centres d'intérêt accompagnés d'icônes.",
  ],
  [
    "Certifications",
    "{certifications}",
    "COMPETENCES",
    "candidate.certifications",
    4,
    "Certifications professionnelles.",
  ],
  [
    "Références",
    "{references}",
    "EXPERIENCES",
    "candidate.references",
    2,
    "Contacts de référence anonymisés.",
  ],
  [
    "Portfolio projets",
    "{portfolio_projets}",
    "EXPERIENCES",
    "candidate.projects",
    6,
    "Projets sélectionnés avec résultats.",
  ],
].map(
  ([label, token, type, mappedPath, sampleItemsCount, description]) =>
    ({
      label,
      token,
      type,
      mappedPath,
      sampleItemsCount,
      description,
    }) as Omit<EditorPresetMock, "id" | "repeatable">,
);

export const presets: EditorPresetMock[] = presetSeeds.map((preset, index) => ({
  id: `preset-${String(index + 1).padStart(2, "0")}`,
  repeatable: true,
  ...preset,
}));

const imageCategories = [
  "Portrait",
  "Pâtisserie",
  "Cuisine",
  "Cocktails",
  "Restaurant",
  "Hospitality",
  "Logo",
  "Texture",
  "Produit food",
  "Fond",
] as const;
const imageNames = [
  "Portrait consultant",
  "Portrait chef",
  "Portrait designer",
  "Portrait manager",
  "Portrait sommelier",
  "Portrait hôtelier",
  "Éclair vanille",
  "Tarte citron",
  "Croissant doré",
  "Macaron framboise",
  "Pain signature",
  "Entremets chocolat",
  "Cuisine ouverte",
  "Planche ingrédients",
  "Dressage assiette",
  "Marché frais",
  "Ustensiles cuivre",
  "Table chef",
  "Cocktail ambré",
  "Bar speakeasy",
  "Verre martini",
  "Mocktail agrumes",
  "Comptoir lumineux",
  "Bouteilles premium",
  "Salle bistrot",
  "Table dressée",
  "Terrasse urbaine",
  "Menu dégustation",
  "Banquette velours",
  "Service midi",
  "Suite boutique",
  "Lobby calme",
  "Chambre terrasse",
  "Spa minéral",
  "Réception hôtel",
  "Couloir design",
  "Logo Maison Rivage",
  "Logo Atelier Nori",
  "Logo Hôtel Alma",
  "Logo Boulangerie Or",
  "Logo Studio Luma",
  "Logo Café Nord",
  "Papier grain fin",
  "Marbre clair",
  "Lin naturel",
  "Bois sombre",
  "Béton doux",
  "Dégradé brume",
  "Packaging café",
  "Boîte pâtisserie",
  "Bouteille tonic",
  "Pot confiture",
  "Tablette chocolat",
  "Huile artisanale",
  "Fond éditorial",
  "Fond portrait",
  "Fond restaurant",
  "Fond événement",
  "Fond social",
  "Fond brochure",
];
const imageSizes = [
  [1200, 1200],
  [900, 1200],
  [1600, 1067],
  [2000, 1333],
  [1080, 1350],
  [1440, 960],
];

function logoDataUri(name: string, index: number): string {
  const initials = name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const hue = (index * 43) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" rx="160" fill="hsl(${hue} 70% 42%)"/><circle cx="600" cy="510" r="190" fill="white" opacity=".18"/><text x="600" y="650" text-anchor="middle" font-family="Inter,Arial" font-size="220" font-weight="800" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const images: EditorImageMock[] = imageNames.map((name, index) => {
  const category = imageCategories[Math.floor(index / 6)] ?? "Fond";
  const [width, height] = imageSizes[index % imageSizes.length] ?? [1200, 1200];
  const src =
    category === "Logo"
      ? logoDataUri(name, index)
      : `https://picsum.photos/seed/resume-${index + 11}/${width}/${height}`;

  return {
    id: `image-${String(index + 1).padStart(2, "0")}`,
    name,
    category,
    src,
    width,
    height,
    tags: [
      category.toLowerCase(),
      name.toLowerCase().split(" ")[0] ?? "asset",
      width === height ? "carré" : width > height ? "paysage" : "portrait",
    ],
    favorite: index % 7 === 0,
    createdAt: `2026-04-${String((index % 24) + 1).padStart(2, "0")}`,
  };
});

const textBlockSeeds = [
  [
    "Titre éditorial",
    "Texte",
    "Titre<br><span>Sous-titre élégant</span>",
    "<h1>Titre</h1><p>Sous-titre élégant</p>",
  ],
  [
    "Paragraphe classique",
    "Texte",
    "Lignes de texte",
    "<p>Paragraphe sobre pour contenu éditorial.</p>",
  ],
  ["Headline impact", "Texte Design", "HEADLINE", "<h2>HEADLINE</h2>"],
  [
    "En-tête 3 lignes",
    "Texte",
    "01 — CHAPITRE<br>En-tête",
    "<header><small>01 — CHAPITRE</small><h2>En-tête</h2></header>",
  ],
  [
    "Nom + rôle",
    "Texte",
    "Jane Doe<br>DESIGNER",
    "<strong>Jane Doe</strong><small>DESIGNER</small>",
  ],
  ["Mot contour", "Effets", "BIG", "<h2 class='outline'>BIG</h2>"],
  [
    "Mix fonts script",
    "Texte Design",
    "The future<br>is now",
    "<p>The <em>future</em><br/>is now</p>",
  ],
  [
    "Lettre capitale drop",
    "Texte Design",
    "A + paragraphe",
    "<p><strong>A</strong>ccroche avec lettrine.</p>",
  ],
  [
    "Mono tag uppercase",
    "Texte Design",
    "TAG/01<br>Section title",
    "<p><code>TAG/01</code></p><h3>Section title</h3>",
  ],
  ["Texte vertical", "Effets", "VERTICAL", "<p class='vertical'>VERTICAL</p>"],
  ["Gradient word", "Effets", "GRADIENT", "<h2>GRADIENT</h2>"],
  ["Surligné", "Effets", "surligné", "<mark>surligné</mark><p>Texte associé.</p>"],
  ["Ombre portée", "Effets", "OMBRE", "<h2 class='shadow'>OMBRE</h2>"],
  ["Stroke + fill", "Effets", "STROKE", "<h2 class='stroke'>STROKE</h2>"],
  [
    "Citation guillemets",
    "Citations",
    "Less but better",
    "<blockquote>Less but better</blockquote>",
  ],
  [
    "Citation barre latérale",
    "Citations",
    "Citation",
    "<blockquote class='side'>Citation inspirante.</blockquote>",
  ],
  [
    "Pull quote centré",
    "Citations",
    "Phrase clé",
    "<blockquote>Phrase clé mise en avant.</blockquote>",
  ],
  [
    "Callout conseil",
    "Callout",
    "Conseil",
    "<aside><strong>Conseil</strong><p>À retenir.</p></aside>",
  ],
  ["Note discrète", "Note", "Note", "<p><strong>Note</strong> Information complémentaire.</p>"],
  ["Mention légale", "Mention", "Mention légale", "<small>Document confidentiel.</small>"],
  ["Signature manuscrite", "Signature", "Signature", "<p><em>Lucas Dupont</em></p>"],
  ["Slogan court", "Texte Design", "Créer mieux", "<h3>Créer mieux</h3>"],
  ["Introduction", "Texte", "Introduction", "<p>Introduction synthétique au document.</p>"],
  ["Accroche CV", "Texte", "Profil créatif", "<p>Profil créatif et orienté impact.</p>"],
  ["Encadré éditorial", "Callout", "Encadré", "<aside>Encadré éditorial structuré.</aside>"],
  ["Checklist", "Listes", "☑ ☑ ☑", "<ul><li>Point clé</li><li>Point clé</li></ul>"],
  ["Liste à puces", "Listes", "• • •", "<ul><li>Argument</li><li>Argument</li></ul>"],
  ["Liste numérotée", "Listes", "1 2 3", "<ol><li>Étape</li><li>Étape</li></ol>"],
  [
    "Liste 2 colonnes",
    "Listes",
    "Deux colonnes",
    "<div class='columns'>Liste en deux colonnes</div>",
  ],
  [
    "Cartouche contact",
    "Texte",
    "Contact",
    "<section><strong>Contact</strong><p>Email · Téléphone</p></section>",
  ],
];

export const textBlocks: EditorTextBlockMock[] = textBlockSeeds.map(
  ([name, category, preview, html], index) => ({
    id: `text-block-${String(index + 1).padStart(2, "0")}`,
    name,
    category,
    preview,
    html,
    tags: [category.toLowerCase(), name.toLowerCase().split(" ")[0] ?? "texte"],
    favorite: index % 6 === 0,
  }),
);

function shapeSvg(label: string, index: number, kind: string): string {
  const hue = (index * 31) % 360;
  const stroke = index % 3 === 0 ? "#111827" : `hsl(${hue} 70% 48%)`;
  const fill = index % 4 === 0 ? "transparent" : `hsl(${hue} 72% 88%)`;
  const body =
    kind === "circle"
      ? `<circle cx="50" cy="50" r="30" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`
      : kind === "arrow"
        ? `<path d="M18 52h54M56 34l18 18-18 18" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`
        : kind === "chart"
          ? `<path d="M18 78V56M38 78V38M58 78V46M78 78V24" stroke="${stroke}" stroke-width="9" stroke-linecap="round"/><path d="M12 82h76" stroke="#111827" stroke-width="4"/>`
          : kind === "badge"
            ? `<rect x="14" y="28" width="72" height="44" rx="22" fill="${fill}" stroke="${stroke}" stroke-width="5"/><text x="50" y="57" text-anchor="middle" font-family="Inter,Arial" font-size="16" font-weight="800" fill="${stroke}">${label.slice(0, 3).toUpperCase()}</text>`
            : `<rect x="18" y="24" width="64" height="52" rx="${index % 2 ? 4 : 18}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
}

const shapeKinds = [
  "circle",
  "rect",
  "line",
  "arrow",
  "bubble",
  "badge",
  "separator",
  "diagram",
  "chart",
  "transparent",
] as const;
export const shapes: EditorShapeMock[] = Array.from({ length: 40 }).map((_, index) => {
  const type = shapeKinds[index % shapeKinds.length] ?? "rect";
  const category =
    ["Formes", "Graphiques", "Badges", "Séparateurs", "Diagrammes"][index % 5] ?? "Formes";
  const fillMode = (["transparent", "opaque", "color", "mono"] as const)[index % 4] ?? "color";
  const name = `${category} ${String(index + 1).padStart(2, "0")}`;

  return {
    id: `shape-${String(index + 1).padStart(2, "0")}`,
    name,
    category,
    type,
    svg: shapeSvg(name, index, type),
    tags: [category.toLowerCase(), type, fillMode],
    fillMode,
    favorite: index % 8 === 0,
  };
});

const iconCategories = [
  "user",
  "mail",
  "phone",
  "location",
  "calendar",
  "education",
  "work",
  "skills",
  "language",
  "award",
  "link",
  "social",
  "food",
  "hotel",
  "bar",
  "restaurant",
];
const iconNames = [
  "home",
  "search",
  "settings",
  "favorite",
  "star",
  "bookmark",
  "share",
  "download",
  "upload",
  "edit",
  "delete",
  "add",
  "minus",
  "check",
  "close",
  "menu",
  "more",
  "info",
  "warning",
  "error",
  "mail",
  "phone",
  "location",
  "calendar",
  "clock",
  "briefcase",
  "graduation",
  "user",
  "group",
  "lock",
  "chef",
  "cake",
  "coffee",
  "wine",
  "cocktail",
  "hotel",
  "bed",
  "restaurant",
  "menu-card",
  "award",
  "linkedin",
  "website",
  "language",
  "skills",
  "chart",
  "image",
  "document",
  "tag",
  "filter",
  "grid",
];

function iconSvg(name: string, index: number, variant: "mono" | "color"): string {
  const accent = index % 2 === 0 ? "#f2ad37" : "#67e8f9";
  const secondary = index % 3 === 0 ? "#111827" : accent;
  const stroke = variant === "mono" ? "#111827" : secondary;
  const fill = variant === "mono" ? "#eef0f4" : "#f3f4f6";
  const line = (d: string, width = 5) =>
    `<path d="${d}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const bodies: Record<string, string> = {
    home: `${line("M16 32l16-14 16 14")}${line("M20 30v18h24V30")}${line("M28 48V38h8v10")}`,
    search: `${line("M27 42c8 0 15-7 15-15s-7-15-15-15-15 7-15 15 7 15 15 15Z", 4)}${line("M39 39 50 50")}`,
    settings: `${line("M32 18v6")}${line("M32 40v6")}${line("M18 32h6")}${line("M40 32h6")}${line("M23 23l4 4")}${line("M37 37l4 4")}${line("M41 23l-4 4")}${line("M27 37l-4 4")}${`<circle cx="32" cy="32" r="8" stroke="${stroke}" stroke-width="4" fill="${fill}"/>`}`,
    favorite: `<path d="M32 48 18 34c-4-4-5-10-2-15 4-6 12-7 16-2 4-5 12-4 16 2 3 5 2 11-2 15L32 48Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    star: `<path d="m32 14 5.8 11.8 13 .9-10 8.4 3.2 12.6L32 40l-12 7.7 3.2-12.6-10-8.4 13-.9L32 14Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    bookmark: `<path d="M22 14h20a2 2 0 0 1 2 2v34l-12-8-12 8V16a2 2 0 0 1 2-2Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    share: `${line("M40 18 24 28")}${line("M40 46 24 36")}${line("M24 28a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm16-10a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 28a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z", 4)}`,
    download: `${line("M32 14v20")}${line("M24 28 32 36 40 28")}${line("M18 44h28")}`,
    upload: `${line("M32 42V22")}${line("M24 30 32 22 40 30")}${line("M18 44h28")}`,
    edit: `${line("M18 42h12")}${line("M24 36 42 18l4 4-18 18-6 2 2-6Z")}`,
    delete: `${line("M20 22h24")}${line("M26 22v-4h12v4")}${line("M22 22l2 24h16l2-24")}${line("M28 28v10")}${line("M36 28v10")}`,
    add: `${line("M32 18v28")}${line("M18 32h28")}`,
    minus: `${line("M18 32h28")}`,
    check: `${line("M18 33 27 42 46 22")}`,
    close: `${line("M20 20 44 44")}${line("M44 20 20 44")}`,
    menu: `${line("M18 22h28")}${line("M18 32h28")}${line("M18 42h28")}`,
    more: `<circle cx="32" cy="20" r="3.5" fill="${stroke}"/><circle cx="32" cy="32" r="3.5" fill="${stroke}"/><circle cx="32" cy="44" r="3.5" fill="${stroke}"/>`,
    info: `${line("M32 22v4")}${line("M32 30v14")}${`<circle cx="32" cy="32" r="16" stroke="${stroke}" stroke-width="4" fill="none"/>`}`,
    warning: `<path d="M32 16 50 46H14L32 16Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>${line("M32 26v10")}${line("M32 40v2", 4)}`,
    error: `${line("M20 20 44 44")}${line("M44 20 20 44")}${`<circle cx="32" cy="32" r="16" stroke="${stroke}" stroke-width="4" fill="none"/>`}`,
    mail: `<path d="M18 22h28a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H18a2 2 0 0 1-2-2V24a2 2 0 0 1 2-2Z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="m18 24 14 12 14-12" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    phone: `${line("M20 18c4 12 14 22 26 26l4-6-8-8-6 4c-6-4-10-8-14-14l4-6-8-8-6 4Z", 4)}`,
    location: `<path d="M32 50s14-12 14-24a14 14 0 1 0-28 0c0 12 14 24 14 24Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><circle cx="32" cy="26" r="5" fill="${stroke}"/>`,
    calendar: `<rect x="16" y="18" width="32" height="28" rx="4" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M16 28h32M24 14v8M40 14v8" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    clock: `<circle cx="32" cy="32" r="16" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M32 22v12l8 5" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    briefcase: `<path d="M20 24h24a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V26a2 2 0 0 1 2-2Z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M26 24v-4h12v4M18 32h28" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    graduation: `<path d="m14 28 18-10 18 10-18 10-18-10Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><path d="M20 31v8c0 4 5 7 12 7s12-3 12-7v-8" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    user: `<circle cx="32" cy="24" r="8" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M18 48c2-8 8-12 14-12s12 4 14 12" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    group: `<circle cx="24" cy="26" r="6" fill="none" stroke="${stroke}" stroke-width="4"/><circle cx="40" cy="26" r="6" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M14 46c2-6 6-9 10-9s8 3 10 9M30 46c2-6 6-9 10-9s8 3 10 9" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    lock: `<rect x="20" y="28" width="24" height="22" rx="4" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M24 28v-4a8 8 0 0 1 16 0v4" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    chef: `<path d="M20 30c0-6 5-10 12-10s12 4 12 10c0 3-1 5-3 7v11H23V37c-2-2-3-4-3-7Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><path d="M23 42h18" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    cake: `<path d="M18 36h28v10H18z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M24 36V26c0-3 2-6 8-6s8 3 8 6v10" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    coffee: `<path d="M18 26h22v12c0 6-4 10-11 10S18 44 18 38V26Z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M40 28h4a6 6 0 0 1 0 12h-4" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/><path d="M24 20c0 2-2 3-2 5s2 3 2 5M30 18c0 2-2 3-2 5s2 3 2 5" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round"/>`,
    wine: `<path d="M22 18h20v8c0 6-4 10-10 10s-10-4-10-10v-8Z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M32 36v10M24 46h16" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    cocktail: `<path d="M18 18h28L32 34 18 18Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><path d="M32 34v12M26 46h12" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    hotel: `<rect x="18" y="18" width="28" height="28" rx="4" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M26 46v-8h12v8M22 26h4M30 26h4M38 26h4M22 32h4M30 32h4M38 32h4" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    bed: `<path d="M18 38h28v10H18z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M18 30h8a6 6 0 0 1 6 6v2H18v-8Z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M18 48v-10M46 48v-10" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    restaurant: `<path d="M20 18v14M24 18v14M20 26h4M30 18v28M38 20c4 0 8 3 8 8v18" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    "menu-card": `<rect x="16" y="18" width="32" height="28" rx="4" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M22 26h20M22 32h20M22 38h14" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    award: `<path d="M24 18h16v10a8 8 0 0 1-16 0V18Z" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M28 38v8l4-3 4 3v-8" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    linkedin: `<rect x="16" y="16" width="32" height="32" rx="6" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M26 28v12M26 24v.1M32 28v12M32 32c0-2 2-4 5-4s5 2 5 6v6" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    website: `<circle cx="32" cy="32" r="16" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M16 32h32M32 16c4 4 6 10 6 16s-2 12-6 16c-4-4-6-10-6-16s2-12 6-16Z" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`,
    language: `<circle cx="32" cy="32" r="16" fill="none" stroke="${stroke}" stroke-width="4"/><path d="M18 32h28M32 16c4 4 6 10 6 16s-2 12-6 16c-4-4-6-10-6-16s2-12 6-16Z" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/>`,
    skills: `<path d="M18 42h8V22h-8v20Zm10 0h8V14h-8v28Zm10 0h8V30h-8v12Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    chart: `<path d="M18 44h28M22 42V30M30 42V20M38 42v-8" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    image: `<rect x="16" y="18" width="32" height="24" rx="4" fill="none" stroke="${stroke}" stroke-width="4"/><circle cx="26" cy="26" r="3" fill="${stroke}"/><path d="m18 38 8-8 6 6 6-8 10 10" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    document: `<path d="M22 16h14l8 8v24a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><path d="M36 16v8h8M26 30h12M26 36h12M26 42h8" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/>`,
    tag: `<path d="M18 30 30 18h16v16L34 46 18 30Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/><circle cx="34" cy="26" r="3" fill="${stroke}"/>`,
    filter: `<path d="M18 18h28l-10 12v8l-8 4v-12L18 18Z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    grid: `<path d="M18 18h10v10H18zM36 18h10v10H36zM18 36h10v10H18zM36 36h10v10H36z" fill="none" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"/>`,
    default: `${line("M20 36h24M32 20v24")}${`<circle cx="32" cy="32" r="12" stroke="${stroke}" stroke-width="4" fill="none"/>`}`,
  };
  const body = bodies[name] ?? bodies.default;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect x="6" y="6" width="52" height="52" rx="12" fill="${fill}"/>${body}</svg>`;
}

export const icons: EditorIconMock[] = iconNames.map((name, index) => ({
  id: `icon-${String(index + 1).padStart(2, "0")}`,
  name,
  category: iconCategories[index % iconCategories.length] ?? "interface",
  variant: index % 3 === 0 ? "mono" : "color",
  iconName: index % 3 === 0 ? name : undefined,
  svg: iconSvg(name, index, index % 3 === 0 ? "mono" : "color"),
  tags: [name, iconCategories[index % iconCategories.length] ?? "interface"],
  favorite: index % 9 === 0,
}));

const emojiGroups: Record<string, string[]> = {
  smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "🙂",
    "😊",
    "😍",
    "🤔",
    "😎",
    "🥳",
    "😌",
    "😇",
    "😂",
    "😉",
    "😋",
    "🤩",
    "😴",
  ],
  people: [
    "👋",
    "👍",
    "👏",
    "🙌",
    "🤝",
    "💪",
    "👩‍💼",
    "👨‍💼",
    "👩‍🍳",
    "👨‍🍳",
    "👩‍🎨",
    "👨‍🎨",
    "🧑‍💻",
    "🧑‍🏫",
    "🧑‍🔧",
    "🧑‍🚀",
    "🧑‍⚕️",
    "🧑‍🎓",
  ],
  food: [
    "🥐",
    "🥖",
    "🧀",
    "🍞",
    "🥨",
    "🥯",
    "🥞",
    "🧇",
    "🍰",
    "🧁",
    "🍩",
    "🍪",
    "🍫",
    "🍷",
    "🍸",
    "🍹",
    "☕",
    "🍽️",
  ],
  travel: [
    "✈️",
    "🚗",
    "🚕",
    "🚆",
    "🚇",
    "🚲",
    "🛵",
    "🏨",
    "🏝️",
    "⛰️",
    "🌆",
    "🗺️",
    "🧭",
    "🧳",
    "🛎️",
    "🚪",
    "🏛️",
    "🌍",
  ],
  objects: [
    "💼",
    "📄",
    "📎",
    "✏️",
    "🖊️",
    "📌",
    "📍",
    "📅",
    "⏰",
    "💡",
    "🔒",
    "🔑",
    "📷",
    "🖼️",
    "🧾",
    "📊",
    "🗂️",
    "🧰",
  ],
  symbols: [
    "⭐",
    "✨",
    "🔥",
    "💎",
    "✅",
    "❌",
    "⚠️",
    "❤️",
    "💬",
    "🔗",
    "⬆️",
    "⬇️",
    "➕",
    "➖",
    "✔️",
    "🔶",
    "🔷",
    "⚡",
  ],
  flags: [
    "🇫🇷",
    "🇧🇪",
    "🇨🇭",
    "🇨🇦",
    "🇺🇸",
    "🇬🇧",
    "🇪🇸",
    "🇮🇹",
    "🇩🇪",
    "🇳🇱",
    "🇵🇹",
    "🇲🇦",
    "🇯🇵",
    "🇰🇷",
    "🇧🇷",
    "🇸🇪",
    "🇩🇰",
    "🇦🇺",
  ],
};

export const emojis: EditorEmojiMock[] = Object.entries(emojiGroups).flatMap(([category, items]) =>
  items.map((emoji, index) => ({
    id: `emoji-${category}-${String(index + 1).padStart(2, "0")}`,
    emoji,
    name: `${category} ${index + 1}`,
    category,
    tags: [category, emoji],
  })),
);

const layerNames = [
  "Fond",
  "Grille",
  "Header",
  "Photo",
  "Titre",
  "Sous-titre",
  "Experiences",
  "Formations",
  "Langues",
  "Competences",
  "Footer",
  "Signature",
  "Décorations",
  "Timeline",
  "Graphiques",
  "Badges",
  "Portfolio",
  "Callouts",
  "Numérotation",
  "Annotations",
  "Assets importés",
  "Repères impression",
  "Overlay sélection",
  "Contact",
  "Sidebar",
];

export const layers: EditorLayerMock[] = layerNames.map((name, index) => ({
  id: `layer-${String(index + 1).padStart(2, "0")}`,
  number: index + 1,
  name,
  page: index < 4 ? 1 : index < 8 ? 2 : index < 12 ? 3 : (index % 12) + 1,
  visible: index % 11 !== 0,
  locked: index % 9 === 0,
  active: index === 4,
  objectIds:
    index === 4
      ? ["object-05", "object-17", "object-29"]
      : Array.from({ length: 3 + (index % 4) }).map(
          (_, objectIndex) => `object-${String(index * 3 + objectIndex + 1).padStart(2, "0")}`,
        ),
}));

const objectTypes: EditorObjectType[] = [
  "text",
  "image",
  "shape",
  "chart",
  "variable",
  "preset",
  "group",
];
export const objects: EditorObjectMock[] = Array.from({ length: 80 }).map((_, index) => {
  const type = objectTypes[index % objectTypes.length] ?? "text";
  const page = (index % 12) + 1;
  const layerNumber = (index % 25) + 1;
  const objectLabel =
    index + 1 === 5 || index + 1 === 17 || index + 1 === 29 ? `Icone-${index + 1}` : null;

  return {
    id: `object-${String(index + 1).padStart(2, "0")}`,
    type,
    name:
      objectLabel ??
      `${type === "text" ? "Texte" : type === "image" ? "Image" : type === "preset" ? "Preset" : "Objet"} ${index + 1}`,
    page,
    layerNumber,
    visible: index % 13 !== 0,
    locked: index % 17 === 0,
    x: 24 + ((index * 37) % 420),
    y: 32 + ((index * 53) % 680),
    width: 40 + ((index * 11) % 240),
    height: 24 + ((index * 7) % 160),
  };
});

const pageSeeds = [
  ["COUVERTURE", 794, 1123, "portrait"],
  ["PROFIL & EXPÉRIENCES", 794, 1123, "portrait"],
  ["FORMATIONS & LANGUES", 794, 1123, "portrait"],
  ["COMPÉTENCES", 794, 1123, "portrait"],
  ["PORTFOLIO", 1123, 794, "landscape"],
  ["RÉFÉRENCES", 1123, 794, "landscape"],
  ["SOCIAL POST", 1080, 1080, "square"],
  ["FLYER RESTAURANT", 1080, 1350, "portrait"],
  ["BROCHURE RECTO", 1480, 1050, "landscape"],
  ["BROCHURE VERSO", 1480, 1050, "landscape"],
  ["CARTE MENU", 900, 1200, "portrait"],
  ["ANNEXES", 1200, 900, "custom"],
] as const;

function pagePreviewSvg(name: string, width: number, height: number, number: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#fff"/><rect x="${width * 0.16}" y="${height * 0.08}" width="${width * 0.18}" height="${height * 0.22}" fill="#d4d4d8"/><rect x="${width * 0.38}" y="${height * 0.1}" width="${width * 0.34}" height="${height * 0.035}" fill="#20232a"/><rect x="${width * 0.38}" y="${height * 0.16}" width="${width * 0.28}" height="${height * 0.025}" fill="#7d828c"/><rect x="${width * 0.16}" y="${height * 0.42}" width="${width * 0.14}" height="${height * 0.026}" fill="#f2ad37"/><rect x="${width * 0.16}" y="${height * 0.5}" width="${width * 0.5}" height="${height * 0.012}" fill="#e5e7eb"/><rect x="${width * 0.16}" y="${height * 0.6}" width="${width * 0.14}" height="${height * 0.026}" fill="#f2ad37"/><rect x="${width * 0.16}" y="${height * 0.68}" width="${width * 0.46}" height="${height * 0.012}" fill="#e5e7eb"/><text x="${width - 48}" y="${height - 32}" font-size="18" font-family="Inter,Arial" fill="#9ca3af">p.${number}</text><title>${name}</title></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const pages: EditorPageMock[] = pageSeeds.map(
  ([name, width, height, orientation], index) => ({
    id: `page-${index + 1}`,
    number: index + 1,
    name,
    width,
    height,
    orientation,
    previewSvg: pagePreviewSvg(name, width, height, index + 1),
    active: index === 0,
  }),
);
