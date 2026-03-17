// ── Watch ─────────────────────────────────────────────────────────────────────
// A single watch entry, mirroring the Notion database schema.
// The `tags` array is what the recommendation engine scores against.
export interface Watch {
  id: string          // Notion page ID — used for edit/delete
  name: string
  brand: string
  price: string       // Display string, e.g. "£1,200"
  tags: string[]
  pitch: string       // The 2–3 sentence "why this watch" copy
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export interface QuizOption {
  icon:  string
  label: string
  tags:  string[]
}

export interface QuizQuestion {
  ctx:  string         // Small eyebrow label, e.g. "Let's start simple"
  h:    string         // The question headline
  note: string         // Italic sub-copy beneath the question
  opts: QuizOption[]
}

// ── Submission ────────────────────────────────────────────────────────────────
// What gets sent to Resend + saved to Notion when someone fills the email form
export interface Submission {
  name:  string
  email: string
  extra: string        // Free-text "anything else?" field
  tags:  string[]      // All collected quiz tags — gives the human expert full context
}

// ── Budget tiers ──────────────────────────────────────────────────────────────
export const BUDGET_TIERS = [
  'budget_entry',
  'budget_mid',
  'budget_upper',
  'budget_luxury',
  'budget_personal',
] as const

export type BudgetTier = typeof BUDGET_TIERS[number]

export const BUDGET_LABELS: Record<BudgetTier, string> = {
  budget_entry:    'Under £300',
  budget_mid:      '£300 – £800',
  budget_upper:    '£800 – £2,000',
  budget_luxury:   '£2,000 – £3,000',
  budget_personal: 'Above £3,000',
}

// ── All available tags, grouped for the admin editor ─────────────────────────
export const TAG_GROUPS: Record<string, string[]> = {
  'Experience level': ['level_0','level_1','level_2','level_3','first_timer','one_watch','collector'],
  'Activity':         ['diver','sailor','pilot','traveller','racer','explorer','general','water','outdoors','sporty','versatile','gmt','speed','chrono','needs_wr'],
  'Style context':    ['formal','smart_casual','casual','sporty','everyday','crossover','active_dress','dress_context'],
  'Wrist & case':     ['small_wrist','med_wrist','large_wrist','case_36_38','case_39_42','case_43plus'],
  'Colour':           ['mono','colourful','bold_dial','clean_dial'],
  'Personality':      ['heritage','classic_soul','precision','technical','understated','honest','presence','statement'],
}
