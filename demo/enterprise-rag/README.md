# In-browser demo files

The `app/` files here are byte-for-byte copies from
[Sudharsan2816/Projects at commit eca020b](https://github.com/Sudharsan2816/Projects/tree/eca020b/enterprise-rag/app):
the intent classifier, query router, permission matrix, prompt-injection screen and access-denied message.
`query_checks.py` repeats the checks `POST /query` makes before retrieval
([routes.py, lines 126-153](https://github.com/Sudharsan2816/Projects/blob/eca020b/enterprise-rag/app/api/routes.py#L126-L153)).

`rbac.html` loads them into [Pyodide](https://pyodide.org) so a visitor can run them on any question.
Retrieval and answer generation need the server's data and a model, so the demo stops before them.
