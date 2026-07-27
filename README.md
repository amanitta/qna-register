# Q&A Register

## What this is

This is a lightweight, self-contained tool for tracking Q&A exchanges with external parties (e.g. during a regulatory assessment). It runs entirely inside your web browser — there is no server, no installation, and no account to set up. All the questions, answers, and their history live in a single `json` file that should travel alongside the tool.

> **Try it out [here](https://amanitta.github.io/qna-register/)!**<br>
_Tip: link the tool to the template.json you can find in the repo._

Two files matter here:

- `.html` — the tool itself. This never needs to change.
- `.json` — the actual register: every question, answer, status, and edit. This is the file that gets updated.

## How to use it

### 1. First time: getting set up

1. Download both `.html` and the current `.json`.
2. Save them on your computer (ideally in the same folder).
3. Double-click `.html` to open it. Chrome or Edge is recommended for the smoothest experience.
4. Click *"Open shared file…"* in the top bar and select the `.json` file you just downloaded. The full register will load.

### 2. Day to day: adding or answering a question

5. Select a question from the list on the left, or click *"+ New question"* to start a new one.
6. Use the Question / Answer toggle and the message box at the bottom to add your entry — Markdown and LaTeX formulas are supported, and you can paste in screenshots.
7. In Chrome or Edge, your edits save automatically into your local copy of the file as you go. In other browsers, click *"Save"* after each change to download an updated copy.

### 3. Sharing your changes back

8. When you're done, re-upload only the `.json` file to the shared location, overwriting the previous version.
9. Keep the filename exactly the same every time (e.g. `qna.json`) so it cleanly replaces the old one instead of creating duplicates.
10. Do not re-upload the `.html` file — the tool itself does not need to change.

> **Before you start editing:**
> Make sure you've downloaded the most recent `.json`. If two people edit outdated copies at the same time, whoever uploads last will overwrite the other's changes.

## Security & safety

Since this tool runs JavaScript in your browser, it's reasonable to ask what that actually means and whether it's safe to share. Here is a plain, honest account.

### What the tool does

- Runs entirely on your own computer, inside your browser. There is no server — nobody, including the person who built this tool, can see what you type or has access to your data.
- Reads and writes only the specific file you explicitly choose through your browser's file picker. It cannot access any other file on your computer.
- Keeps a temporary working copy in your browser's local storage as a safety net. This also stays on your machine and is never transmitted anywhere.

### What it loads from the internet

Every time the file is opened, it loads a small number of things from two public content-delivery networks:

- `cdnjs.cloudflare.com` — four well-established, widely used open-source code libraries (for Markdown formatting, safe HTML rendering, mathematical notation, and CSV handling).
- `fonts.googleapis.com` (and the associated `fonts.gstatic.com`) — the interface font.

These requests only fetch code and font files — no Q&A content, files, or personal data are ever sent as part of them. An internet connection is required for the tool to load correctly.

### Recommended precautions

- Treat the `.html` file as read-only. It should not need editing by anyone other than its maintainer — only the `.json` should ever be modified and re-shared.
- Restrict permissions accordingly. If both files sit in the same shared folder, give other participants Read/Download access to the `.html` and Edit access only to the `.json`.
- Only download the tool from the official shared location, never from a forwarded copy or an unfamiliar sender.
- If your organisation requires a security review before using externally shared tools, this is a good candidate for that process: it is a single, human-readable HTML file with nothing obfuscated or compiled.
