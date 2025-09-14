import fs from "fs";
import path from "path";

const exts = new Set([".tsx", ".ts", ".jsx", ".js"]);
const root = process.cwd();

const exists = (p) => fs.existsSync(p);
const read = (p) => fs.readFileSync(p, "utf8");

function listFiles(start) {
  const out = [];
  const stack = [start];
  while (stack.length) {
    const dir = stack.pop();
    if (!exists(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const fp = path.join(dir, name);
      const st = fs.statSync(fp);
      if (st.isDirectory()) stack.push(fp);
      else if (exts.has(path.extname(fp))) out.push(fp);
    }
  }
  return out.sort();
}

const stripParensSegments = (segments) =>
  segments.filter((s) => !(s.startsWith("(") && s.endsWith(")")));

function toRouteFromAppFile(file) {
  const rel = path
    .relative(path.join(root, "app"), file)
    .split(path.sep)
    .join("/");
  const noExt = rel.replace(/\.[tj]sx?$/, "");
  const segments = noExt.split("/");

  const base = segments[segments.length - 1];
  const special =
    base === "_layout"
      ? "layout"
      : base === "+not-found"
      ? "not-found"
      : base === "+html"
      ? "html"
      : base === "modal"
      ? "modal"
      : base.startsWith("+")
      ? "special"
      : null;

  const cleaned = stripParensSegments(segments).filter(
    (s) => !s.startsWith("_") && !s.startsWith("+")
  );
  if (cleaned[cleaned.length - 1] === "index") cleaned.pop();

  let route = "/" + cleaned.join("/");
  route = route.replace(/\/+/g, "/");
  if (route === "") route = "/";

  return { rel, route, special };
}

function scanFile(file) {
  const src = read(file);

  const usesTailwind = /className\s*=\s*["'`]/.test(src);
  const tailwindClasses = Array.from(
    src.matchAll(/className\s*=\s*["'`]([^"'`]+)["'`]/g)
  )
    .map((m) => m[1].trim())
    .slice(0, 6);

  const imports = {
    gluestack: /from\s+['"]@gluestack-ui\//.test(src),
    nativewind: /from\s+['"]nativewind/.test(src) || /className=/.test(src),
    lucide: /from\s+['"]lucide-react-native['"]/.test(src),
    expoVectorIcons: /from\s+['"]@expo\/vector-icons['"]/.test(src),
    expoImage: /from\s+['"]expo-image['"]/.test(src),
    expoWB: /from\s+['"]expo-web-browser['"]/.test(src),
    rnSvg: /from\s+['"]react-native-svg['"]/.test(src),
  };

  const counts = {
    buttons: (src.match(/<Button[\s>]/g) || []).length,
    cards: (src.match(/<Card[\s>]/g) || []).length,
    lists: (src.match(/<FlatList[\s>]|<SectionList[\s>]/g) || []).length,
    images: (src.match(/<Image[\s>]/g) || []).length,
    forms:
      (src.match(
        /<Input[\s>]|<Select[\s>]|<Textarea[\s>]|<Checkbox[\s>]|<Radio[\s>]/
      ) || []).length,
    modals: (src.match(/<Modal[\s>]|<AlertDialog[\s>]/g) || []).length,
    navLinks: (src.match(/<Link[\s>]|useRouter\(|router\./g) || []).length,
  };

  let name = null;
  const m1 = src.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/);
  const m2 = src.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
  const m3 = src.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\(/);
  name = (m1 && m1[1]) || (m2 && m2[1]) || (m3 && m3[1]) || null;

  return { imports, counts, usesTailwind, tailwindClasses, name };
}

function section(title) {
  return `\n## ${title}\n`;
}

let md = `# UI Overview (auto-generated)\n\nGenerated: ${new Date().toISOString()}\n`;

const appDir = path.join(root, "app");
const compDir = path.join(root, "components");

const appFiles = listFiles(appDir);
const compFiles = listFiles(compDir);

// ROUTES
md += section("Routes (app/)");
if (appFiles.length === 0) {
  md += "- No files found under \`app/\`.\n";
} else {
  for (const f of appFiles) {
    const { rel, route, special } = toRouteFromAppFile(f);
    const s = scanFile(f);
    const tags = [];
    if (special) tags.push(special);
    if (s.imports.gluestack) tags.push("gluestack-ui");
    if (s.imports.nativewind || s.usesTailwind) tags.push("tailwind");
    if (s.imports.lucide) tags.push("lucide-icons");
    if (s.imports.expoVectorIcons) tags.push("expo-vector-icons");
    if (s.imports.expoImage) tags.push("expo-image");
    if (s.imports.expoWB) tags.push("expo-web-browser");
    if (s.imports.rnSvg) tags.push("react-native-svg");

    const tagStr = tags.length ? ` [${tags.join(", ")}]` : "";
    const nameStr = s.name ? ` — **${s.name}**` : "";
    md += `- \`${route}\` ← \`app/${rel}\`${nameStr}${tagStr}\n`;

    const feat = [];
    const c = s.counts;
    if (c.buttons) feat.push(`buttons:${c.buttons}`);
    if (c.cards) feat.push(`cards:${c.cards}`);
    if (c.lists) feat.push(`lists:${c.lists}`);
    if (c.images) feat.push(`images:${c.images}`);
    if (c.forms) feat.push(`form-controls:${c.forms}`);
    if (c.modals) feat.push(`modals:${c.modals}`);
    if (c.navLinks) feat.push(`nav:${c.navLinks}`);
    if (feat.length || s.tailwindClasses.length) {
      md += `  - features: ${feat.join(", ") || "—"}\n`;
      if (s.tailwindClasses.length) {
        md += `  - tailwind sample: \`${s.tailwindClasses.join(" | ")}\`\n`;
      }
    }
  }
}

// COMPONENTS
md += section("Shared Components (components/)");
if (compFiles.length === 0) {
  md += "- No files found under \`components/\`.\n";
} else {
  const groups = {};
  for (const f of compFiles) {
    const rel = path.relative(compDir, f).split(path.sep).join("/");
    const top = rel.split("/")[0];
    if (!groups[top]) groups[top] = [];
    groups[top].push(rel);
  }
  for (const [top, files] of Object.entries(groups)) {
    md += `- **${top}/** (${files.length} files)\n`;
    const show = files
      .slice(0, 8)
      .map((f) => "  - `" + f + "`")
      .join("\n");
    md += show + (files.length > 8 ? `\n  - … +${files.length - 8} more` : "") + "\n";
  }
}

// ASSETS / ICONS (heuristic)
md += section("Asset & Icon Signals");
const signals = new Set();
for (const f of [...appFiles, ...compFiles]) {
  const src = read(f);
  if (/from\s+['"]lucide-react-native['"]/.test(src)) signals.add("lucide-react-native icons");
  if (/from\s+['"]@expo\/vector-icons['"]/.test(src)) signals.add("@expo/vector-icons");
  if (/from\s+['"]expo-image['"]/.test(src)) signals.add("expo-image");
  if (/assets\/images\//.test(src)) signals.add("assets/images/* referenced");
  if (/assets\/Icons\//.test(src)) signals.add("assets/Icons/* referenced");
}
md += signals.size
  ? [...signals].map((s) => `- ${s}`).join("\n") + "\n"
  : "- No obvious asset/icon usage detected.\n";

process.stdout.write(md);
