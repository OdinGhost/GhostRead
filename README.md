GhostRead 👻

Read messages without marking them as read.

GhostRead is a BetterDiscord plugin designed to help you browse Discord conversations while preserving their server-side unread status.

Unlike plugins that simply hide or visually restore unread indicators, GhostRead attempts to intercept Discord’s outgoing read-acknowledgment requests before they reach Discord’s servers.

✨ Features

* Read Without Acknowledging: Browse server channels and private messages without intentionally updating their read positions.
* Server-Side Read Protection: Attempts to block outgoing read acknowledgments rather than simply changing notification badges.
* Unread Notification Preservation: Helps preserve unread messages, mentions, and notification counts.
* Manual Activation: Enable or disable protection whenever you want.
* Disabled by Default: Protection starts OFF whenever the plugin loads.
* Request Counter: Tracks the number of read-acknowledgment requests intercepted.
* Lightweight: Runs directly through BetterDiscord without requiring external services.

⚙️ How It Works

When GhostRead is activated, it hooks into selected Discord HTTP request functions and monitors outgoing requests associated with marking messages as read.

When a matching acknowledgment request is detected, GhostRead attempts to prevent it from reaching Discord’s servers.

Discord may still temporarily clear unread indicators locally while browsing. In successful cases, the original unread status and notification counts can return after restarting Discord and synchronizing with the server.

🛠️ How to Use

1. Install and enable GhostRead through BetterDiscord.
2. Open the plugin settings.
3. Click Activate GhostRead.
4. Browse your conversations.
5. Click Deactivate GhostRead when you want Discord to resume normal read behavior.

⚠️ Important Notes

GhostRead v0.6.0 is experimental. Server-channel testing has shown promising results, including restored unread notification counts after restarting Discord, but reliable preservation is not guaranteed.

Private-message behavior has not yet been independently verified. Discord updates may also change how acknowledgments work and affect compatibility.

GhostRead — Read freely. Stay unread. 👻
