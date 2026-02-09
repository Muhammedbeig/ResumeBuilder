export type ResumeTemplateCategory = {
  slug: string;
  label: string;
  description: string;
};

export type ResumeTemplateCatalogEntry = {
  id: string;
  name: string;
  category: string;
  description: string;
  bodyFont: string;
  headingFont: string;
  layout: "sidebar-left" | "sidebar-right" | "split" | "stacked" | "cards";
  headerStyle: "center" | "split" | "left";
  sectionStyle: "caps" | "underline" | "pill" | "stripe";
  bulletStyle: "dot" | "dash" | "diamond" | "line";
  ornament: "orbs" | "grid" | "stripes" | "corner" | "badge" | "none";
  hasPhoto: boolean;
  palette: {
    text: string;
    muted: string;
    surface: string;
    border: string;
  };
  background: {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
  };
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  professional: "Polished layout with a crisp, executive feel.",
  modern: "Contemporary spacing and bold hierarchy.",
  corporate: "Structured grid built for business clarity.",
  minimal: "Ultra-clean layout with restrained typography.",
  creative: "Expressive layout with visual accents.",
  monochrome: "Black and white contrast with elegant balance.",
  elegant: "Refined serif accents with elevated spacing.",
  geometric: "Strong geometry and structured composition.",
  line: "Linear accents and sharp separators.",
  photo: "Photo-forward layout with premium framing.",
  feminine: "Soft gradients with graceful typography.",
  classic: "Timeless layout with traditional hierarchy.",
  bold: "High-contrast statements and confident spacing.",
  aesthetic: "Curated balance of layout and color.",
  tech: "Modern grid with sharp tech styling.",
  colorful: "Vibrant gradients and lively section cards.",
  dark: "Night-mode palette with vivid highlights.",
  retro: "Vintage-inspired layout with warm tones.",
  playful: "Energetic layout with playful spacing.",
  classy: "Refined layout with subtle elegance.",
  purple: "Purple-forward palette with sleek accents.",
  fancy: "Decorative layout with premium trims.",
  infographic: "Data-forward layout with card blocks.",
  gold: "Gold accents and premium contrast.",
  grid: "Structured grid background with modern layout.",
  gradient: "Full-bleed gradient with layered sections.",
  abstract: "Abstract background accents and freeform layout.",
  border: "Strong borders and framed sections.",
  rectangle: "Sharp rectangular blocks and clear spacing.",
  new: "Fresh layout with bright accents.",
  luxury: "High-end styling with rich tones.",
  illustrated: "Illustrative accents and gentle shapes.",
  vibrant: "Bold, vibrant palette with punchy headers.",
  organic: "Soft shapes and organic flow.",
  fun: "Friendly layout with lively spacing.",
  logo: "Brand-forward layout with a badge header.",
  light: "Bright layout with airy spacing.",
  shapes: "Geometric shapes layered into the background.",
  watercolor: "Soft watercolor gradients and gentle lines.",
  digital: "Clean digital layout with neon accents.",
  pastel: "Pastel gradients with soft typography.",
  frame: "Framed layout with boxed sections.",
  collage: "Collage-inspired blocks and angled accents.",
  cute: "Warm, friendly layout with soft shapes.",
  grunge: "Textured layout with bold contrasts.",
  modular: "Modular blocks for easy scanning.",
  pattern: "Patterned background with structured layout.",
};

