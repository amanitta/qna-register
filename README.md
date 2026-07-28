# Q&A Register

## What this is

This is a lightweight, self-contained tool for tracking Q&A exchanges with external parties (e.g., during a regulatory assessment). It runs entirely inside your web browser — there is no server, no installation, and no account to set up. All the questions, answers, and their history live in a single `json` file that should travel alongside the tool.

> _**Check the [instructions](#try-online) and try it out now!**_

Two files matter here:

- `.html` — the tool itself. This never needs to change.
- `.json` — the actual register: every question, answer, status, and edit. This is the file that gets updated.

## How to use it

### 1. First time: getting set up

1. Download both `.html` and the current `.json`, or simply `git clone` this repo.
2. Double-click `.html` to open it. Chrome or Edge is recommended for the smoothest experience.
3. Click *"Link to JSON..."* in the top bar and select the `.json` file you just downloaded. The full register will load.

### 2. Day to day: adding or answering a question

4. Select a question from the list on the left, or click *"+ New question"* to start a new one.
5. Use the Question / Answer toggle and the message box at the bottom to add your entry — Markdown and LaTeX formulas are supported, and you can paste in screenshots.
6. In Chrome or Edge, your edits save automatically into your local copy of the file as you go. In other browsers, click *"Save"* after each change to download an updated copy.

> **Before you start editing:**
> Make sure you've downloaded the most recent `.json`. If two people edit outdated copies at the same time, whoever uploads last will overwrite the other's changes.

## Typical use-case

Here we present the typical use-case for which this tool was first designed: a regulatory assessment process, where supervisory authorities need a structured way to raise questions to the company and track responses over several weeks or months.

1. **Kick-off.** The authorities' team creates the register (e.g. `assessment.json`), adds the first batch of questions grouped by topic and shares the `.json` file with the company.
2. **First response round.** The company links its copy of the `.html` to the shared `.json`. For each open thread, they add an **Answer** entry.
3. **Re-upload.** Once all answers for the round are drafted, the company re-uploads only the updated `.json` to the shared location, overwriting the previous version. The `.html` is never touched.
4. **Follow-up questions.** The authority reviews the answers. For anything unclear or incomplete, they add a follow-up **Question** entry in the same thread (keeping the full history visible), or open a new thread for a new topic. Threads can reference each other (e.g. *"See @Q-003 for the related methodology"*) to avoid repeating answers.
5. **Iteration.** This Q → A → follow-up-Q cycle repeats, with the `.json` file passing back and forth between the two parties, until every thread is marked as **Closed**.
6. **Close-out.** At the end of the assessment, the final `.json` serves as a complete, self-contained audit trail of the entire Q&A exchange — no emails to search through, no version-numbered Word documents, just one file with the full conversation history per topic.

## Try online

You can try the tool right now using the [GitHub Pages demo](https://amanitta.github.io/qna-register/):

1. Open the [demo page](https://amanitta.github.io/qna-register/).
2. Click *"Link to JSON…"* in the top bar.
3. Select [`template.json`](./template.json) after downloading it from this repository (or use your own `.json` register).
4. Explore the sample questions and answers, and try adding a new one.

> **Note:** Since the demo runs entirely in your browser, nothing you do there is saved anywhere online — refreshing the page or closing the tab will reset it, unless you keep it linked to a local `.json` file (Chrome/Edge auto-save) or click *"Save"* to download your changes.



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
- Only download the tool from the official shared location, never from a forwarded copy or an unfamiliar sender.
