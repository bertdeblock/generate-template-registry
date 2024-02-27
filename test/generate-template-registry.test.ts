import fsExtra from "fs-extra";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import recursiveCopy from "recursive-copy";
import { it } from "vitest";
import { generateTemplateRegistry } from "../src/generate-template-registry.ts";

it("generates a template registry for an app", async (ctx) => {
  const cwd = await copyBlueprint("app");
  await generateTemplateRegistry(cwd);

  const templateRegistryContent = await readFile(
    join(cwd, "app/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

it("generates a template registry for a v1 addon", async (ctx) => {
  const cwd = await copyBlueprint("v1-addon");
  await generateTemplateRegistry(cwd);

  const templateRegistryContent = await readFile(
    join(cwd, "addon/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

it("generates a template registry for a v2 addon", async (ctx) => {
  const cwd = await copyBlueprint("v2-addon");
  await generateTemplateRegistry(cwd);

  const templateRegistryContent = await readFile(
    join(cwd, "src/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

async function copyBlueprint(name) {
  const cwd = join("test/output", name);

  await fsExtra.remove(cwd);
  await recursiveCopy(join("test", "blueprints", name), cwd);

  return cwd;
}
