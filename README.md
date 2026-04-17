# Winv

A lightweight clipboard manager for macOS. Press `⌥V` to instantly access your clipboard history and paste any previous item.

## Features

- Tracks clipboard history automatically in the background
- Global hotkey `⌥V` to open/close the window
- Click any item to paste it into the active app
- Star items to pin them to the top and protect them from auto-deletion
- Full-text search across clipboard history
- History stored locally in SQLite — nothing leaves your machine
- Configurable history retention (default: 30 days)

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌥V` | Open / close window |
| `↑` / `↓` | Navigate items |
| `Enter` | Paste selected item |
| `⌘F` or `/` | Focus search bar |
| `↓` (in search bar) | Jump to first result |
| `Escape` | Clear search → blur search bar → hide window |

## Install

Download the latest `.dmg` from [Releases](https://github.com/longpaus/clipboard-manager/releases), open it, and drag **Winv** to your Applications folder.

On first launch, macOS will block the app because it's unsigned. To open it:

1. Right-click `Winv.app` in Applications
2. Click **Open** then **Open** again in the dialog

You'll also need to grant **Accessibility** permission (System Settings > Privacy & Security > Accessibility) for the paste shortcut to work.

## Build from source

```bash
git clone https://github.com/longpaus/clipboard-manager.git
cd clipboard-manager
npm install
npm run build
```

The installer will be in `release/<version>/`.

## Development

```bash
npm run dev
```

## License

MIT
