import { build } from "esbuild";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = dirname(here);
const outDir = join(pkgDir, "deploy");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const externals = [
  "firebase-functions",
  "firebase-functions/*",
  "firebase-admin",
  "firebase-admin/*",
  "zod",
  "@google-cloud/billing",
  "@google-cloud/*",
];

await build({
  entryPoints: [join(pkgDir, "lib/index.js")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(outDir, "index.js"),
  external: externals,
  logLevel: "info",
  banner: {
    js: "import { createRequire as __vetCreateRequire } from 'node:module';\nconst require = __vetCreateRequire(import.meta.url);",
  },
});

const orig = JSON.parse(await readFile(join(pkgDir, "package.json"), "utf8"));
const deployPkg = {
  name: orig.name,
  version: orig.version,
  private: true,
  type: "module",
  main: "index.js",
  engines: { node: "20" },
  dependencies: {
    "@google-cloud/billing": orig.dependencies["@google-cloud/billing"],
    "firebase-admin": orig.dependencies["firebase-admin"],
    "firebase-functions": orig.dependencies["firebase-functions"],
    zod: orig.dependencies.zod,
  },
  overrides: {
    uuid: "^11.1.1",
  },
};

await writeFile(
  join(outDir, "package.json"),
  JSON.stringify(deployPkg, null, 2) + "\n"
);

process.stdout.write(`installing runtime deps in ${outDir}...\n`);
execSync("npm install --omit=dev --no-package-lock --no-audit --no-fund", {
  cwd: outDir,
  stdio: "inherit",
});

process.stdout.write(`bundle ready: ${outDir}/index.js\n`);