export const RESUME_TEMPLATE_CATEGORIES: ResumeTemplateCategory[] = [
  { slug: "professional", label: "Professional", description: CATEGORY_DESCRIPTIONS.professional },
  { slug: "modern", label: "Modern", description: CATEGORY_DESCRIPTIONS.modern },
  { slug: "corporate", label: "Corporate", description: CATEGORY_DESCRIPTIONS.corporate },
  { slug: "minimal", label: "Minimal", description: CATEGORY_DESCRIPTIONS.minimal },
  { slug: "creative", label: "Creative", description: CATEGORY_DESCRIPTIONS.creative },
  { slug: "monochrome", label: "Monochrome", description: CATEGORY_DESCRIPTIONS.monochrome },
  { slug: "elegant", label: "Elegant", description: CATEGORY_DESCRIPTIONS.elegant },
  { slug: "geometric", label: "Geometric", description: CATEGORY_DESCRIPTIONS.geometric },
  { slug: "line", label: "Line", description: CATEGORY_DESCRIPTIONS.line },
  { slug: "photo", label: "Photo", description: CATEGORY_DESCRIPTIONS.photo },
  { slug: "feminine", label: "Feminine", description: CATEGORY_DESCRIPTIONS.feminine },
  { slug: "classic", label: "Classic", description: CATEGORY_DESCRIPTIONS.classic },
  { slug: "bold", label: "Bold", description: CATEGORY_DESCRIPTIONS.bold },
  { slug: "aesthetic", label: "Aesthetic", description: CATEGORY_DESCRIPTIONS.aesthetic },
  { slug: "tech", label: "Tech", description: CATEGORY_DESCRIPTIONS.tech },
  { slug: "colorful", label: "Colorful", description: CATEGORY_DESCRIPTIONS.colorful },
  { slug: "dark", label: "Dark", description: CATEGORY_DESCRIPTIONS.dark },
  { slug: "retro", label: "Retro", description: CATEGORY_DESCRIPTIONS.retro },
  { slug: "playful", label: "Playful", description: CATEGORY_DESCRIPTIONS.playful },
  { slug: "classy", label: "Classy", description: CATEGORY_DESCRIPTIONS.classy },
  { slug: "purple", label: "Purple", description: CATEGORY_DESCRIPTIONS.purple },
  { slug: "fancy", label: "Fancy", description: CATEGORY_DESCRIPTIONS.fancy },
  { slug: "infographic", label: "Infographic", description: CATEGORY_DESCRIPTIONS.infographic },
  { slug: "gold", label: "Gold", description: CATEGORY_DESCRIPTIONS.gold },
  { slug: "grid", label: "Grid", description: CATEGORY_DESCRIPTIONS.grid },
  { slug: "gradient", label: "Gradient", description: CATEGORY_DESCRIPTIONS.gradient },
  { slug: "abstract", label: "Abstract", description: CATEGORY_DESCRIPTIONS.abstract },
  { slug: "border", label: "Border", description: CATEGORY_DESCRIPTIONS.border },
  { slug: "rectangle", label: "Rectangle", description: CATEGORY_DESCRIPTIONS.rectangle },
  { slug: "new", label: "New", description: CATEGORY_DESCRIPTIONS.new },
  { slug: "luxury", label: "Luxury", description: CATEGORY_DESCRIPTIONS.luxury },
  { slug: "illustrated", label: "Illustrated", description: CATEGORY_DESCRIPTIONS.illustrated },
  { slug: "vibrant", label: "Vibrant", description: CATEGORY_DESCRIPTIONS.vibrant },
  { slug: "organic", label: "Organic", description: CATEGORY_DESCRIPTIONS.organic },
  { slug: "fun", label: "Fun", description: CATEGORY_DESCRIPTIONS.fun },
  { slug: "logo", label: "Logo", description: CATEGORY_DESCRIPTIONS.logo },
  { slug: "light", label: "Light", description: CATEGORY_DESCRIPTIONS.light },
  { slug: "shapes", label: "Shapes", description: CATEGORY_DESCRIPTIONS.shapes },
  { slug: "watercolor", label: "Watercolor", description: CATEGORY_DESCRIPTIONS.watercolor },
  { slug: "digital", label: "Digital", description: CATEGORY_DESCRIPTIONS.digital },
  { slug: "pastel", label: "Pastel", description: CATEGORY_DESCRIPTIONS.pastel },
  { slug: "frame", label: "Frame", description: CATEGORY_DESCRIPTIONS.frame },
  { slug: "collage", label: "Collage", description: CATEGORY_DESCRIPTIONS.collage },
  { slug: "cute", label: "Cute", description: CATEGORY_DESCRIPTIONS.cute },
  { slug: "grunge", label: "Grunge", description: CATEGORY_DESCRIPTIONS.grunge },
  { slug: "modular", label: "Modular", description: CATEGORY_DESCRIPTIONS.modular },
  { slug: "pattern", label: "Pattern", description: CATEGORY_DESCRIPTIONS.pattern },
];

