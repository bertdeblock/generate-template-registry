import { cwd } from "node:process";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { generateTemplateRegistry } from "./generate-template-registry.js";

export async function cli() {
  const options = await yargs(hideBin(process.argv))
    .options({
      "include-curly-component-invocations": {
        default: false,
        describe:
          "Generate a template registry including curly component invocations",
        type: "boolean",
      },
      path: {
        describe: "Generate a template registry at a custom path",
        type: "string",
      },
    })
    .strict().argv;

  await generateTemplateRegistry(cwd(), {
    includeCurlyComponentInvocations: options.includeCurlyComponentInvocations,
    path: options.path,
  });
}
