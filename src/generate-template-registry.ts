import chalk from "chalk";
import { pascalCase } from "change-case";
import { execa } from "execa";
import { readJson } from "fs-extra/esm";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd as processCwd } from "node:process";
import {
  getEntries,
  isAddon,
  isEmberPackage,
  isV2Addon,
  toAngleBracketNotation,
  toRegistryKey,
} from "./helpers.js";
import {
  EntryType,
  type EmberPackageJson,
  type EntriesResult,
} from "./types.js";

const TAB = "  ";

export async function generateTemplateRegistry(cwd = processCwd()) {
  let packageJson: EmberPackageJson;

  try {
    packageJson = await readJson(join(cwd, "package.json"));
  } catch {
    throw new Error(
      `No "package.json" file found in the current working directory.`,
    );
  }

  if (typeof packageJson.name === "undefined") {
    throw new Error(`The found "package.json" file is missing a "name" entry.`);
  }

  if (isEmberPackage(packageJson) === false) {
    throw new Error("The current package is not an Ember app or addon.");
  }

  const entriesDir = isAddon(packageJson)
    ? isV2Addon(packageJson)
      ? "src"
      : "addon"
    : "app";

  const entries = await getEntries(join(cwd, entriesDir));

  if (
    entries.components.length === 0 &&
    entries.helpers.length === 0 &&
    entries.modifiers.length === 0
  ) {
    console.warn(
      chalk.yellow(
        "No component, helper or modifier gts/ts files found. An empty template registry will be generated.",
      ),
    );
  }

  const importRoot = isV2Addon(packageJson) ? "." : packageJson.name;

  let templateRegistryContent = "";

  for (const type in entries) {
    const typeEntries = entries[type as keyof EntriesResult];

    if (typeEntries.length === 0) {
      continue;
    }

    const imports = typeEntries.map((entry) => {
      let entryName = entry.name;

      if (isV2Addon(packageJson)) {
        entryName += entry.extension;
      }

      return `import type ${entry.identifier} from "${importRoot}/${type}/${entryName}";`;
    });

    templateRegistryContent += `// ${type}\n${imports.join("\n")}\n\n`;
  }

  templateRegistryContent += `export default interface ${pascalCase(packageJson.name)}Registry {\n`;

  const entriesContent: string[] = [];

  for (const type in entries) {
    const typeEntries = entries[type as keyof EntriesResult];

    if (typeEntries.length === 0) {
      continue;
    }

    let content = `${TAB}// ${type}\n`;

    typeEntries.forEach((entry) => {
      content += `${TAB}${toRegistryKey(entry.name)}: typeof ${entry.identifier};\n`;

      if (type === EntryType.Components) {
        content += `${TAB}${toRegistryKey(toAngleBracketNotation(entry.name))}: typeof ${entry.identifier};\n`;
      }
    });

    entriesContent.push(content);
  }

  templateRegistryContent += `${entriesContent.join("\n")}}\n`;

  const templateRegistryPath = join(cwd, entriesDir, "template-registry.ts");

  await writeFile(templateRegistryPath, templateRegistryContent);

  try {
    await execa("npx", ["prettier", "--write", templateRegistryPath]);
  } catch {
    // 🤫
  }

  console.log(
    chalk.green(`Template registry generated at ${templateRegistryPath}`),
  );
}
