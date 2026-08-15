# SPX desktop downloads

These are prebuilt apps from this branch. Pick one zip, download it to your computer, and unzip it.

| Your computer | File |
|---|---|
| Mac with Apple silicon (M1 / M2 / M3 / M4) | `SPX-1.4.1-macos-arm64.zip` |
| Intel Mac | `SPX-1.4.1-macos-x64.zip` |
| Windows 64-bit | `SPX-1.4.1-windows-x64.zip` |
| Linux 64-bit | `SPX-1.4.1-linux-x64.zip` |

## Mac

1. Unzip the file.
2. Open the `SPX-1.4.1-macos-arm64` (or `...-x64`) folder.
3. Right-click `SPX.app` → **Open**. Confirm the Gatekeeper dialog.
4. The controller opens in your browser at http://localhost:5656
5. Quit SPX from the Dock icon to stop the server.

If macOS still blocks it:

```sh
xattr -cr SPX.app
```

Then right-click → Open again.

Not sure Intel vs Apple silicon? Apple menu → About This Mac. If the chip says M1/M2/M3/M4, use the arm64 zip.

## Windows

Unzip and double-click `SPX.exe` (or `start-spx.cmd`). Allow the firewall prompt if asked, then open http://localhost:5656
