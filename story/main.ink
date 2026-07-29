// ===========================================================================
// SURVIVOR BIAS — story entry point.
//
// Compile with:  node tools/build_story.mjs
// Output:        src/story.json  (imported by the app; never edit by hand)
//
// The UI drives navigation with ChoosePathString — there is no ink-side hub
// screen, because the contact list is a React surface. Each conversation knot
// ends at -> DONE and the player is returned to the contact list.
//
// One ink line == one message bubble. See story/README.md for the tag contract.
// ===========================================================================

INCLUDE claims.ink
INCLUDE t3.ink
INCLUDE t7.ink
INCLUDE t12.ink

// Fires once, on a cold start, before any conversation is opened.
// Tags are inline — see the header note in t3.ink for why.
=== boot ===
SIGNAL ACQUIRED — 3 BRANCHES REACHABLE # from: system
Local time 21:47. Thursday, the 14th. # from: system # delay: 1400
-> DONE
