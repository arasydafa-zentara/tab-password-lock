
# Gmail Password Lock

A simple Chrome Manifest V3 extension that places a password screen over Gmail.

## Install

1. Extract this folder.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `gmail-password-lock` folder.
6. Open the extension's **Details** page.
7. Click **Extension options**.
8. Set your password.
9. Open `https://mail.google.com`.

## Lock behavior

The unlock state is kept only in the Gmail tab's `sessionStorage`.

- Refreshing the unlocked Gmail tab keeps it unlocked.
- Closing the Gmail tab locks it again.
- Opening Gmail in a new tab requires the password again.

## Security limitations

This is a convenience/privacy lock, not a strong security boundary.

Someone with access to the Chrome profile can potentially:
- disable or uninstall the extension;
- open Gmail in a browser/profile where the extension is not installed;
- inspect browser data if they control the operating-system account.

For stronger protection, use a separate OS user account, lock the computer, and use Google's account security features.