const BODY_FONTS = [
  "Inter",
  "Poppins",
  "Merriweather",
  "Playfair Display",
  "Montserrat",
  "Raleway",
  "Lora",
  "Source Sans 3",
  "Source Serif 4",
  "Nunito",
  "Quicksand",
  "Rubik",
  "Work Sans",
  "Karla",
  "Mulish",
  "Manrope",
  "DM Sans",
  "Space Grotesk",
  "IBM Plex Sans",
  "IBM Plex Serif",
  "PT Sans",
  "PT Serif",
  "Noto Sans",
  "Noto Serif",
  "Oswald",
  "Bebas Neue",
  "Cabin",
  "Fira Sans",
  "Fira Code",
  "M PLUS 1",
  "Heebo",
  "Chivo",
  "Barlow",
  "Josefin Sans",
  "Cormorant Garamond",
  "Cinzel",
  "Titillium Web",
  "Urbanist",
  "Sora",
  "Lexend",
  "Varela Round",
  "Red Hat Display",
  "Domine",
  "Arvo",
  "EB Garamond",
  "Zilla Slab",
  "Hind",
];

const HEADING_FONTS = [
  "Playfair Display",
  "Oswald",
  "Space Grotesk",
  "DM Serif Display",
  "Cinzel",
  "Bebas Neue",
  "Montserrat Alternates",
  "Cormorant SC",
  "Sora",
  "Roboto Slab",
  "Abril Fatface",
  "Raleway",
];

const STYLE_SETS = [
  {
    background: {
      backgroundColor: "#f8fafc",
      backgroundImage: "linear-gradient(135deg, #ede9fe 0%, #ecfeff 100%)",
    },
    palette: {
      text: "#0f172a",
      muted: "#475569",
      surface: "rgba(255,255,255,0.75)",
      border: "rgba(148,163,184,0.35)",
    },
  },
  {
    background: {
      backgroundColor: "#fff7ed",
      backgroundImage: "linear-gradient(135deg, #fff7ed 0%, #fce7f3 100%)",
    },
    palette: {
      text: "#1f2937",
      muted: "#4b5563",
      surface: "rgba(255,255,255,0.7)",
      border: "rgba(203,213,225,0.5)",
    },
  },
  {
    background: {
      backgroundColor: "#0f172a",
      backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #111827 100%)",
    },
    palette: {
      text: "#f8fafc",
      muted: "#cbd5f5",
      surface: "rgba(15,23,42,0.6)",
      border: "rgba(148,163,184,0.25)",
    },
  },
  {
    background: {
      backgroundColor: "#ecfeff",
      backgroundImage: "linear-gradient(135deg, #ccfbf1 0%, #ecfeff 100%)",
    },
    palette: {
      text: "#042f2e",
      muted: "#0f766e",
      surface: "rgba(255,255,255,0.65)",
      border: "rgba(94,234,212,0.3)",
    },
  },
  {
    background: {
      backgroundColor: "#1f1147",
      backgroundImage: "linear-gradient(135deg, #1f1147 0%, #2e1065 60%, #0f172a 100%)",
    },
    palette: {
      text: "#f8fafc",
      muted: "#c4b5fd",
      surface: "rgba(15,23,42,0.55)",
      border: "rgba(196,181,253,0.25)",
    },
  },
  {
    background: {
      backgroundColor: "#fef3c7",
      backgroundImage: "linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)",
    },
    palette: {
      text: "#1f2937",
      muted: "#6b7280",
      surface: "rgba(255,255,255,0.7)",
      border: "rgba(252,211,77,0.35)",
    },
  },
  {
    background: {
      backgroundColor: "#e0f2fe",
      backgroundImage:
        "linear-gradient(to right, rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
      backgroundSize: "22px 22px, 22px 22px, auto",
    },
    palette: {
      text: "#0f172a",
      muted: "#334155",
      surface: "rgba(255,255,255,0.7)",
      border: "rgba(148,163,184,0.35)",
    },
  },
  {
    background: {
      backgroundColor: "#fff1f2",
      backgroundImage: "linear-gradient(135deg, #ffe4e6 0%, #fce7f3 100%)",
    },
    palette: {
      text: "#1f2937",
      muted: "#6b7280",
      surface: "rgba(255,255,255,0.7)",
      border: "rgba(251,113,133,0.2)",
    },
  },
  {
    background: {
      backgroundColor: "#0b1220",
      backgroundImage: "linear-gradient(135deg, #0b1220 0%, #111827 65%, #0f172a 100%)",
    },
    palette: {
      text: "#f8fafc",
      muted: "#94a3b8",
      surface: "rgba(15,23,42,0.6)",
      border: "rgba(148,163,184,0.25)",
    },
  },
  {
    background: {
      backgroundColor: "#f0fdfa",
      backgroundImage: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
    },
    palette: {
      text: "#0f172a",
      muted: "#0f766e",
      surface: "rgba(255,255,255,0.72)",
      border: "rgba(20,184,166,0.25)",
    },
  },
];

