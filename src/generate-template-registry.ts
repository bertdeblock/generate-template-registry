import chalk from "chalk";
import { pascalCase } from "change-case";
import { execa } from "execa";
import { ensureDir, readJson } from "fs-extra/esm";
import { writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { isAbsolute, join, parse } from "node:path";
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

export async function generateTemplateRegistry(
  cwd: string,
  options: {
    includeCurlyComponentInvocations?: boolean;
    path?: string;
  } = {
    includeCurlyComponentInvocations: false,
    path: "",
  },
) {
  let packageJson: EmberPackageJson;

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

  if (typeof packageJson.name === "undefined") {
    throw new Error(`The found "package.json" file is missing a "name" entry.`);
  }

  const isV2AddonPackage = isV2Addon(packageJson);
  const entriesDir = isAddon(packageJson)
    ? isV2AddonPackage
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

  const importRoot = isV2AddonPackage ? "." : packageJson.name;
  const templateRegistryImportsContent: string[] = [];
  const templateRegistryEntriesContent: string[] = [];

  for (const type in entries) {
    const typeEntries = entries[type as keyof EntriesResult];

    if (typeEntries.length === 0) {
      continue;
    }

    let importsContent = `// ${type}${EOL}`;
    let entriesContent = `${TAB}// ${type}${EOL}`;

    for (const entry of typeEntries) {
      let entryName = entry.name;

      if (isV2AddonPackage) {
        entryName += entry.extension;
      }

      importsContent += `import type ${entry.identifier} from "${importRoot}/${type}/${entryName}";${EOL}`;

      if (type === EntryType.Components) {
        entriesContent += `${TAB}${toRegistryKey(toAngleBracketNotation(entry.name))}: typeof ${entry.identifier};${EOL}`;
      }

      if (
        type !== EntryType.Components ||
        options.includeCurlyComponentInvocations
      ) {
        entriesContent += `${TAB}${toRegistryKey(entry.name)}: typeof ${entry.identifier};${EOL}`;
      }
    }

    templateRegistryImportsContent.push(importsContent);
    templateRegistryEntriesContent.push(entriesContent);
  }

  const templateRegistryPath = options.path
    ? isAbsolute(options.path)
      ? options.path
      : join(cwd, options.path)
    : join(cwd, entriesDir, "template-registry.ts");

  const templateRegistryContent = `${templateRegistryImportsContent.join(EOL)}
export default interface ${pascalCase(packageJson.name)}Registry {
${templateRegistryEntriesContent.join(EOL)}}
`;

  await ensureDir(parse(templateRegistryPath).dir);
  await writeFile(templateRegistryPath, templateRegistryContent);

  try {
    await execa("npx", ["prettier", "--write", templateRegistryPath]);
  } catch {
    // 🤫
  }

  console.log(
    chalk.green(`Template registry generated at ${templateRegistryPath}.`),
  );
}
