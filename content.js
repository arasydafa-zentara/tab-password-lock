
(async () => {
  const SESSION_KEY = "tabPasswordLockUnlocked";

  function matchHostname(hostname, patterns) {
    if (!patterns || patterns.length === 0) return false;
    return patterns.some(pattern => {
      if (pattern.startsWith("*.")) {
        const suffix = pattern.slice(1);
        return hostname.endsWith(suffix) || hostname === pattern.slice(2);
      }
      return hostname === pattern;
    });
  }

  function removeOverlay() {
    const el = document.getElementById("tab-password-lock-overlay");
    if (el) el.remove();
  }

  chrome.storage.onChanged.addListener(async (changes) => {
    if (!changes.whitelist) return;
    const { whitelist: newWhitelist } = await chrome.storage.local.get("whitelist");
    if (!newWhitelist || !matchHostname(window.location.hostname, newWhitelist)) {
      removeOverlay();
    }
  });

  setInterval(() => {
    try {
      chrome.runtime.getURL("");
    } catch (_) {
      removeOverlay();
    }
  }, 2000);

  const { whitelist } = await chrome.storage.local.get("whitelist");

  if (!whitelist || !matchHostname(window.location.hostname, whitelist)) return;

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }

  function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  async function deriveHash(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: hexToBytes(saltHex),
        iterations: 210000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    return bytesToHex(new Uint8Array(bits));
  }

  function createOverlay() {
    if (document.getElementById("tab-password-lock-overlay")) return;

    const hostname = window.location.hostname;

    const overlay = document.createElement("div");
    overlay.id = "tab-password-lock-overlay";

    const card = document.createElement("div");
    card.className = "tpl-card";

    const title = document.createElement("h1");
    title.textContent = "Site Locked";

    const subtitle = document.createElement("p");
    subtitle.textContent = `Enter the extension password to access ${hostname}.`;

    const input = document.createElement("input");
    input.type = "password";
    input.placeholder = "Password";
    input.autocomplete = "current-password";

    const button = document.createElement("button");
    button.textContent = "Unlock";

    const error = document.createElement("div");
    error.className = "tpl-error";

    card.append(title, subtitle, input, button, error);
    overlay.appendChild(card);

    const mount = () => {
      if (document.documentElement) {
        document.documentElement.appendChild(overlay);
        input.focus();
      } else {
        setTimeout(mount, 10);
      }
    };
    mount();

    const unlock = async () => {
      error.textContent = "";

      const { passwordHash, salt } = await chrome.storage.local.get([
        "passwordHash",
        "salt"
      ]);

      if (!passwordHash || !salt) {
        error.textContent = "No password configured. Open the extension Options page.";
        return;
      }

      const enteredHash = await deriveHash(input.value, salt);

      if (timingSafeEqual(enteredHash, passwordHash)) {
        sessionStorage.setItem(SESSION_KEY, "1");
        overlay.remove();
      } else {
        error.textContent = "Incorrect password.";
        input.value = "";
        input.focus();
      }
    };

    button.addEventListener("click", unlock);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") unlock();
    });
  }

  let initialLoad = true;

  if (sessionStorage.getItem(SESSION_KEY) !== "1") {
    createOverlay();
  }

  initialLoad = false;

  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      sessionStorage.removeItem(SESSION_KEY);
      const { whitelist: wl } = await chrome.storage.local.get("whitelist");
      if (wl && matchHostname(window.location.hostname, wl)) {
        createOverlay();
      }
    }
  });
})();
