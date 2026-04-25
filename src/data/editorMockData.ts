export type EditorVariableType = "TEXTE" | "IMAGE" | "LISTE" | "TABLE";
export type EditorPresetType = "EXPERIENCES" | "FORMATIONS" | "LANGUES" | "COMPETENCES" | "INTERETS";
export type EditorObjectType = "text" | "image" | "shape" | "chart" | "variable" | "preset" | "group";
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
  ["Profil", "[Profil]", "TEXTE", "candidate.summary", true, "Créatif rigoureux avec 8 ans d'expérience."],
  ["LinkedIn", "[LinkedIn]", "TEXTE", "candidate.links.linkedin", false, "linkedin.com/in/lucasdupont"],
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
  ["Certifications", "[Certifications]", "LISTE", "candidate.certifications", false, "Google UX Design"],
  ["Intérêts", "[Intérêts]", "LISTE", "candidate.interests", false, "Photo, gastronomie"],
  ["Références", "[Références]", "LISTE", "candidate.references", false, "2 références"],
  ["Soft skills", "[SoftSkills]", "LISTE", "candidate.softSkills", false, "Leadership, écoute"],
  ["Outils", "[Outils]", "LISTE", "candidate.tools", false, "Figma, InDesign"],
  ["Secteur", "[Secteur]", "TEXTE", "candidate.industry", false, "Design & branding"],
  ["Résumé court", "[RésuméCourt]", "TEXTE", "candidate.shortSummary", false, "Designer orienté marque."],
  ["Accroche", "[Accroche]", "TEXTE", "candidate.tagline", false, "Créer des identités mémorables."],
  ["Photo couverture", "[PhotoCouverture]", "IMAGE", "candidate.coverImage", false, "cover-branding.jpg"],
  ["Logo entreprise", "[LogoEntreprise]", "IMAGE", "company.logo", false, "studio-graphik.svg"],
  ["Nom entreprise", "[Entreprise]", "TEXTE", "company.name", false, "Studio Graphik"],
  ["Mission actuelle", "[MissionActuelle]", "TEXTE", "candidate.currentMission", false, "Refonte identité premium"],
  ["Projet clé", "[ProjetClé]", "TEXTE", "candidate.featuredProject", false, "Campagne Maison Rivage"],
  ["Prix", "[Prix]", "LISTE", "candidate.awards", false, "2 prix design"],
  ["Publications", "[Publications]", "LISTE", "candidate.publications", false, "3 articles"],
  ["Disponibilité voyage", "[Mobilité]", "TEXTE", "candidate.mobility", false, "France et Europe"],
  ["QR Code", "[QRCode]", "IMAGE", "candidate.qrCode", false, "qr-portfolio.svg"],
].map(([label, token, type, mappedPath, required, sampleValue]) => ({ label, token, type, mappedPath, required, sampleValue } as Omit<EditorVariableMock, "id">));

export const variables: EditorVariableMock[] = variableSeeds.map((variable, index) => ({
  id: `var-${String(index + 1).padStart(2, "0")}`,
  ...variable,
}));

const presetSeeds: Omit<EditorPresetMock, "id" | "repeatable">[] = [
  ["Expérience senior", "{experience_senior}", "EXPERIENCES", "candidate.experiences", 3, "Poste, entreprise, période et réalisations senior."],
  ["Expérience junior", "{experience_junior}", "EXPERIENCES", "candidate.experiences", 2, "Bloc compact pour débuts de carrière."],
  ["Expérience freelance", "{experience_freelance}", "EXPERIENCES", "candidate.freelanceMissions", 4, "Missions indépendantes avec clients et livrables."],
  ["Expérience management", "{experience_management}", "EXPERIENCES", "candidate.managementExperience", 3, "Encadrement, équipe et périmètre."],
  ["Stage", "{experience_stage}", "EXPERIENCES", "candidate.internships", 2, "Expériences stage et alternance."],
  ["Formation école", "{formation_ecole}", "FORMATIONS", "candidate.education", 2, "École, diplôme, ville et année."],
  ["Formation licence", "{formation_licence}", "FORMATIONS", "candidate.education", 1, "Cursus universitaire licence."],
  ["Formation master", "{formation_master}", "FORMATIONS", "candidate.education", 1, "Cursus master détaillé."],
  ["Formation MOOC", "{formation_mooc}", "FORMATIONS", "candidate.onlineCourses", 5, "Cours en ligne et certifications."],
  ["Formation BTS", "{formation_bts}", "FORMATIONS", "candidate.education", 1, "Bloc court formation BTS."],
  ["Langues niveau", "{langues_niveau}", "LANGUES", "candidate.languages", 3, "Langue, niveau CECRL et score."],
  ["Langues pastilles", "{langues_pastilles}", "LANGUES", "candidate.languages", 3, "Niveaux visuels par points."],
  ["Compétences barres", "{competences_barres}", "COMPETENCES", "candidate.skills", 6, "Compétences avec jauges horizontales."],
  ["Compétences tags", "{competences_tags}", "COMPETENCES", "candidate.skills", 10, "Nuage de tags catégorisés."],
  ["Compétences outils", "{competences_outils}", "COMPETENCES", "candidate.tools", 8, "Outils métier avec niveau."],
  ["Intérêts simples", "{interets_simples}", "INTERETS", "candidate.interests", 5, "Liste courte de centres d'intérêt."],
  ["Intérêts icônes", "{interets_icones}", "INTERETS", "candidate.interests", 5, "Centres d'intérêt accompagnés d'icônes."],
  ["Certifications", "{certifications}", "COMPETENCES", "candidate.certifications", 4, "Certifications professionnelles."],
  ["Références", "{references}", "EXPERIENCES", "candidate.references", 2, "Contacts de référence anonymisés."],
  ["Portfolio projets", "{portfolio_projets}", "EXPERIENCES", "candidate.projects", 6, "Projets sélectionnés avec résultats."],
].map(([label, token, type, mappedPath, sampleItemsCount, description]) => ({
  label,
  token,
  type,
  mappedPath,
  sampleItemsCount,
  description,
} as Omit<EditorPresetMock, "id" | "repeatable">));

