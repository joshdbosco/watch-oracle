// src/lib/quiz.ts
// The quiz questions and the recommendation engine.
// Pure functions — no side effects, no API calls, easy to test.

import type { QuizQuestion, Watch } from './types'

// ── Questions ─────────────────────────────────────────────────────────────────
export const QUESTIONS: QuizQuestion[] = [
  {
    ctx:  "Let's start simple",
    h:    "How many watches do they own?",
    note: "This single answer shapes everything.",
    opts: [
      { icon:"○",  label:"None. First one ever.",       tags:["first_timer","level_0"] },
      { icon:"①",  label:"One. Worn every single day.", tags:["one_watch","level_1"]   },
      { icon:"◎",  label:"A few. They rotate.",         tags:["rotates","level_2"]     },
      { icon:"∞",  label:"Several. They're into it.",   tags:["collector","level_3"]   },
    ],
  },
  {
    ctx:  "The one that changes everything",
    h:    "What's their world?",
    note: "Pick the one that fits best — or closest.",
    opts: [
      { icon:"🤿", label:"Diving & water sports",           tags:["diver","water","needs_wr"]             },
      { icon:"⛵", label:"Sailing & the open sea",           tags:["sailor","water","needs_wr"]            },
      { icon:"✈️", label:"Flying — pilot or aviation fan",  tags:["pilot","explorer"]                     },
      { icon:"🌍", label:"Always travelling. GMT life.",     tags:["traveller","gmt","explorer"]           },
      { icon:"🏎",  label:"Motorsport — cars",               tags:["racer","speed","chrono"]               },
      { icon:"🏍",  label:"Bikes. Always bikes.",            tags:["racer","speed","outdoors"]             },
      { icon:"⛳", label:"Golf or tennis",                   tags:["smart_casual","crossover","versatile"] },
      { icon:"🎣", label:"Fishing. Or camping. Or both.",    tags:["explorer","outdoors"]                  },
      { icon:"🏔",  label:"Hiking, trail running, climbing", tags:["explorer","outdoors","sporty"]         },
      { icon:"🎨", label:"None — just loves beautiful things",tags:["general","versatile","everyday"]     },
    ],
  },
  {
    ctx:  "Reveals more than it seems",
    h:    "Dream car. Money no object.",
    note: "Not what they drive. What they secretly want.",
    opts: [
      { icon:"🏛",  label:"Classic — E-Type, old Porsche, vintage Merc", tags:["heritage","classic_soul"] },
      { icon:"🔬", label:"Precise — Ferrari, new 911, M3",               tags:["precision","technical"]   },
      { icon:"👁",  label:"Turns heads — Bentley, G-Wagon, Lambo",       tags:["presence","statement"]    },
      { icon:"✓",  label:"Sensibly brilliant — Golf R, Tesla, Volvo",    tags:["understated","honest"]    },
    ],
  },
  {
    ctx:  "A typical Saturday",
    h:    "How do they dress?",
    note: "Not their best day. Just them, being them.",
    opts: [
      { icon:"👔", label:"Always in a suit",           tags:["formal","dress_context"]   },
      { icon:"🧥", label:"Smart casual, considered",   tags:["smart_casual","crossover"] },
      { icon:"👖", label:"Jeans and something good",   tags:["casual","everyday"]        },
      { icon:"👟", label:"Sportswear — always ready",  tags:["sporty","active_dress"]    },
    ],
  },
  {
    ctx:  "One tiny detail",
    h:    "When they wear a watch it looks...",
    note: "A great watch on the wrong wrist is a wasted watch.",
    opts: [
      { icon:"←→", label:"A bit lost — slides around", tags:["small_wrist","case_36_38"]  },
      { icon:"✓",  label:"Just right",                  tags:["med_wrist","case_39_42"]    },
      { icon:"💪", label:"A touch small on them",       tags:["large_wrist","case_43plus"] },
    ],
  },
  {
    ctx:  "You know this immediately",
    h:    "Colour or no colour?",
    note: "Green dials, blue straps — or nothing loud?",
    opts: [
      { icon:"🟢", label:"Colour. The bolder the better.", tags:["colourful","bold_dial"] },
      { icon:"⬛", label:"Monochrome. Always.",             tags:["mono","clean_dial"]     },
    ],
  },
  {
    ctx:  "Last one",
    h:    "What are you comfortable spending?",
    note: "Every tier has something that'll make them stop and stare.",
    opts: [
      { icon:"·",   label:"Under £300",      tags:["budget_entry"]    },
      { icon:"··",  label:"£300 – £800",     tags:["budget_mid"]      },
      { icon:"···", label:"£800 – £2,000",   tags:["budget_upper"]    },
      { icon:"◈",   label:"£2,000 – £3,000", tags:["budget_luxury"]   },
      { icon:"✦",   label:"Above £3,000",    tags:["budget_personal"] },
    ],
  },
]

