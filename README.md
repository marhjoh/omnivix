<p align="center">
  <img src="public/brand/logo-dark.svg#gh-light-mode-only" alt="Omnivix" width="200" />
  <img src="public/brand/logo-light.svg#gh-dark-mode-only" alt="Omnivix" width="200" />
</p>

<p align="center">
  Create LinkedIn, X, Bluesky, Twitch and other banners from your GitHub profile, repos, contributions or a favorite quote. Free, no sign-up.
  <br />
  <strong><a href="https://omnivix.vercel.app">omnivix.vercel.app</a></strong>
</p>

<p align="center">
  <a href="https://omnivix.vercel.app">
    <img src="public/landing/github-banner.webp" alt="Example GitHub Banner made with Omnivix: avatar, username and contribution calendar on a city background" width="800" />
  </a>
</p>

## Features

- **Four templates**
  - **GitHub Banner:** avatar, username and contribution calendar
  - **Repos Banner:** pinned or hand-picked repositories with languages, stars and forks
  - **Contribution Banner:** a large contribution heatmap
  - **Quote Banner:** a quote and author; needs no GitHub username
- **Three formats, one per aspect ratio:** 4:1 (LinkedIn, Buy Me a Coffee), 3:1 (X, Bluesky, Mastodon, Ko-fi) and 5:2 (Twitch, Patreon, Discord)
- **Backgrounds:** 14 built-in city, nature and abstract backgrounds, an https link, or your own upload; drag and zoom to place it
- **Customization:** color themes for the contribution grid, layout and size options, and toggles for profile photo, full name, labels and repo details
- **Export:** PNG or JPEG at 1×, 2× or 3× resolution, or copy the banner to the clipboard
- **Studio:** light and dark mode, and works on phones as well as desktop
- **Privacy:** no sign-in, and only public GitHub data

## Screenshots

<p align="center">
  <img src="docs/images/studio-demo.webp" alt="The studio cycling through the GitHub, Repos, Contribution and Quote templates, each on a city background" width="800" />
</p>

<table>
  <tr>
    <th>Landing page, dark mode</th>
    <th>Studio, light mode</th>
  </tr>
  <tr>
    <td><img src="docs/images/landing.webp" alt="Landing page with the Omnivix hero and a tilted wall of example banners" /></td>
    <td><img src="docs/images/studio-light.webp" alt="Studio in light mode: settings sidebar and a GitHub Banner preview on a photo background" /></td>
  </tr>
</table>

## Getting started

**Requirements:** Node.js 24 and pnpm 10. Run `corepack enable` once, and the `packageManager` field in `package.json` picks the right pnpm version.

```bash
git clone https://github.com/marhjoh/omnivix.git
cd omnivix
pnpm install
pnpm exec playwright install chromium   # browser used for PNG export
cp .env.example .env.local              # then fill in GITHUB_TOKEN
pnpm dev
```

Open http://localhost:3000. For a production build, run `pnpm build && pnpm start`. The checks CI runs are listed in [CONTRIBUTING.md](CONTRIBUTING.md#checks).

Without a `GITHUB_TOKEN`, the landing page and the Quote Banner still work, but the GitHub templates can't load data.

### Environment variables

| Variable                          | Needed                          | What it's for                                                                                                                    |
| --------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`                    | For the GitHub templates        | Reads public profiles, repos and contributions. A classic token with no scopes, or a fine-grained token with public read access. |
| `EXPORT_TOKEN_SECRET`             | On Vercel                       | Signs the short-lived export tokens. Use a long random string.                                                                   |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Only with Deployment Protection | Lets the export open `/render` on a protected deployment. See [Deployment](docs/deployment.md#deployment-protection).            |

## Documentation

- [Architecture](docs/architecture.md): project layout, rendering, export flow, GitHub data, theme
- [API](docs/api.md): routes, the export API and studio links
- [Deployment](docs/deployment.md): running your own copy on Vercel
- [`/llms.txt`](https://omnivix.vercel.app/llms.txt): every template's settings, generated from the code

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code guidelines and how to open a pull request. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Author

- Maintained by [@marhjoh](https://github.com/marhjoh).
- See [contributors](https://github.com/marhjoh/omnivix/graphs/contributors) for everyone who has helped shape the project.

## License

[MIT](LICENSE). This covers the code, not these third-party files, which keep their own licenses:

- Background photos in `public/backgrounds/`: [Unsplash License](https://unsplash.com/license). Each photographer is credited in [`src/backgrounds/presets.ts`](src/backgrounds/presets.ts)
- Inter font in `app/fonts/` and `src/og/fonts/`: [SIL Open Font License 1.1](https://openfontlicense.org)