export const presets: EditorPresetMock[] = presetSeeds.map((preset, index) => ({
  id: `preset-${String(index + 1).padStart(2, "0")}`,
  repeatable: true,
  ...preset,
}));

const imageCategories = ["Portrait", "Pâtisserie", "Cuisine", "Cocktails", "Restaurant", "Hospitality", "Logo", "Texture", "Produit food", "Fond"] as const;
const imageNames = [
  "Portrait consultant", "Portrait chef", "Portrait designer", "Portrait manager", "Portrait sommelier", "Portrait hôtelier",
  "Éclair vanille", "Tarte citron", "Croissant doré", "Macaron framboise", "Pain signature", "Entremets chocolat",
  "Cuisine ouverte", "Planche ingrédients", "Dressage assiette", "Marché frais", "Ustensiles cuivre", "Table chef",
  "Cocktail ambré", "Bar speakeasy", "Verre martini", "Mocktail agrumes", "Comptoir lumineux", "Bouteilles premium",
  "Salle bistrot", "Table dressée", "Terrasse urbaine", "Menu dégustation", "Banquette velours", "Service midi",
  "Suite boutique", "Lobby calme", "Chambre terrasse", "Spa minéral", "Réception hôtel", "Couloir design",
  "Logo Maison Rivage", "Logo Atelier Nori", "Logo Hôtel Alma", "Logo Boulangerie Or", "Logo Studio Luma", "Logo Café Nord",
  "Papier grain fin", "Marbre clair", "Lin naturel", "Bois sombre", "Béton doux", "Dégradé brume",
  "Packaging café", "Boîte pâtisserie", "Bouteille tonic", "Pot confiture", "Tablette chocolat", "Huile artisanale",
  "Fond éditorial", "Fond portrait", "Fond restaurant", "Fond événement", "Fond social", "Fond brochure",
];
const imageSizes = [
  [1200, 1200], [900, 1200], [1600, 1067], [2000, 1333], [1080, 1350], [1440, 960],
];

function logoDataUri(name: string, index: number): string {
  const initials = name.split(" ").slice(-2).map((word) => word[0]).join("").toUpperCase();
  const hue = (index * 43) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" rx="160" fill="hsl(${hue} 70% 42%)"/><circle cx="600" cy="510" r="190" fill="white" opacity=".18"/><text x="600" y="650" text-anchor="middle" font-family="Inter,Arial" font-size="220" font-weight="800" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const images: EditorImageMock[] = imageNames.map((name, index) => {
  const category = imageCategories[Math.floor(index / 6)] ?? "Fond";
  const [width, height] = imageSizes[index % imageSizes.length] ?? [1200, 1200];
  const src = category === "Logo" ? logoDataUri(name, index) : `https://picsum.photos/seed/resume-${index + 11}/${width}/${height}`;

  return {
    id: `image-${String(index + 1).padStart(2, "0")}`,
    name,
    category,
    src,
    width,
    height,
    tags: [category.toLowerCase(), name.toLowerCase().split(" ")[0] ?? "asset", width === height ? "carré" : width > height ? "paysage" : "portrait"],
    favorite: index % 7 === 0,
    createdAt: `2026-04-${String((index % 24) + 1).padStart(2, "0")}`,
  };
});

