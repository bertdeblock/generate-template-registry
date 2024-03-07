import fsExtra from "fs-extra";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import recursiveCopy from "recursive-copy";
import { v4 as uuidv4 } from "uuid";
import { afterEach, it } from "vitest";
import { generateTemplateRegistry } from "../src/generate-template-registry.ts";

let cwd: string;

afterEach(() => fsExtra.remove(cwd));

it("generates a template registry for an app", async (ctx) => {
  cwd = await copyBlueprint("app");

  await generateTemplateRegistry(cwd);

  const templateRegistryContent = await readFile(
    join(cwd, "app/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

it("generates a template registry for a v1 addon", async (ctx) => {
  cwd = await copyBlueprint("v1-addon");

  await generateTemplateRegistry(cwd);

  const templateRegistryContent = await readFile(
    join(cwd, "addon/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

it("generates a template registry for a v2 addon", async (ctx) => {
  cwd = await copyBlueprint("v2-addon");

  await generateTemplateRegistry(cwd);

  const templateRegistryContent = await readFile(
    join(cwd, "src/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

it("generates a template registry at a custom path", async (ctx) => {
  cwd = await copyBlueprint("app");

  await generateTemplateRegistry(cwd, {
    path: "app/glint/template-registry.ts",
  });

  const templateRegistryContent = await readFile(
    join(cwd, "app/glint/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

it("generates a template registry including curly component invocations", async (ctx) => {
  cwd = await copyBlueprint("app");

  await generateTemplateRegistry(cwd, {
    includeCurlyComponentInvocations: true,
  });

  const templateRegistryContent = await readFile(
    join(cwd, "app/template-registry.ts"),
    "utf-8",
  );

  ctx.expect(templateRegistryContent).toMatchSnapshot();
});

async function copyBlueprint(name: "app" | "v1-addon" | "v2-addon") {
  const cwd = join("test/output", uuidv4());

  await recursiveCopy(join("test", "blueprints", name), cwd);

  return cwd;
}
