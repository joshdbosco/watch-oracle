// src/lib/types.ts
// Shared types used across the app and API routes.

// ── Core watch type ────────────────────────────────────────────────────────
export interface Watch {
  id:    string
  name:  string
  brand: string
  price: string   // display string e.g. "£1,200"
  tags:  string[] // engine scoring tags
  pitch: string   // recommendation copy
}

// ── Quiz types ─────────────────────────────────────────────────────────────
export interface QuizOption {
  icon:  string
  label: string
  tags:  string[]
}

export interface QuizQuestion {
  ctx:  string        // kicker label e.g. "The one that changes everything"
  h:    string        // question heading
  note: string        // sub-note
  opts: QuizOption[]  // answer options
}

// ── Submission type ────────────────────────────────────────────────────────
export interface Submission {
  name:      string
  email:     string
  extra:     string
  tags:      string[]   // full collected quiz tags
  results:   string[]   // top 3 watch names shown to the user
  ip:        string     // client IP address
  userAgent: string     // browser user agent
  country:   string     // from Vercel/Cloudflare header
}

// ── Budget labels ──────────────────────────────────────────────────────────
export const BUDGET_LABELS: Record<string, string> = {
  budget_entry:    'Under £300',
  budget_mid:      '£300 to £800',
  budget_upper:    '£800 to £2,000',
  budget_luxury:   '£2,000 to £3,000',
  budget_personal: 'Above £3,000',
}

// ── All engine tags grouped for reference ─────────────────────────────────
export const TAG_GROUPS: Record<string, string[]> = {
  'Budget':      ['budget_entry','budget_mid','budget_upper','budget_luxury','budget_personal'],
  'Level':       ['level_0','level_1','level_2','level_3','first_timer','one_watch','collector'],
  'Activity':    ['diver','sailor','pilot','traveller','racer','explorer','general','water','outdoors','sporty','versatile','gmt','speed','chrono','needs_wr'],
  'Style':       ['formal','smart_casual','casual','everyday'],
  'Wrist/Size':  ['small_wrist','med_wrist','large_wrist','case_36_38','case_39_42','case_43plus'],
  'Colour':      ['mono','colourful','bold_dial','clean_dial'],
  'Personality': ['heritage','classic_soul','precision','technical','understated','honest','presence','statement'],
}
