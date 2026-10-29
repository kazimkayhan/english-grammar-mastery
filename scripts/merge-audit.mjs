// One-off: add the grammar points the reference audit found missing, map every audit item
// to them, and record each source's edition and status. Re-running is safe (idempotent).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, parseDocument } from "yaml";

const ROOT = join(import.meta.dirname, "../src/content");

// [id, title, level, lesson, matcher for the audit's suggestion text]
const NEW = [
  [
    "adverb-comparison",
    "Comparative and superlative adverbs (faster, more carefully, the best)",
    "A2",
    "a2-41",
    /comparatives? and superlatives? (?:of )?adverbs/iu,
  ],
  [
    "adverbs-place-direction",
    "Adverbs of place and direction (here, there, up, down, back, away, upstairs, abroad)",
    "A2",
    "a2-44",
    /adverbs of place and direction/iu,
  ],
  [
    "before-after-noun",
    "before / after + noun (before lunch, after class)",
    "A2",
    "a2-45",
    /before \/ after \+ noun/iu,
  ],
  [
    "can-perception",
    "can / could with verbs of perception (I can see it; I could hear voices)",
    "A2",
    "a2-21",
    /can \/ can't with verbs of perception|can \/ could with verbs of perception/iu,
  ],
  [
    "what-kind-of",
    "What kind / sort of …? (What kind of music do you like?)",
    "A2",
    "a2-01",
    /what kind \/ sort of/iu,
  ],
  [
    "with-without-description",
    "with / without for description (a girl with long hair, coffee without sugar)",
    "A2",
    "a2-45",
    /with \/ without for description/iu,
  ],
  [
    "ing-complement",
    "-ing after be (My hobby is swimming; The best thing is walking)",
    "B1",
    "b1-35",
    /-ing as complement/iu,
  ],
  [
    "in-period-future",
    "in + period of time for the future (in two weeks, in a few minutes)",
    "A2",
    "a2-11",
    /in \+ period of time/iu,
  ],
  [
    "could-possibility-suggestions",
    "could for possibility, offers and suggestions (It could rain; I could help; You could ask her)",
    "B1",
    "b1-17",
    /could for possibility, offers/iu,
  ],
  [
    "a-lot-adverb",
    "a lot, a bit, much, very much after verbs (I like it a lot; It helps a bit)",
    "A2",
    "a2-40",
    /a lot, a bit, much, very much/iu,
  ],
  [
    "something-to-adjective",
    "something / anything / nothing + to-infinitive or adjective (something to eat; nothing interesting)",
    "A2",
    "a2-32",
    /something \/ anything \/ nothing \+/iu,
  ],
  [
    "for-ing-purpose",
    "for + -ing for what a thing is for (a knife for cutting bread)",
    "A2",
    "a2-25",
    /for \+ -ing for purpose/iu,
  ],
  [
    "can-general-possibility",
    "can / could for general possibility (It can get very cold in November)",
    "B1",
    "b1-17",
    /general possibility/iu,
  ],
  [
    "not-ing",
    "not + -ing (I hate not knowing; He apologized for not calling)",
    "B1",
    "b1-35",
    /negative -ing/iu,
  ],
  [
    "will-orders",
    "will for orders and formal instructions (You will report to reception at nine)",
    "C1",
    "c1-10",
    /will for orders/iu,
  ],
  [
    "it-cleft-questions",
    "Questions with is it / was it … that (Where was it that you met?)",
    "C1",
    "c1-03",
    /questions with is it \/ was it/iu,
  ],
  [
    "own",
    "own (my own car; on my own; a car of my own)",
    "B1",
    "b1-43",
    /^own\b|own: my own house/iu,
  ],
  [
    "as-simultaneous",
    "as for things happening at the same time or changing together (As I walked home…; As it got darker…)",
    "B1",
    "b1-32",
    /as for simultaneous/iu,
  ],
  [
    "in-on-at-other",
    "in / on / at: other uses (on the left, on TV, in the newspaper, in the rain, at the age of)",
    "A2",
    "a2-45",
    /in \/ on \/ at: other uses/iu,
  ],
  [
    "questions-that-clauses",
    "Questions with that-clauses (Who did you say you saw?)",
    "B2",
    "b2-01",
    /questions with that-clauses/iu,
  ],
  [
    "with-noun-participle",
    "with + noun + participle; for meaning because (With so little time, we left; …, for it was late)",
    "C1",
    "c1-18",
    /with \+ noun \+ participle/iu,
  ],
  [
    "confusing-verb-pairs",
    "Easily confused verb pairs: borrow / lend, bring / take, rise / raise, lie / lay",
    "B1",
    "b1-16",
    /confusing verb pairs/iu,
  ],
  [
    "position-meaning-adjectives",
    "Adjectives whose meaning depends on position (the responsible person / the person responsible)",
    "C1",
    "c1-31",
    /meaning depends on position/iu,
  ],
  [
    "alternative-questions",
    "Alternative questions (Do you want tea or coffee?)",
    "A2",
    "a2-01",
    /alternative questions/iu,
  ],
  [
    "discontinuous-np",
    "Discontinuous noun phrases (A man arrived who wanted to see you)",
    "C2",
    "c2-08",
    /discontinuous noun phrases/iu,
  ],
  [
    "approximating-numbers",
    "Approximate numbers and amounts (about, roughly, -odd, a dozen, a couple of)",
    "B1",
    "b1-42",
    /approximating numbers/iu,
  ],
  [
    "supplementive-adjectives",
    "Detached adjective phrases (Tired and hungry, they went home)",
    "C1",
    "c1-22",
    /detached predicatives/iu,
  ],
  [
    "vocatives",
    "Vocatives and forms of address (Come here, John; Thank you, Mr. Smith) and their commas",
    "A2",
    "a2-47",
    /vocatives/iu,
  ],
  [
    "place-adverbial-verbs",
    "Verbs that need a place adverbial (live, put, stay, keep + where)",
    "A2",
    "a2-44",
    /need a place adverbial/iu,
  ],
  [
    "and-agreement",
    "Agreement with subjects joined by and (Ali and Sara are…; Bread and butter is…)",
    "B2",
    "b2-02",
    /subjects joined by and/iu,
  ],
  [
    "names-titles-agreement",
    "Agreement with names, titles and quotations (The Netherlands is…; Gulliver's Travels was…)",
    "C1",
    "c1-28",
    /names, titles and quotations/iu,
  ],
  [
    "nonstandard-agreement",
    "Non-standard agreement in speech (we was, he don't, there's three people), for recognition",
    "C2",
    "c2-25",
    /non-standard agreement/iu,
  ],
  [
    "kind-of-agreement",
    "kind of / sort of / type of + noun and agreement (these kinds of problem)",
    "B2",
    "b2-36",
    /kind of \/ sort of \/ type of/iu,
  ],
  [
    "semi-determiners",
    "Semi-determiners: same, other, certain, various, numerous, several",
    "C1",
    "c1-26",
    /semi-determiners/iu,
  ],
  [
    "us-uk-verb-spelling",
    "US and UK spelling of verb forms (traveled / travelled, learned / learnt, dreamed / dreamt)",
    "A2",
    "a2-07",
    /UK\/US spelling of verb forms/iu,
  ],
  [
    "postposed-adjectives",
    "Adjectives after nouns and pronouns (something interesting, the people involved, the president elect)",
    "B2",
    "b2-38",
    /postposed adjectives|adjectives after nouns and pronouns/iu,
  ],
  [
    "adjective-adjuncts",
    "Adjectives as sentence adjuncts (More importantly, Worse still, Strange to say)",
    "C1",
    "c1-30",
    /adjectives as sentence adjuncts/iu,
  ],
  [
    "pseudo-coordination",
    "go / come / try and + verb; nice and warm (go and see, try and come)",
    "B1",
    "b1-34",
    /pseudo-coordination|try \/ wait \+ and \+ verb/iu,
  ],
  [
    "adverbs-after-prepositions",
    "Adverbs after prepositions (from here, until now, since then, by then)",
    "B1",
    "b1-46",
    /adverbs after prepositions/iu,
  ],
  [
    "plural-modifiers",
    "Plural nouns as modifiers (a sports car, a savings account, customs officer)",
    "B2",
    "b2-34",
    /plural nouns as modifiers/iu,
  ],
  [
    "that-omission",
    "Leaving out that (I think you're right; He said he'd come)",
    "B1",
    "b1-26",
    /omitting that|leaving out that/iu,
  ],
  [
    "to-clause-complement",
    "to-infinitive after be (My aim is to win; The best thing is to wait)",
    "B1",
    "b1-33",
    /subject predicative to-clauses|to-infinitive as complement of be/iu,
  ],
  [
    "speech-repair",
    "Repairs, false starts and unfinished sentences in speech",
    "C2",
    "c2-19",
    /repair, false starts/iu,
  ],
  [
    "continuous-infinitive",
    "Continuous infinitive (to be sitting; She seems to be working)",
    "B2",
    "b2-28",
    /continuous infinitive/iu,
  ],
  [
    "same-singular-plural",
    "Same form in singular and plural (sheep, fish, aircraft, deer)",
    "A1",
    "a1-08",
    /same form in singular and plural/iu,
  ],
  [
    "adjective-commas",
    "Commas and and between adjectives (a big, old house; tall and dark)",
    "B2",
    "b2-38",
    /commas and 'and' between adjectives/iu,
  ],
  [
    "modals-conditional-main",
    "Modals in conditional main clauses (If it rains, we could / might / should…)",
    "B1",
    "b1-23",
    /modals in conditional main clauses/iu,
  ],
  [
    "emphatic-imperative",
    "Emphatic imperative with do (Do sit down; Do be careful)",
    "B2",
    "b2-45",
    /emphatic imperative/iu,
  ],
  [
    "prep-before-that",
    "Prepositions before wh- and that-clauses (depending on whether…; sure that…)",
    "B2",
    "b2-41",
    /prepositions before conjunctions/iu,
  ],
  [
    "declarative-questions",
    "Declarative questions (You're leaving? That's the boss?)",
    "B1",
    "b1-01",
    /declarative questions/iu,
  ],
  [
    "adverb-modifying",
    "Adverbs modifying adverbs, prepositions and noun phrases (right past me, well over ten, almost home)",
    "C1",
    "c1-30",
    /adverbs modifying adverbs/iu,
  ],
  [
    "movement-particles",
    "Verbs of movement with adverb particles (She ran in; He walked off)",
    "B1",
    "b1-14",
    /verbs of movement with adverb particles/iu,
  ],
  [
    "passive-object-complement",
    "Passive with an object complement (He was considered a genius; She was elected captain)",
    "C1",
    "c1-13",
    /passive with object complement/iu,
  ],
  [
    "noun-active-passive-infinitive",
    "Active or passive infinitive after nouns (a lot to do / to be done; a house to rent)",
    "C1",
    "c1-22",
    /active or passive infinitive after nouns/iu,
  ],
  [
    "distributive-plural",
    "Distributive plural (They took off their coats)",
    "B2",
    "b2-02",
    /distributive plural/iu,
  ],
  [
    "more-determiner",
    "more as a determiner and pronoun (more coffee; more of the book)",
    "A2",
    "a2-31",
    /more as a determiner/iu,
  ],
  [
    "too-good-a-chance",
    "so / too / how / as + adjective + a + noun (too good a chance; as big a problem as)",
    "C1",
    "c1-26",
    /so \/ too \/ how \/ as \+ adjective/iu,
  ],
  [
    "measurement-adjectives",
    "Measurement: two meters tall; How tall / deep / old…?",
    "B1",
    "b1-39",
    /measurement adjectives/iu,
  ],
  [
    "not-or-nor",
    "not … or / not … nor; and not (She didn't write or call)",
    "B1",
    "b1-41",
    /not \.\.\. or \/ not \.\.\. nor/iu,
  ],
  [
    "any-no-comparative",
    "any / no + comparative (no better; any longer)",
    "B1",
    "b1-45",
    /any \/ no \+ comparative/iu,
  ],
  ["as-well-as", "as well as + noun / -ing", "B1", "b1-48", /^as well as/iu],
];

