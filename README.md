# Sudharsan V S

Personal site: Data Engineer building infrastructure for AI systems.

Plain HTML and CSS with a little JavaScript, no build step. `index.html` is the homepage. `ai-workflow.html`, `app-automation.html` and `data-pipelines.html` are case studies of production work at Edvoy (internal systems, no code); `copilot.html`, `review.html` and `rbac.html` are case studies of personal builds with public code.

- `pw.css` and `pw.js`: the "Paper & Wires" design shared by every page (the command line, the pipeline board, the case-study carousel, the architecture boards).
- `try.js`: the Try it demos. Each case study embeds its recorded data as JSON; nothing calls a model. The Permission-Aware RAG demo can also run the files in `demo/enterprise-rag/` in the browser with Pyodide.
- `cmdk.js` and `cmdk.css`: the Ctrl/Cmd+K search.
- `llms.txt` and `profile.json`: the same profile as plain text and JSON, for AI agents and tools.
- `og/`: social preview images.
