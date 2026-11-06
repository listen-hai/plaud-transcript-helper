# Plaud Transcript Helper

English · [中文](README.zh-CN.md)

A Tampermonkey userscript for editing transcripts on [web.plaud.ai](https://web.plaud.ai): pinned per-segment edit buttons, find & replace with per-segment preview, bulk whole-sentence rewrites, serial saves through Plaud's own editor, post-reload verification, and restore of the last batch.

Version 1.0.0. The UI is available in **English and Chinese** — it follows your browser language, and the button in the panel's top-right corner switches and remembers it.

## Install

1. **Install Tampermonkey** from the [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. **Allow user scripts** (required on recent Chrome): open `chrome://extensions`, click **Details** on Tampermonkey, and turn on **Allow User Scripts**. On older Chrome versions, turn on **Developer mode** (top-right of `chrome://extensions`) instead.
3. **Install the script:** open the [latest release file](https://github.com/listen-hai/plaud-transcript-helper/releases/latest/download/plaud-transcript-helper.user.js). Tampermonkey shows an install page — click **Install** (or **Update** if you had 0.2.x; local change records are kept).
4. **Check it works:** open a recording on [web.plaud.ai](https://web.plaud.ai) and reload. A **Transcript Helper** button appears at the bottom right, and every segment gets an **Edit** button. The panel's top-right button switches between English and 中文.

Manual install: Tampermonkey → **Create a new script**, replace the template with the full contents of `plaud-transcript-helper.user.js`, save. (Manual installs don't auto-update.)

Updates: Tampermonkey checks the latest release automatically; you can also run **Utilities → Check for userscript updates**.

## Use

- **Single edits:** click **Edit** (or double-click the text), change it, then click outside the box. Ctrl/⌘ + Enter does the same; plain Enter inserts a line break.
- **Find & replace:** open the helper → **Scan all** → enter find/replace → **Preview replace**. Review each segment, check the ones you want, then **Submit checked**. Don't scroll or switch recordings while it runs.
- **Verify:** after submitting, reload Plaud and click **Verify last batch after reload**.
- **Restore:** **Preview restore of last batch** offers the original text back for segments that still match what was submitted.

The first time, submit and verify one obvious fix before doing a whole batch.

### Whole-sentence rewrites

Paste a JSON list under **Import whole-sentence / segment rewrites**:

```json
[
  {"time": "00:00:34", "speaker": "Speaker 1",
   "before": "Let's meet on the third floor at ten.",
   "after": "Let's meet on the third floor at two."}
]
```

`before` must be the segment's full current text. Time, speaker and full text must match exactly one segment, or the whole list is rejected. Imported items are previewed unchecked and can still be edited.

## Safety and privacy

- Nothing is checked or submitted by default; empty text is never submitted.
- Each save re-checks the original text first and stops on any conflict. Batches are not transactional: **Stop** halts the remaining segments, but one already submitted stays.
- No network calls, no tokens, no private Plaud APIs, no remote code. Edits go through the page's native editor.
- Change records (including original text) stay in local Tampermonkey storage until you click **Clear local change records**.
- The script does not listen to audio or guess meaning — judging names and ambiguous words is up to you.

## Testing

`plaud-helper-test.html` is a standalone fixture with 60 mock segments that simulates Plaud's virtual scrolling and click-outside save. Serve the folder locally (e.g. `python3 -m http.server`) and open the page. It cannot prove that Plaud's server saved anything.

Verified on real Plaud (0.2.3 save flow, 11/5/2026): 631 contiguous segments read; 140/140 revisions persisted after reload with timestamps, speakers and order unchanged. 1.0.0 adds only the UI language layer and was re-tested on the fixture in both languages.

## License

MIT
