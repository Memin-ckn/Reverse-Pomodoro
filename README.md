# Reverse Pomodoro

**Study first, rest later.** Study for as long as you like, then earn **¼ of that time as rest**.
Studied 40 minutes? You get a 10-minute break.

No installation, no internet connection, no account. All you need is a web browser (Chrome, Firefox, Edge, Safari, …).

## Quick start

1. Download the latest ZIP from the [Releases](../../releases) page and **extract it** (don't run it from inside the ZIP).
2. Double-click the launcher for your system:

| System | File |
|---|---|
| Windows 10 / 11 | `Windows - Start.bat` |
| Linux (Ubuntu, Debian, Fedora, Mint, Arch, openSUSE, …) | `Linux - Start.sh` |
| macOS | `Mac - Start.command` |

The app opens in your default browser. That's it.

> **No launcher needed:** you can also just double-click `app/index.html` to open it in any browser.

## How to use

1. Click **Start studying** and get to work.
2. When you're done, click **Stop & rest**. Your earned rest time starts counting down.
3. A double beep sounds when the rest is over. Use **Pause** to hold the rest, or **Skip rest** to end it early.
4. **Max rest** sets an upper limit on rest time in minutes (`0` = no limit).
5. Today's sessions and totals are listed at the bottom.

## Privacy

Everything stays on your computer. Session history is stored in your browser's local storage and is never sent anywhere.
Use the same browser each time to keep seeing your history.

## Troubleshooting

- **Windows shows "Windows protected your PC":** click *More info* → *Run anyway*.
- **Linux opens the `.sh` file in a text editor:** right-click it → *Properties* → *Permissions* → enable *Allow executing as program* (or set the file manager to run executable text files). Or simply open `app/index.html`.
- **macOS says the file can't be opened:** right-click → *Open* → *Open*. If it isn't executable, run `chmod +x "Mac - Start.command"` in Terminal, or open `app/index.html` directly.

## Project structure

```
Reverse-Pomodoro/
├── Windows - Start.bat    Windows launcher
├── Linux - Start.sh       Linux launcher
├── Mac - Start.command    macOS launcher
├── app/                    The app (index.html, style.css, app.js, logic.js)
└── LICENSE                 MIT license
```

## Development

It's plain HTML, CSS and JavaScript with no build step or dependencies. Edit files in `app/` and reload the page.
Run the tests with [Node.js](https://nodejs.org):

```sh
node tests/test.js
```
## License

MIT - see [LICENSE](LICENSE).
