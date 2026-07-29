// ===========================================================================
// CLAIMS — the evidence graph.
//
// A claim is one checkable assertion about that night. The game is made of
// getting them, and quoting them at someone who disagrees.
//
// Naming: C_<SUBJECT>_<DETAIL>. Keep them alphabetically grouped by subject
// so the list stays readable as it grows past 20.
//
// Truth values live here as comments ONLY — never as story state. The player
// finds out by contesting, not by being told.
// ===========================================================================

LIST Claim =
    // --- the timeline of the night ---
    C_TIME_LEFT,        // TRUE  — Nell left the house on foot between 01:20 and 02:05
    C_TIME_CALL,        // TRUE  — she called someone at 01:38; call lasted 40 seconds
    C_TIME_GAP,         // TRUE  — T-7 is unaccounted for 01:40–01:55  <<< the load-bearing one
    // --- the car ---
    C_CAR_KEYS,         // TRUE  — you still had her car keys the next morning
    C_CAR_MOVED,        // FALSE — T-12: the car was moved before 02:00
    // --- the ford ---
    C_FORD_WATER,       // TRUE  — the ford was high; it had rained for two days
    C_FORD_LIGHT,       // FALSE — T-12: the ford light was out that night
    // --- people ---
    C_WHO_ARGUED,       // TRUE  — she argued with someone on the porch
    C_WHO_DROVE         // FALSE — T-12: someone else drove her home

// Claims the player currently holds.
VAR known = ()

// Claims that two selves have contradicted each other about.
VAR contested = ()

// Set by the UI immediately before jumping into a `quote_*` knot.
//
// A STRING, not a Claim list item, on purpose: the UI only has the claim id as
// text (it parsed it out of a tag), and assigning a raw string to an ink LIST
// variable throws inside inkjs. Quote handlers therefore compare with
// `quoting == "C_FOO"` rather than switching on a list value.
VAR quoting = ""

// ---------------------------------------------------------------------------
// gain(c, text, who)
//
// Files a claim into the evidence drawer. The tag is the ONLY contract with
// the UI: `# gain: <id> :: <display text> :: <source>`. src/lib/ink.ts parses
// it and files the claim instead of rendering it as a message, so the prose
// lives here and nowhere else.
//
// Delimiter is `::` and not `|` — a pipe is ink's alternatives operator and
// will not survive the parser inside a tag.
// ---------------------------------------------------------------------------
=== function gain(c, text, who) ===
    { known ? c:
        ~ return false
    }
    ~ known += c
    # gain: {c} :: {text} :: {who}
    ~ return true

// Marks a pair as mutually exclusive — the contest surface of the puzzle.
=== function contest(c) ===
    { contested ? c:
        ~ return false
    }
    ~ contested += c
    # contest: {c}
    ~ return true

=== function has(c) ===
    ~ return known ? c

=== function count_known() ===
    ~ return LIST_COUNT(known)
