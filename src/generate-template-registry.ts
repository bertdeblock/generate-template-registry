import chalk from "chalk";
import { camelCase, pascalCase } from "change-case";
import { pathExists, readJson } from "fs-extra/esm";
import { writeFile } from "node:fs/promises";
import { join, parse } from "node:path";
import { cwd as processCwd } from "node:process";
import recursiveReadDir from "recursive-readdir";

export async function generateTemplateRegistry(cwd = processCwd()) {
  let packageJson: any;

  try {
    packageJson = await readJson(join(cwd, "package.json"));
  } catch {
    throw new Error(
      `No "package.json" file found in the current working directory.`,
    );
  }

  const srcDir = isAddon(packageJson)
    ? isV2Addon(packageJson)
      ? "src"
      : "addon"
    : "app";

  const importRoot = isV2Addon(packageJson) ? "." : packageJson.name;

  const components = await getEntries(join(cwd, srcDir, "components"));
  const helpers = await getEntries(join(cwd, srcDir, "helpers"));
  const modifiers = await getEntries(join(cwd, srcDir, "modifiers"));

  let templateRegistryContent = "";

  if (components.length > 0) {
    const componentImports = components.map((name) => {
      return `import type ${pascalCase(name)}Component from "${importRoot}/components/${name}";`;
    });

    templateRegistryContent += "// Components:\n";
    templateRegistryContent += componentImports.join("\n") + "\n\n";
  }

  if (helpers.length > 0) {
    const helperImports = helpers.map((name) => {
      return `import type ${camelCase(name)}Helper from "${importRoot}/helpers/${name}";`;
    });

    templateRegistryContent += "// Helpers:\n";
    templateRegistryContent += helperImports.join("\n") + "\n\n";
  }

  if (modifiers.length > 0) {
    const modifierImports = modifiers.map((name) => {
      return `import type ${camelCase(name)}Modifier from "${importRoot}/modifiers/${name}";`;
    });

    templateRegistryContent += "// Modifiers:\n";
    templateRegistryContent += modifierImports.join("\n") + "\n\n";
  }

  templateRegistryContent += "export default interface Registry {\n";

  let entriesContent: string[] = [];

  if (components.length > 0) {
    let componentsContent = "  // Components:\n";

    components.forEach((name) => {
      componentsContent += `  ${angleBracketNotation(name)}: typeof ${pascalCase(name)}Component;\n`;
      componentsContent += `  "${name}": typeof ${pascalCase(name)}Component;\n`;
    });

    entriesContent.push(componentsContent);
  }

  if (helpers.length > 0) {
    let helpersContent = "  // Helpers:\n";

    helpers.forEach((name) => {
      helpersContent += `  "${name}": typeof ${camelCase(name)}Helper;\n`;
    });

    entriesContent.push(helpersContent);
  }

  if (modifiers.length > 0) {
    let modifiersContent = "  // Modifiers:\n";

    modifiers.forEach((name) => {
      modifiersContent += `  "${name}": typeof ${camelCase(name)}Modifier;\n`;
    });

    entriesContent.push(modifiersContent);
  }

  templateRegistryContent += entriesContent.join("\n") + "}\n";

  const templateRegistryPath = join(cwd, srcDir, "template-registry.ts");

  await writeFile(templateRegistryPath, templateRegistryContent);

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

async function getEntries(dir: string): Promise<string[]> {
  const paths: string[] = [];

  if (await pathExists(dir)) {
    const files = await recursiveReadDir(dir);

    files.forEach((file) => {
      const parsed = parse(file);
      const folder = parsed.dir.replace(`${dir}`, "");

      let path: string;
      if (parsed.name === "index") {
        path = folder.substring(1);
      } else {
        path = `${folder}/${parsed.name}`.substring(1);
      }

      if (paths.includes(path) === false) {
        paths.push(path);
      }
    });
  }

  return paths;
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
