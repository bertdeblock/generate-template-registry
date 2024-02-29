# @bertdeblock/generate-template-registry

[![CI](https://github.com/bertdeblock/generate-template-registry/workflows/CI/badge.svg)](https://github.com/bertdeblock/generate-template-registry/actions?query=workflow%3ACI)

Generate a [template registry](https://typed-ember.gitbook.io/glint/environments/ember/template-registry) for [Glint](https://github.com/typed-ember/glint).

## Usage

```shell
cd your/app-or-addon/path
```

and

```shell
npx @bertdeblock/generate-template-registry
```

or

```shell
pnpx @bertdeblock/generate-template-registry
```

or

```shell
bunx @bertdeblock/generate-template-registry
```

## Caveats

- If your app or addon has components, helpers or modifiers with the same name, duplicate template registry entries will be generated, which will need to be fixed manually
