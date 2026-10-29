// The shape of English grammar used everywhere in the app:
// 4 families (small → big: Words → Verbs → Sentences → Text) and 16 pillars.

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type Level = (typeof LEVELS)[number];

export const FAMILIES = ["words", "verbs", "sentences", "text"] as const;
export type Family = (typeof FAMILIES)[number];

export const PILLARS = [
  "word-classes",
  "nouns",
  "determiners",
  "pronouns",
  "modifiers",
  "prepositions",
  "tenses",
  "modals",
  "voice",
  "verb-patterns",
  "sentence-structure",
  "clauses",
  "conditionals",
  "reported-speech",
  "linking",
  "style",
] as const;
export type Pillar = (typeof PILLARS)[number];

export interface FamilyInfo {
  /** CSS custom property holding the family colour. */
  color: string;
  id: Family;
  soft: string;
  tagline: string;
  title: string;
}

export const FAMILY_INFO: Record<Family, FamilyInfo> = {
  sentences: {
    color: "var(--fam-sentences)",
    id: "sentences",
    soft: "var(--fam-sentences-soft)",
    tagline:
      "Putting it together: structure, clauses, conditionals, reported speech.",
    title: "Sentences",
  },
  text: {
    color: "var(--fam-text)",
    id: "text",
    soft: "var(--fam-text-soft)",
    tagline: "Beyond the sentence: linking, emphasis, style and mechanics.",
    title: "Text",
  },
  verbs: {
    color: "var(--fam-verbs)",
    id: "verbs",
    soft: "var(--fam-verbs-soft)",
    tagline: "The engine: tenses, modals, voice and verb patterns.",
    title: "Verbs",
  },
  words: {
    color: "var(--fam-words)",
    id: "words",
    soft: "var(--fam-words-soft)",
    tagline:
      "The building blocks: nouns, determiners, pronouns, modifiers, prepositions.",
    title: "Words",
  },
};

export interface PillarInfo {
  covers: string;
  family: Family;
  id: Pillar;
  number: number;
  short: string;
  title: string;
}

export const PILLAR_INFO: Record<Pillar, PillarInfo> = {
  clauses: {
    covers: "relative · noun · adverbial · participle · infinitive",
    family: "sentences",
    id: "clauses",
    number: 12,
    short: "Clauses",
    title: "Clauses",
  },
  conditionals: {
    covers: "0–3 · mixed · wish · inverted · if-less",
    family: "sentences",
    id: "conditionals",
    number: 13,
    short: "Conditionals",
    title: "Conditionals & hypothetical meaning",
  },
  determiners: {
    covers: "a/an/the/zero · this/that · quantifiers · numbers",
    family: "words",
    id: "determiners",
    number: 3,
    short: "Determiners",
    title: "Articles & determiners",
  },
  linking: {
    covers: "connectors · ellipsis · inversion · clefts · hedging",
    family: "text",
    id: "linking",
    number: 15,
    short: "Linking",
    title: "Linking, emphasis & information structure",
  },
  modals: {
    covers: "ability · permission · obligation · advice · deduction",
    family: "verbs",
    id: "modals",
    number: 8,
    short: "Modals",
    title: "Modal verbs",
  },
  modifiers: {
    covers: "adjective order · adverbs · comparison · intensifiers",
    family: "words",
    id: "modifiers",
    number: 5,
    short: "Modifiers",
    title: "Adjectives, adverbs & comparison",
  },
  nouns: {
    covers: "plural · countable/uncountable · compounds · possession",
    family: "words",
    id: "nouns",
    number: 2,
    short: "Nouns",
    title: "Nouns",
  },
  prepositions: {
    covers: "place · time · movement · dependent · complex",
    family: "words",
    id: "prepositions",
    number: 6,
    short: "Prepositions",
    title: "Prepositions",
  },
  pronouns: {
    covers: "personal · possessive · reflexive · indefinite · generic",
    family: "words",
    id: "pronouns",
    number: 4,
    short: "Pronouns",
    title: "Pronouns",
  },
  "reported-speech": {
    covers: "statements · questions · commands · reporting verbs",
    family: "sentences",
    id: "reported-speech",
    number: 14,
    short: "Reported speech",
    title: "Reported speech",
  },
  "sentence-structure": {
    covers: "word order · questions · negation · tags · agreement",
    family: "sentences",
    id: "sentence-structure",
    number: 11,
    short: "Structure",
    title: "Sentence structure",
  },
  style: {
    covers: "register · subjunctive · spoken/academic · US/UK · punctuation",
    family: "text",
    id: "style",
    number: 16,
    short: "Style",
    title: "Style & mechanics",
  },
  tenses: {
    covers: "12 tenses = 3 times × 4 aspects · futures · habits · states",
    family: "verbs",
    id: "tenses",
    number: 7,
    short: "Tenses",
    title: "Tenses & aspect",
  },
  "verb-patterns": {
    covers: "-ing / to · objects · phrasal & prepositional verbs",
    family: "verbs",
    id: "verb-patterns",
    number: 10,
    short: "Verb patterns",
    title: "Verb patterns",
  },
  voice: {
    covers: "passive · causative · impersonal passive · ergative",
    family: "verbs",
    id: "voice",
    number: 9,
    short: "Voice",
    title: "Voice",
  },
  "word-classes": {
    covers: "parts of speech · prefixes · suffixes · conversion",
    family: "words",
    id: "word-classes",
    number: 1,
    short: "Word classes",
    title: "Word classes & word formation",
  },
};

export interface LevelInfo {
  canDo: string;
  id: Level;
  lessons: number;
  persian: "full" | "tip" | "none";
  title: string;
  weeks: number;
}

export const LEVEL_INFO: Record<Level, LevelInfo> = {
  A1: {
    canDo: "Build simple sentences about yourself and daily life.",
    id: "A1",
    lessons: 35,
    persian: "full",
    title: "Beginner",
    weeks: 7,
  },
  A2: {
    canDo: "Talk about the past, the future, plans and comparisons.",
    id: "A2",
    lessons: 47,
    persian: "full",
    title: "Elementary",
    weeks: 9,
  },
  B1: {
    canDo:
      "Use perfect tenses, the passive and reported speech, and link ideas.",
    id: "B1",
    lessons: 50,
    persian: "tip",
    title: "Intermediate",
    weeks: 10,
  },
  B2: {
    canDo: "Use every tense, conditional and clause type accurately.",
    id: "B2",
    lessons: 49,
    persian: "tip",
    title: "Upper-intermediate",
    weeks: 10,
  },
  C1: {
    canDo: "Use inversion, clefts and hedging, and control register.",
    id: "C1",
    lessons: 39,
    persian: "none",
    title: "Advanced",
    weeks: 9,
  },
  C2: {
    canDo: "Use the subjunctive, stylistic structures and expert precision.",
    id: "C2",
    lessons: 30,
    persian: "none",
    title: "Mastery",
    weeks: 7,
  },
};

export const pillarsOf = (family: Family): PillarInfo[] =>
  PILLARS.map((p) => PILLAR_INFO[p]).filter((p) => p.family === family);

export const familyOf = (pillar: Pillar): FamilyInfo =>
  FAMILY_INFO[PILLAR_INFO[pillar].family];

export const levelSlug = (level: Level) => level.toLowerCase();