const LAYOUTS: ResumeTemplateCatalogEntry["layout"][] = [
  "sidebar-left",
  "sidebar-right",
  "split",
  "stacked",
  "cards",
];

const HEADER_STYLES: ResumeTemplateCatalogEntry["headerStyle"][] = ["center", "split", "left"];
const SECTION_STYLES: ResumeTemplateCatalogEntry["sectionStyle"][] = ["caps", "underline", "pill", "stripe"];
const BULLET_STYLES: ResumeTemplateCatalogEntry["bulletStyle"][] = ["dot", "dash", "diamond", "line"];
const ORNAMENTS: ResumeTemplateCatalogEntry["ornament"][] = ["orbs", "grid", "stripes", "corner", "badge", "none"];

const NAME_SUFFIXES = ["Studio", "Prime", "Edition", "Flow", "Line", "Stack", "Aura", "Wave", "Vista", "Core"];

const CATEGORY_OVERRIDES: Partial<Record<string, Partial<ResumeTemplateCatalogEntry>>> = {
  monochrome: {
    background: {
      backgroundColor: "#ffffff",
      backgroundImage: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
    },
    palette: {
      text: "#0f172a",
      muted: "#475569",
      surface: "rgba(255,255,255,0.85)",
      border: "rgba(148,163,184,0.4)",
    },
    layout: "stacked",
    sectionStyle: "underline",
    ornament: "none",
  },
  dark: {
    background: {
      backgroundColor: "#0b0f1a",
      backgroundImage: "linear-gradient(135deg, #0b0f1a 0%, #111827 60%, #0f172a 100%)",
    },
    palette: {
      text: "#f8fafc",
      muted: "#94a3b8",
      surface: "rgba(15,23,42,0.6)",
      border: "rgba(148,163,184,0.25)",
    },
    layout: "split",
  },
  gold: {
    background: {
      backgroundColor: "#fff7ed",
      backgroundImage: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
    },
    palette: {
      text: "#1f2937",
      muted: "#6b7280",
      surface: "rgba(255,255,255,0.75)",
      border: "rgba(252,211,77,0.4)",
    },
    ornament: "corner",
  },
  purple: {
    background: {
      backgroundColor: "#ede9fe",
      backgroundImage: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)",
    },
    palette: {
      text: "#1f2937",
      muted: "#4b5563",
      surface: "rgba(255,255,255,0.7)",
      border: "rgba(196,181,253,0.45)",
    },
    ornament: "orbs",
    headerStyle: "left",
  },
  watercolor: {
    background: {
      backgroundColor: "#fff1f2",
      backgroundImage: "linear-gradient(135deg, #fff1f2 0%, #e0f2fe 100%)",
    },
    ornament: "orbs",
  },
  photo: {
    hasPhoto: true,
    layout: "sidebar-left",
    headerStyle: "left",
  },
  infographic: {
    layout: "cards",
    sectionStyle: "pill",
  },
  grid: {
    ornament: "grid",
  },
  border: {
    sectionStyle: "stripe",
  },
  rectangle: {
    ornament: "corner",
  },
  line: {
    sectionStyle: "underline",
  },
  logo: {
    ornament: "badge",
    headerStyle: "left",
  },
};

