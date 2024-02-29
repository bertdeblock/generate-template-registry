import { pascalCase } from "change-case";
import glob from "fast-glob";
import { pathExists } from "fs-extra/esm";
import { join, parse } from "node:path";
import {
  EntryType,
  type EmberPackageJson,
  type EntriesResult,
} from "./types.js";

export async function getEntries(directory: string): Promise<EntriesResult> {
  const seenIdentifiers: Record<string, number> = {};
  const entriesResult: EntriesResult = {
    components: [],
    helpers: [],
    modifiers: [],
  };

  for (const entryType of Object.values(EntryType)) {
    const path = join(directory, entryType);

    if (await pathExists(path)) {
      const files = await glob("**/*.{gts,ts}", { cwd: path });
      const filesSorted = files.sort();

      for (let index = 0; index < filesSorted.length; index++) {
        const file = filesSorted[index];
        const fileParsed = parse(file);

        let name: string;
        if (fileParsed.name === "index") {
          name = fileParsed.dir;
        } else if (fileParsed.dir) {
          name = `${fileParsed.dir}/${fileParsed.name}`;
        } else {
          name = fileParsed.name;
        }

        let identifier = pascalCase(name);
        if (seenIdentifiers[identifier]) {
          seenIdentifiers[identifier] += 1;
          identifier += seenIdentifiers[identifier];
        } else {
          seenIdentifiers[identifier] = 1;
        }

        entriesResult[entryType as keyof EntriesResult].push({
          extension: fileParsed.ext,
          identifier,
          name,
        });
      }
    }
  }

  return entriesResult;
}

export function isAddon(packageJson: EmberPackageJson): boolean {
  if (Array.isArray(packageJson.keywords)) {
    return packageJson.keywords.includes("ember-addon");
  }

  return false;
}

export function isEmberPackage(packageJson: EmberPackageJson): boolean {
  return typeof packageJson.ember === "object";
}

export function isV2Addon(packageJson: EmberPackageJson): boolean {
  return packageJson["ember-addon"]?.version === 2;
}

export function toAngleBracketNotation(nameDasherized: string): string {
  return nameDasherized
    .split("/")
    .map((segment) => pascalCase(segment))
    .join("::");
}

export function toRegistryKey(key: string): string {
  if (key.includes("/") || key.includes("-") || key.includes(":")) {
    return `"${key}"`;
  }

  return key;
}