const textBlockSeeds = [
  ["Titre éditorial", "Texte", "Titre<br><span>Sous-titre élégant</span>", "<h1>Titre</h1><p>Sous-titre élégant</p>"],
  ["Paragraphe classique", "Texte", "Lignes de texte", "<p>Paragraphe sobre pour contenu éditorial.</p>"],
  ["Headline impact", "Texte Design", "HEADLINE", "<h2>HEADLINE</h2>"],
  ["En-tête 3 lignes", "Texte", "01 — CHAPITRE<br>En-tête", "<header><small>01 — CHAPITRE</small><h2>En-tête</h2></header>"],
  ["Nom + rôle", "Texte", "Jane Doe<br>DESIGNER", "<strong>Jane Doe</strong><small>DESIGNER</small>"],
  ["Mot contour", "Effets", "BIG", "<h2 class='outline'>BIG</h2>"],
  ["Mix fonts script", "Texte Design", "The future<br>is now", "<p>The <em>future</em><br/>is now</p>"],
  ["Lettre capitale drop", "Texte Design", "A + paragraphe", "<p><strong>A</strong>ccroche avec lettrine.</p>"],
  ["Mono tag uppercase", "Texte Design", "TAG/01<br>Section title", "<p><code>TAG/01</code></p><h3>Section title</h3>"],
  ["Texte vertical", "Effets", "VERTICAL", "<p class='vertical'>VERTICAL</p>"],
  ["Gradient word", "Effets", "GRADIENT", "<h2>GRADIENT</h2>"],
  ["Surligné", "Effets", "surligné", "<mark>surligné</mark><p>Texte associé.</p>"],
  ["Ombre portée", "Effets", "OMBRE", "<h2 class='shadow'>OMBRE</h2>"],
  ["Stroke + fill", "Effets", "STROKE", "<h2 class='stroke'>STROKE</h2>"],
  ["Citation guillemets", "Citations", "Less but better", "<blockquote>Less but better</blockquote>"],
  ["Citation barre latérale", "Citations", "Citation", "<blockquote class='side'>Citation inspirante.</blockquote>"],
  ["Pull quote centré", "Citations", "Phrase clé", "<blockquote>Phrase clé mise en avant.</blockquote>"],
  ["Callout conseil", "Callout", "Conseil", "<aside><strong>Conseil</strong><p>À retenir.</p></aside>"],
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
  ["Liste 2 colonnes", "Listes", "Deux colonnes", "<div class='columns'>Liste en deux colonnes</div>"],
  ["Cartouche contact", "Texte", "Contact", "<section><strong>Contact</strong><p>Email · Téléphone</p></section>"],
];

export const textBlocks: EditorTextBlockMock[] = textBlockSeeds.map(([name, category, preview, html], index) => ({
  id: `text-block-${String(index + 1).padStart(2, "0")}`,
  name,
  category,
  preview,
  html,
  tags: [category.toLowerCase(), name.toLowerCase().split(" ")[0] ?? "texte"],
  favorite: index % 6 === 0,
}));