const syllabus = new Map(
  parse(readFileSync(join(ROOT, "syllabus/syllabus.yaml"), "utf8")).map((s) => [
    s.id,
    s,
  ])
);

// 1 · Add points to the inventory file of their lesson's pillar.
const existing = new Set(
  readdirSync(join(ROOT, "inventory")).flatMap((f) =>
    parse(readFileSync(join(ROOT, "inventory", f), "utf8")).points.map(
      (p) => p.id
    )
  )
);
const byPillar = {};
for (const [id, title, level, lesson] of NEW) {
  const s = syllabus.get(lesson);
  if (!s) {
    throw new Error(`unknown lesson ${lesson} for ${id}`);
  }
  if (s.level !== level) {
    throw new Error(`${id}: level ${level} but ${lesson} is ${s.level}`);
  }
  if (existing.has(id)) {
    continue;
  }
  byPillar[s.pillar] ??= [];
  byPillar[s.pillar].push(
    `  - { id: ${id}, title: ${JSON.stringify(title)}, level: ${level}, lesson: ${lesson}, sources: [] }`
  );
}
for (const [pillar, lines] of Object.entries(byPillar)) {
  const file = join(ROOT, "inventory", `${pillar}.yaml`);
  const text = readFileSync(file, "utf8").trimEnd();
  writeFileSync(
    file,
    `${text}\n  # added from the reference audit\n${lines.join("\n")}\n`
  );
}

