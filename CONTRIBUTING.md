# Contributing

Thanks for your interest in improving this project!

## Local Setup

```bash
npm install
npm start
```

The site runs at `http://localhost:8082`.

## Making Changes

1. Fork the repository and create a feature branch.
2. Make your changes (`server.js`, `index.html`, `style.css`, `app.js`).
3. Format your code: `npx prettier --write .`
4. Run the API tests: `npm test`
5. Manually verify the UI using
   [`specs/001-speed-test-website/quickstart.md`](specs/001-speed-test-website/quickstart.md),
   including the responsive layout at 320px width.
6. Open a pull request describing the change and why it's needed.

## Reporting Issues

Please open a GitHub issue with steps to reproduce, expected behavior, and
actual behavior (including browser/OS if relevant to a UI bug).
