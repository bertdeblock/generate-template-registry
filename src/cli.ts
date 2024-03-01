import { cwd } from "node:process";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { generateTemplateRegistry } from "./generate-template-registry.js";

export async function cli() {
  const options = await yargs(hideBin(process.argv))
    .options({
      path: {
        describe: "Generate a template registry at a custom path",
        type: "string",
      },
    })
    .strict().argv;

  await generateTemplateRegistry(cwd(), { path: options.path });
}