// 2 · Map unmapped audit items to the new points; 3 · record edition and status.
const report = [];
const sourcesDoc = parseDocument(
  readFileSync(join(ROOT, "audit/sources.yaml"), "utf8")
);
for (const f of readdirSync(join(ROOT, "audit")).filter(
  (name) => name !== "sources.yaml"
)) {
  const path = join(ROOT, "audit", f);
  const doc = parseDocument(readFileSync(path, "utf8"));
  const data = doc.toJS();
  const items = doc.get("items");
  let mapped = 0;
  const left = [];
  items?.items.forEach((node, i) => {
    const item = data.items[i];
    if (item.maps?.length || item.outOfScope) {
      return;
    }
    const text = item.suggest?.title ?? item.item;
    const hit = NEW.find(([, , , , re]) => re.test(text));
    if (hit) {
      node.set("maps", doc.createNode([hit[0]], { flow: true }));
      mapped += 1;
    } else {
      left.push(text);
    }
  });
  writeFileSync(path, doc.toString({ lineWidth: 0 }));

  const total = data.items?.length ?? 0;
  const unmapped =
    data.items.filter((it) => !(it.maps?.length || it.outOfScope)).length -
    mapped;
  let status = "pending";
  if (total) {
    status = unmapped === 0 && data.verified === true ? "mapped" : "collected";
  }
  const src = sourcesDoc.contents.items.find(
    (n) => n.get("code") === data.source
  );
  // The short edition label in sources.yaml is curated by hand; only the status is updated.
  src?.set("status", status);
  report.push(
    `${data.source}: ${total} items, newly mapped ${mapped}, still unmapped ${unmapped}${left.length ? ` → ${left.join(" | ")}` : ""}`
  );
}
writeFileSync(
  join(ROOT, "audit/sources.yaml"),
  sourcesDoc.toString({ lineWidth: 0 })
);
console.log(report.join("\n"));
console.log(`new points: ${Object.values(byPillar).flat().length}`);
