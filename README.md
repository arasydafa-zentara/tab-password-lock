
# Tab Password Lock

A simple Chrome Manifest V3 extension that places a password screen over whitelisted sites.

## Install

1. Extract this folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `tab-password-lock` folder.
6. Open the extension's **Details** page.
7. Click **Extension options**.
8. Set your password and add sites to the whitelist.

## Lock behavior

The lock screen appears on any whitelisted site. The unlock state is per-tab via `sessionStorage`.

- Refreshing the unlocked tab keeps it unlocked.
- Closing the tab locks it again.
- Switching away from and back to the tab re-locks it.
- Opening a whitelisted site in a new tab requires the password.

## Whitelist

Add hostnames of sites you want to protect. Supports wildcards:

- `mail.google.com` — locks only that exact host.
- `*.google.com` — locks any subdomain of `google.com`.

## Password

- The password itself is never stored; only a PBKDF2-derived hash and random salt are saved.
- Changing the password requires the current password.

## Security limitations

This is a convenience/privacy lock, not a strong security boundary.

Someone with access to the Chrome profile can potentially:
- disable or uninstall the extension;
- open a whitelisted site in a browser/profile where the extension is not installed;
- inspect browser data if they control the operating-system account.

For stronger protection, use a separate OS user account, lock the computer, and use your account's security features.
