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
import type { EntriesResult } from "./types.js";

export async function generateTemplateRegistry(cwd = processCwd()) {
  let packageJson: any;

  try {
    packageJson = await readJson(join(cwd, "package.json"));
  } catch {
    throw new Error(
      `No "package.json" file found in the current working directory.`,
    );
  }

  if (isEmberPackage(packageJson) === false) {
    throw new Error("The current package is not an Ember app or addon.");
  }

  const importRoot = isV2Addon(packageJson) ? "." : packageJson.name;
  const entriesDir = isAddon(packageJson)
    ? isV2Addon(packageJson)
      ? "src"
      : "addon"
    : "app";

  const entries = await getEntries(join(cwd, entriesDir));

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

  let entriesContent: string[] = [];

  for (const type in entries) {
    const typeEntries = entries[type as keyof EntriesResult];

    if (typeEntries.length === 0) {
      continue;
    }

    let content = `  // ${type}\n`;

    typeEntries.forEach((entry) => {
      content += `  ${toRegistryKey(entry.name)}: typeof ${entry.identifier};\n`;

      if (type === "components") {
        content += `  ${toRegistryKey(toAngleBracketNotation(entry.name))}: typeof ${entry.identifier};\n`;
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