function shapeSvg(label: string, index: number, kind: string): string {
  const hue = (index * 31) % 360;
  const stroke = index % 3 === 0 ? "#111827" : `hsl(${hue} 70% 48%)`;
  const fill = index % 4 === 0 ? "transparent" : `hsl(${hue} 72% 88%)`;
  const body = kind === "circle"
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

const shapeKinds = ["circle", "rect", "line", "arrow", "bubble", "badge", "separator", "diagram", "chart", "transparent"] as const;
export const shapes: EditorShapeMock[] = Array.from({ length: 40 }).map((_, index) => {
  const type = shapeKinds[index % shapeKinds.length] ?? "rect";
  const category = ["Formes", "Graphiques", "Badges", "Séparateurs", "Diagrammes"][index % 5] ?? "Formes";
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

const iconCategories = ["user", "mail", "phone", "location", "calendar", "education", "work", "skills", "language", "award", "link", "social", "food", "hotel", "bar", "restaurant"];
const iconNames = [
  "home", "search", "settings", "favorite", "star", "bookmark", "share", "download", "upload", "edit",
  "delete", "add", "minus", "check", "close", "menu", "more", "info", "warning", "error",
  "mail", "phone", "location", "calendar", "clock", "briefcase", "graduation", "user", "group", "lock",
  "chef", "cake", "coffee", "wine", "cocktail", "hotel", "bed", "restaurant", "menu-card", "award",
  "linkedin", "website", "language", "skills", "chart", "image", "document", "tag", "filter", "grid",
];

function iconSvg(name: string, index: number): string {
  const color = index % 2 === 0 ? "#f2ad37" : "#67e8f9";
  const dark = "#181b22";
  const stroke = index % 3 === 0 ? dark : color;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect x="6" y="6" width="52" height="52" rx="12" fill="#eef0f4"/><path d="M20 36h24M32 20v24" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="32" r="${8 + (index % 5) * 2}" stroke="${stroke}" stroke-width="4" opacity=".55"/></svg>`;
}

export const icons: EditorIconMock[] = iconNames.map((name, index) => ({
  id: `icon-${String(index + 1).padStart(2, "0")}`,
  name,
  category: iconCategories[index % iconCategories.length] ?? "interface",
  variant: index % 3 === 0 ? "mono" : "color",
  iconName: index % 3 === 0 ? name : undefined,
  svg: index % 3 === 0 ? undefined : iconSvg(name, index),
  tags: [name, iconCategories[index % iconCategories.length] ?? "interface"],
  favorite: index % 9 === 0,
}));

const emojiGroups: Record<string, string[]> = {
  smileys: ["😀", "😃", "😄", "😁", "😆", "🙂", "😊", "😍", "🤔", "😎", "🥳", "😌", "😇", "😂", "😉", "😋", "🤩", "😴"],
  people: ["👋", "👍", "👏", "🙌", "🤝", "💪", "👩‍💼", "👨‍💼", "👩‍🍳", "👨‍🍳", "👩‍🎨", "👨‍🎨", "🧑‍💻", "🧑‍🏫", "🧑‍🔧", "🧑‍🚀", "🧑‍⚕️", "🧑‍🎓"],
  food: ["🥐", "🥖", "🧀", "🍞", "🥨", "🥯", "🥞", "🧇", "🍰", "🧁", "🍩", "🍪", "🍫", "🍷", "🍸", "🍹", "☕", "🍽️"],
  travel: ["✈️", "🚗", "🚕", "🚆", "🚇", "🚲", "🛵", "🏨", "🏝️", "⛰️", "🌆", "🗺️", "🧭", "🧳", "🛎️", "🚪", "🏛️", "🌍"],
  objects: ["💼", "📄", "📎", "✏️", "🖊️", "📌", "📍", "📅", "⏰", "💡", "🔒", "🔑", "📷", "🖼️", "🧾", "📊", "🗂️", "🧰"],
  symbols: ["⭐", "✨", "🔥", "💎", "✅", "❌", "⚠️", "❤️", "💬", "🔗", "⬆️", "⬇️", "➕", "➖", "✔️", "🔶", "🔷", "⚡"],
  flags: ["🇫🇷", "🇧🇪", "🇨🇭", "🇨🇦", "🇺🇸", "🇬🇧", "🇪🇸", "🇮🇹", "🇩🇪", "🇳🇱", "🇵🇹", "🇲🇦", "🇯🇵", "🇰🇷", "🇧🇷", "🇸🇪", "🇩🇰", "🇦🇺"],
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
  "Background", "Guides", "Header", "Nom & Poste", "Photo", "Sidebar", "Contact", "Compétences", "Langues", "Expériences",
  "Formation", "Certifications", "Références", "Décorations", "Timeline", "Graphiques", "Badges", "Portfolio", "Callouts", "Footer",
  "Numérotation", "Annotations", "Assets importés", "Repères impression", "Overlay sélection",
];

export const layers: EditorLayerMock[] = layerNames.map((name, index) => ({
  id: `layer-${String(index + 1).padStart(2, "0")}`,
  number: index + 1,
  name,
  page: (index % 12) + 1,
  visible: index % 11 !== 0,
  locked: index % 9 === 0,
  active: index === 9,
  objectIds: Array.from({ length: 3 + (index % 4) }).map((_, objectIndex) => `object-${String(index * 3 + objectIndex + 1).padStart(2, "0")}`),
}));

const objectTypes: EditorObjectType[] = ["text", "image", "shape", "chart", "variable", "preset", "group"];
export const objects: EditorObjectMock[] = Array.from({ length: 80 }).map((_, index) => {
  const type = objectTypes[index % objectTypes.length] ?? "text";
  const page = (index % 12) + 1;
  const layerNumber = (index % 25) + 1;

  return {
    id: `object-${String(index + 1).padStart(2, "0")}`,
    type,
    name: `${type === "text" ? "Texte" : type === "image" ? "Image" : type === "preset" ? "Preset" : "Objet"} ${index + 1}`,
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

export const pages: EditorPageMock[] = pageSeeds.map(([name, width, height, orientation], index) => ({
  id: `page-${index + 1}`,
  number: index + 1,
  name,
  width,
  height,
  orientation,
  previewSvg: pagePreviewSvg(name, width, height, index + 1),
  active: index === 0,
}));
