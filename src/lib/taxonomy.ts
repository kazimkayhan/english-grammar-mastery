// The shape of English grammar used everywhere in the app:
// 4 families (small → big: Words → Verbs → Sentences → Text) and 16 pillars.

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const
export type Level = (typeof LEVELS)[number]

export const FAMILIES = ["words", "verbs", "sentences", "text"] as const
export type Family = (typeof FAMILIES)[number]

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
] as const
export type Pillar = (typeof PILLARS)[number]

export interface FamilyInfo {
  id: Family
  title: string
  tagline: string
  /** CSS custom property holding the family colour. */
  color: string
  soft: string
}

export const FAMILY_INFO: Record<Family, FamilyInfo> = {
  words: {
    id: "words",
    title: "Words",
    tagline: "The building blocks: nouns, determiners, pronouns, modifiers, prepositions.",
    color: "var(--fam-words)",
    soft: "var(--fam-words-soft)",
  },
  verbs: {
    id: "verbs",
    title: "Verbs",
    tagline: "The engine: tenses, modals, voice and verb patterns.",
    color: "var(--fam-verbs)",
    soft: "var(--fam-verbs-soft)",
  },
  sentences: {
    id: "sentences",
    title: "Sentences",
    tagline: "Putting it together: structure, clauses, conditionals, reported speech.",
    color: "var(--fam-sentences)",
    soft: "var(--fam-sentences-soft)",
  },
  text: {
    id: "text",
    title: "Text",
    tagline: "Beyond the sentence: linking, emphasis, style and mechanics.",
    color: "var(--fam-text)",
    soft: "var(--fam-text-soft)",
  },
}

export interface PillarInfo {
  id: Pillar
  number: number
  title: string
  short: string
  family: Family
  covers: string
}

export const PILLAR_INFO: Record<Pillar, PillarInfo> = {
  "word-classes": {
    id: "word-classes",
    number: 1,
    title: "Word classes & word formation",
    short: "Word classes",
    family: "words",
    covers: "parts of speech · prefixes · suffixes · conversion",
  },
  nouns: {
    id: "nouns",
    number: 2,
    title: "Nouns",
    short: "Nouns",
    family: "words",
    covers: "plural · countable/uncountable · compounds · possession",
  },
  determiners: {
    id: "determiners",
    number: 3,
    title: "Articles & determiners",
    short: "Determiners",
    family: "words",
    covers: "a/an/the/zero · this/that · quantifiers · numbers",
  },
  pronouns: {
    id: "pronouns",
    number: 4,
    title: "Pronouns",
    short: "Pronouns",
    family: "words",
    covers: "personal · possessive · reflexive · indefinite · generic",
  },
  modifiers: {
    id: "modifiers",
    number: 5,
    title: "Adjectives, adverbs & comparison",
    short: "Modifiers",
    family: "words",
    covers: "adjective order · adverbs · comparison · intensifiers",
  },
  prepositions: {
    id: "prepositions",
    number: 6,
    title: "Prepositions",
    short: "Prepositions",
    family: "words",
    covers: "place · time · movement · dependent · complex",
  },
  tenses: {
    id: "tenses",
    number: 7,
    title: "Tenses & aspect",
    short: "Tenses",
    family: "verbs",
    covers: "12 tenses = 3 times × 4 aspects · futures · habits · states",
  },
  modals: {
    id: "modals",
    number: 8,
    title: "Modal verbs",
    short: "Modals",
    family: "verbs",
    covers: "ability · permission · obligation · advice · deduction",
  },
  voice: {
    id: "voice",
    number: 9,
    title: "Voice",
    short: "Voice",
    family: "verbs",
    covers: "passive · causative · impersonal passive · ergative",
  },
  "verb-patterns": {
    id: "verb-patterns",
    number: 10,
    title: "Verb patterns",
    short: "Verb patterns",
    family: "verbs",
    covers: "-ing / to · objects · phrasal & prepositional verbs",
  },
  "sentence-structure": {
    id: "sentence-structure",
    number: 11,
    title: "Sentence structure",
    short: "Structure",
    family: "sentences",
    covers: "word order · questions · negation · tags · agreement",
  },
  clauses: {
    id: "clauses",
    number: 12,
    title: "Clauses",
    short: "Clauses",
    family: "sentences",
    covers: "relative · noun · adverbial · participle · infinitive",
  },
  conditionals: {
    id: "conditionals",
    number: 13,
    title: "Conditionals & hypothetical meaning",
    short: "Conditionals",
    family: "sentences",
    covers: "0–3 · mixed · wish · inverted · if-less",
  },
  "reported-speech": {
    id: "reported-speech",
    number: 14,
    title: "Reported speech",
    short: "Reported speech",
    family: "sentences",
    covers: "statements · questions · commands · reporting verbs",
  },
  linking: {
    id: "linking",
    number: 15,
    title: "Linking, emphasis & information structure",
    short: "Linking",
    family: "text",
    covers: "connectors · ellipsis · inversion · clefts · hedging",
  },
  style: {
    id: "style",
    number: 16,
    title: "Style & mechanics",
    short: "Style",
    family: "text",
    covers: "register · subjunctive · spoken/academic · US/UK · punctuation",
  },
}

export interface LevelInfo {
  id: Level
  title: string
  lessons: number
  weeks: number
  canDo: string
  persian: "full" | "tip" | "none"
}

export const LEVEL_INFO: Record<Level, LevelInfo> = {
  A1: {
    id: "A1",
    title: "Beginner",
    lessons: 35,
    weeks: 7,
    canDo: "Build simple sentences about yourself and daily life.",
    persian: "full",
  },
  A2: {
    id: "A2",
    title: "Elementary",
    lessons: 47,
    weeks: 9,
    canDo: "Talk about the past, the future, plans and comparisons.",
    persian: "full",
  },
  B1: {
    id: "B1",
    title: "Intermediate",
    lessons: 50,
    weeks: 10,
    canDo: "Use perfect tenses, the passive and reported speech, and link ideas.",
    persian: "tip",
  },
  B2: {
    id: "B2",
    title: "Upper-intermediate",
    lessons: 49,
    weeks: 10,
    canDo: "Use every tense, conditional and clause type accurately.",
    persian: "tip",
  },
  C1: {
    id: "C1",
    title: "Advanced",
    lessons: 39,
    weeks: 9,
    canDo: "Use inversion, clefts and hedging, and control register.",
    persian: "none",
  },
  C2: {
    id: "C2",
    title: "Mastery",
    lessons: 30,
    weeks: 7,
    canDo: "Use the subjunctive, stylistic structures and expert precision.",
    persian: "none",
  },
}

export const pillarsOf = (family: Family): PillarInfo[] =>
  PILLARS.map((p) => PILLAR_INFO[p]).filter((p) => p.family === family)

export const familyOf = (pillar: Pillar): FamilyInfo => FAMILY_INFO[PILLAR_INFO[pillar].family]

export const levelSlug = (level: Level) => level.toLowerCase()
