// winv-paste: posts Cmd+V as a synthetic keyboard event.
//
// Why this exists: Winv used to paste by shelling out to /usr/bin/osascript
// ("tell System Events to keystroke v ..."). osascript is a shared Apple
// platform binary, so macOS attributes the keystroke request to osascript
// itself — not to Winv — and refuses to honor Winv's Accessibility grant
// (error 1002 "osascript is not allowed to send keystrokes"). A helper that
// ships *inside* Winv.app inherits Winv as its responsible process, so the
// Accessibility grant on Winv applies and the keystroke is allowed.
import CoreGraphics
import Foundation

let vKeyCode: CGKeyCode = 9 // 'v'
let src = CGEventSource(stateID: .combinedSessionState)

guard
    let keyDown = CGEvent(keyboardEventSource: src, virtualKey: vKeyCode, keyDown: true),
    let keyUp = CGEvent(keyboardEventSource: src, virtualKey: vKeyCode, keyDown: false)
else {
    FileHandle.standardError.write("winv-paste: failed to create key events\n".data(using: .utf8)!)
    exit(1)
}

keyDown.flags = .maskCommand
keyUp.flags = .maskCommand

let tap: CGEventTapLocation = .cghidEventTap
keyDown.post(tap: tap)
usleep(12_000)
keyUp.post(tap: tap)
