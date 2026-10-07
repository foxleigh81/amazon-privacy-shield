# Amazon Privacy Shield

A small Chrome extension for recording Amazon browsing without showing your delivery name, postcode or account greeting. **One switch turns protection on or off across your Amazon tabs.**

- **Hide completely** (default): makes supported details invisible while preserving the page layout.
- **Blur**: a softer visual option. Use Hide for recordings containing sensitive information.
- Starts protected, remembers your choice locally, and responds to Amazon's dynamically updated labels.
- Toolbar badge shows **ON** or **OFF**. Optional shortcut: **Ctrl+Shift+Y**, or **⌘+Shift+Y** on macOS. Change it at `chrome://extensions/shortcuts` if it conflicts.
- No tracking, analytics, external requests, account access, or build step. MIT licensed.

## Install in Chrome

1. Download the extension ZIP from [Releases](https://github.com/foxleigh81/amazon-privacy-shield/releases/latest) and unzip it into a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder containing `manifest.json`.
4. Pin **Amazon Privacy Shield** using Chrome's extensions menu.
5. Refresh any Amazon tabs that were already open, then click the shield to turn protection on/off or choose Hide/Blur.

Alternatively, download this repository via **Code → Download ZIP**, unzip it and load the **extension** subfolder. No developer tools or package installation are required to use the extension. Keep the loaded folder in place. This is an unpacked extension, not a Chrome Web Store listing; Chrome may show developer-mode reminders. See [Chrome's installation guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## What it covers

Known desktop and mobile delivery labels in the Amazon navigation bar and product-page contextual delivery line, the account-menu greeting and profile name, plus the saved-address list and postcode inputs in the location picker. The coverage uses element selectors rather than anybody's actual name or postcode.

The extension runs on HTTPS Amazon storefronts: US, UK, Canada, Mexico, Brazil, Germany, France, Italy, Spain, Netherlands, Sweden, Poland, Belgium, Ireland, Japan, India, Australia, Singapore, UAE, Saudi Arabia, Türkiye, Egypt and South Africa. Selector fixtures are tested; every regional live layout has not been verified.

**This is a recording aid, not an all-page personal-data scrubber.** Checkout, orders, account settings, reviews, dropdowns and other Amazon interfaces may show details outside these covered elements. Amazon can change its interface. Preview the area you intend to record, including menus. Hide is recommended; blur can leave information inferable. For address changes, switch protection off temporarily.

## Privacy and permissions

The only API permission is `storage`, used to save two preferences: on/off and hide/blur. Amazon site access is needed to apply the local stylesheet. No personal text is read, stored or sent anywhere. The original details remain in Amazon's page and are only concealed visually; this does not anonymise your account or remove data from Amazon. Disable the extension or toggle it off to restore normal rendering.

Styles load at document start with Hide as the default while saved preferences are loading. This also means a tab may briefly conceal details even when your saved setting is Off. Reload existing Amazon tabs after installing, updating, disabling or removing the extension.

## Development

The `extension/` directory is the complete installable product. Node 20+ and Python 3 are used for tests and packaging only.

```sh
npm install
npx playwright install chromium
npm test
npm run package
```

Tests run in Chromium with the real unpacked extension, mocked Amazon pages, multiple tabs, dynamic labels, mode changes, the popup, storage persistence and the toolbar badge. They require no Amazon login. `dist/amazon-privacy-shield-1.0.0.zip` contains only the extension, with `manifest.json` at its root.

To report a missed label, open an issue with the storefront, page type and a **redacted** screenshot. Please do not publish your name, address, order details or other private information.

## License

[MIT](LICENSE). Unofficial and not affiliated with Amazon.
