import chalk from "chalk";
import { camelCase, pascalCase } from "change-case";
import { execa } from "execa";
import glob from "fast-glob";
import { pathExists, readJson } from "fs-extra/esm";
import { writeFile } from "node:fs/promises";
import { join, parse } from "node:path";
import { cwd as processCwd } from "node:process";

export async function generateTemplateRegistry(cwd = processCwd()) {
  let packageJson: any;

  try {
    packageJson = await readJson(join(cwd, "package.json"));
  } catch {
    throw new Error(
      `No "package.json" file found in the current working directory.`,
    );
  }

  const packageIsAddon = isAddon(packageJson);
  const packageIsV2Addon = isV2Addon(packageJson);

  const importRoot = packageIsV2Addon ? "." : packageJson.name;
  const srcDir = packageIsAddon ? (packageIsV2Addon ? "src" : "addon") : "app";

  const components = await getEntries(join(cwd, srcDir, "components"));
  const helpers = await getEntries(join(cwd, srcDir, "helpers"));
  const modifiers = await getEntries(join(cwd, srcDir, "modifiers"));

  const identifiers = new Identifiers();

  let templateRegistryContent = "";

  if (components.length > 0) {
    const componentImports = components.map(({ ext, path }) => {
      const identifier = identifiers.generate(path, pascalCase, "Component");
      const file = packageIsV2Addon ? path + ext : path;

      return `import type ${identifier} from "${importRoot}/components/${file}";`;
    });

    templateRegistryContent += "// Components:\n";
    templateRegistryContent += componentImports.join("\n") + "\n\n";
  }

  if (helpers.length > 0) {
    const helperImports = helpers.map(({ ext, path }) => {
      const identifier = identifiers.generate(path, camelCase, "Helper");
      const file = packageIsV2Addon ? path + ext : path;

      return `import type ${identifier} from "${importRoot}/helpers/${file}";`;
    });

    templateRegistryContent += "// Helpers:\n";
    templateRegistryContent += helperImports.join("\n") + "\n\n";
  }

  if (modifiers.length > 0) {
    const modifierImports = modifiers.map(({ ext, path }) => {
      const identifier = identifiers.generate(path, camelCase, "Modifier");
      const file = packageIsV2Addon ? path + ext : path;

      return `import type ${identifier} from "${importRoot}/modifiers/${file}";`;
    });

    templateRegistryContent += "// Modifiers:\n";
    templateRegistryContent += modifierImports.join("\n") + "\n\n";
  }

  templateRegistryContent += "export default interface Registry {\n";

  let entriesContent: string[] = [];

  if (components.length > 0) {
    let componentsContent = "  // Components:\n";

    components.forEach(({ path }) => {
      componentsContent += `  ${angleBracketNotation(path)}: typeof ${identifiers.for(path)};\n`;
      componentsContent += `  "${path}": typeof ${identifiers.for(path)};\n`;
    });

    entriesContent.push(componentsContent);
  }

  if (helpers.length > 0) {
    let helpersContent = "  // Helpers:\n";

    helpers.forEach(({ path }) => {
      helpersContent += `  "${path}": typeof ${identifiers.for(path)};\n`;
    });

    entriesContent.push(helpersContent);
  }

  if (modifiers.length > 0) {
    let modifiersContent = "  // Modifiers:\n";

    modifiers.forEach(({ path }) => {
      modifiersContent += `  "${path}": typeof ${identifiers.for(path)};\n`;
    });

    entriesContent.push(modifiersContent);
  }

  templateRegistryContent += entriesContent.join("\n") + "}\n";

  const templateRegistryPath = join(cwd, srcDir, "template-registry.ts");

  await writeFile(templateRegistryPath, templateRegistryContent);

  try {
    await execa("npx", ["prettier", "--write", templateRegistryPath]);
  } catch {
    // Move on.
  }

  console.log(
    chalk.green(`Template registry generated at ${templateRegistryPath}`),
  );
}

function isAddon(packageFile: any): boolean {
  return packageFile.keywords?.includes("ember-addon");
}

function isV2Addon(packageFile: any): boolean {
  return packageFile["ember-addon"]?.version === 2;
}

interface Entry {
  ext: string;
  path: string;
}

async function getEntries(dir: string): Promise<Entry[]> {
  const entries: Entry[] = [];

  if (await pathExists(dir)) {
    const files = await glob("**/*.{gjs,gts,ts}", { cwd: dir });

    files.sort().forEach((file) => {
      const parsed = parse(file);

      let path: string;
      if (parsed.name === "index") {
        path = parsed.dir;
      } else {
        path = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name;
      }

      entries.push({ ext: parsed.ext, path });
    });
  }

  return entries;
}

function angleBracketNotation(name: string) {
  const sep = "::";
  const result = name
    .split("/")
    .map((part) => pascalCase(part))
    .join(sep);

  if (result.includes(sep)) {
    return `"${result}"`;
  }

  return result;
}

class Identifiers {
  map: Record<string, string> = {};
  seen: Record<string, number> = {};

  for(name: string) {
    return this.map[name];
  }

  generate(
    name: string,
    transform: typeof camelCase | typeof pascalCase,
    suffix: string,
  ) {
    let identifier = `${transform(name)}${suffix}`;

    this.seen[identifier] = (this.seen[identifier] || 0) + 1;

    identifier += this.seen[identifier] > 1 ? this.seen[identifier] : "";

    this.map[name] = identifier;

    return identifier;
  }
}
