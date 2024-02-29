export interface EntriesResult {
  components: Entry[];
  helpers: Entry[];
  modifiers: Entry[];
}

export interface Entry {
  extension: string;
  identifier: string;
  name: string;
}
