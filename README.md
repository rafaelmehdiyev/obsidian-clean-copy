# Clean Copy

I got tired of copying a note and pasting it somewhere only to see the YAML frontmatter at the top. 
So I made this plugin. It copies your note to clipboard without the frontmatter or cleans it before copy. That's the main thing.

---

## What it does

- Removes the `---` frontmatter block at the top
- Turns `[[wikilinks]]` into plain text
- Strips inline `#tags`
- Removes `^block-id` anchors
- Cleans up callout syntax (`> [!NOTE]` etc.)
- Optional: strip all Markdown formatting too (bold, italic, headings) — off by default

If you select text first, it copies just the selection. Otherwise it copies the whole note.

---

## Usage

- Click the **ribbon icon** on the left sidebar, or
- Use the command palette → **"Copy note without properties"**
- There's also a **"Copy as plain text"** command if you want everything stripped, including formatting

---

## Settings

Go to Settings → Clean Copy to toggle what gets removed. Everything is on by default except the Markdown formatting stripping.

---

## Author

[Rafael Mehdiyev](https://github.com/rafaelmehdiyev)
