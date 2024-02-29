// eslint-disable-next-line n/no-missing-import
import type { PackageJson } from "type-fest";

export type EntriesResult = Record<EntryType, Entry[]>;

export enum EntryType {
  Components = "components",
  Helpers = "helpers",
  Modifiers = "modifiers",
}

export interface Entry {
  extension: string;
  identifier: string;
  name: string;
}

export type EmberPackageJson = PackageJson & {
  ember?: {
    edition?: string;
  };
  "ember-addon"?: {
    version?: number;
  };
};
