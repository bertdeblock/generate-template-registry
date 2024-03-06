# @bertdeblock/generate-template-registry

[![CI](https://github.com/bertdeblock/generate-template-registry/workflows/CI/badge.svg)](https://github.com/bertdeblock/generate-template-registry/actions?query=workflow%3ACI)
[![NPM Version](https://badge.fury.io/js/%40bertdeblock%2Fgenerate-template-registry.svg)](https://badge.fury.io/js/%40bertdeblock%2Fgenerate-template-registry)

Generate a [template registry](https://typed-ember.gitbook.io/glint/environments/ember/template-registry) for [Glint](https://github.com/typed-ember/glint).

## Usage

```shell
cd your/app-or-addon/path
```

and

```shell
npx @bertdeblock/generate-template-registry@latest
```

or

```shell
pnpx @bertdeblock/generate-template-registry@latest
```

or

```shell
bunx @bertdeblock/generate-template-registry@latest
```

## Options

### `--path`

Generate a template registry at a custom path.

```shell
npx @bertdeblock/generate-template-registry@latest --path="app/glint/template-registry.ts"
```

### `--include-curly-component-invocations`

Generate a template registry including curly component invocations. By default, curly component invocations are not included.

```shell
npx @bertdeblock/generate-template-registry@latest --include-curly-component-invocations
```

## Caveats

- If your app or addon has components, helpers or modifiers with the same name, duplicate template registry entries will be generated, which will need to be fixed manually