// ── Thinking phrases ──────────────────────────────────────────────────────────
export const THINKING_PHRASES = [
  "Cross-referencing the car with the dial...",
  "Making sure none of these are obvious...",
  "Would we give this to someone we love?...",
  "Narrowing from 83 watches to three...",
  "Not rushing this part.",
  "Matching wrist to case...",
  "Checking the story is worth telling...",
  "Almost there.",
]

// ── Recommendation engine ─────────────────────────────────────────────────────
// Budget is a hard filter. Everything else is scored by tag overlap.
// Returns the top 3 watches for the given tag collection.
export function recommend(watches: Watch[], tags: string[]): Watch[] {
  const budgetTag = tags.find(t => t.startsWith('budget_'))
  if (!budgetTag) return []

  return watches
    .filter(w => w.tags.includes(budgetTag))
    .map(w => ({
      watch: w,
      score: tags.filter(t => w.tags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.watch)
}

// ── Persona builder ───────────────────────────────────────────────────────────
// Generates the three text elements shown on the result page.
export interface Persona {
  headline:    string
  descriptor:  string
  insight:     string
}

export function buildPersona(tags: string[]): Persona {
  const has = (t: string) => tags.includes(t)

  const level =
    has('level_0') || has('first_timer') ? 'first' :
    has('level_1') || has('one_watch')   ? 'one'   :
    has('level_3') || has('collector')   ? 'col'   : 'two'

  const activity =
    has('diver')     ? 'diver'     :
    has('sailor')    ? 'sailor'    :
    has('racer')     ? 'racer'     :
    has('pilot')     ? 'pilot'     :
    has('traveller') ? 'traveller' :
    has('explorer')  ? 'explorer'  : 'general'

  const style =
    has('formal')       ? 'formal'  :
    has('sporty')       ? 'sporty'  :
    has('smart_casual') ? 'smart'   : 'casual'

  const character =
    has('heritage') || has('classic_soul') ? 'heritage'    :
    has('precision') || has('technical')   ? 'precision'   :
    has('presence') || has('statement')    ? 'presence'    : 'understated'

  const headlines: Record<string, string> = {
    first: "A First Watch Worth Remembering",
    one:   "A Watch They'll Wear Every Day of Their Life",
    two:   "The Watch Their Collection Has Been Missing",
    col:   "Something Worth Discovering",
  }

  const descriptors: Record<string, string> = {
    diver:    "They live closer to the water than most.",
    sailor:   "Salt air, open water, and a watch that genuinely belongs there.",
    racer:    "They feel most alive at speed. The watch should too.",
    pilot:    "Above the clouds, time matters differently.",
    traveller:"They live across time zones. The watch had better keep track.",
    explorer: "Always moving. The best view is always the next one.",
    general:  "A considered person deserves a considered watch.",
  }

  let insightKey = 'default'
  if (style === 'formal' && character === 'heritage')    insightKey = 'formal_heritage'
  else if (style === 'formal' && character === 'precision') insightKey = 'formal_precision'
  else if (character === 'understated')                  insightKey = 'understated'
  else if (style === 'sporty')                           insightKey = 'sporty'
  else if (level === 'col')                              insightKey = 'collector'

  const insights: Record<string, string> = {
    formal_heritage:  "They'll notice the dial finishing, the case proportions, the way it sits under a shirt cuff. Give them something that rewards that kind of attention.",
    formal_precision: "They live in a world where details signal everything. The right watch in the right room says more than a business card.",
    understated:      "The best gift isn't the one that shouts — it's the one that whispers to people who know.",
    sporty:           "They'll wear this hard. Get it wet, scratch the bracelet, love it more for it. Give them something honest enough to earn that.",
    collector:        "They'll Google it within 48 hours. Give them something with a story that isn't already in every magazine.",
    default:          "The best watches fit the person so precisely they forget it's there — until someone asks.",
  }

  return {
    headline:   headlines[level],
    descriptor: descriptors[activity],
    insight:    insights[insightKey],
  }
}