const resolveHeadingFont = (bodyFont: string, index: number) => {
  const candidate = HEADING_FONTS[index % HEADING_FONTS.length];
  if (candidate === bodyFont) {
    return HEADING_FONTS[(index + 1) % HEADING_FONTS.length];
  }
  return candidate;
};

export const RESUME_TEMPLATE_CATALOG: ResumeTemplateCatalogEntry[] = RESUME_TEMPLATE_CATEGORIES.map(
  (category, index) => {
    const layout = LAYOUTS[index % LAYOUTS.length];
    const headerStyle =
      HEADER_STYLES[Math.floor(index / LAYOUTS.length) % HEADER_STYLES.length];
    const sectionStyle =
      SECTION_STYLES[
        Math.floor(index / (LAYOUTS.length * HEADER_STYLES.length)) %
          SECTION_STYLES.length
      ];
    const bulletStyle =
      BULLET_STYLES[
        Math.floor(
          index /
            (LAYOUTS.length * HEADER_STYLES.length * SECTION_STYLES.length)
        ) % BULLET_STYLES.length
      ];
    const ornament =
      ORNAMENTS[
        Math.floor(
          index /
            (LAYOUTS.length *
              HEADER_STYLES.length *
              SECTION_STYLES.length *
              BULLET_STYLES.length)
        ) % ORNAMENTS.length
      ];
    const styleSet = STYLE_SETS[index % STYLE_SETS.length];
    const bodyFont = BODY_FONTS[index] || "Inter";
    const headingFont = resolveHeadingFont(bodyFont, index);
    const name = `${category.label} ${NAME_SUFFIXES[index % NAME_SUFFIXES.length]}`;

    const baseConfig: ResumeTemplateCatalogEntry = {
      id: `cat-${category.slug}`,
      name,
      category: category.slug,
      description: category.description,
      bodyFont,
      headingFont,
      layout,
      headerStyle,
      sectionStyle,
      bulletStyle,
      ornament,
      hasPhoto: index % 3 === 0,
      palette: styleSet.palette,
      background: styleSet.background,
    };

    const override = CATEGORY_OVERRIDES[category.slug];
    if (!override) return baseConfig;

    return {
      ...baseConfig,
      ...override,
      palette: override.palette ? override.palette : baseConfig.palette,
      background: override.background ? override.background : baseConfig.background,
    };
  }
);

export const RESUME_TEMPLATE_CATALOG_BY_CATEGORY = RESUME_TEMPLATE_CATALOG.reduce(
  (acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  },
  {} as Record<string, ResumeTemplateCatalogEntry[]>
);

export const RESUME_TEMPLATE_CATALOG_MAP = RESUME_TEMPLATE_CATALOG.reduce(
  (acc, template) => {
    acc[template.id] = template;
    return acc;
  },
  {} as Record<string, ResumeTemplateCatalogEntry>
);

export const RESUME_TEMPLATE_CATEGORY_SLUGS = RESUME_TEMPLATE_CATEGORIES.map(
  (category) => category.slug
);
