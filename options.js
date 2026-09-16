
function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function deriveHash(password, salt) {
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
      salt,
      iterations: 210000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(bits));
}

function normalizeHost(raw) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

const oldPasswordInput = document.getElementById("old-password");

async function hasPassword() {
  const { passwordHash, salt } = await chrome.storage.local.get(["passwordHash", "salt"]);
  return !!(passwordHash && salt);
}

async function initPasswordField() {
  if (await hasPassword()) {
    oldPasswordInput.style.display = "";
    oldPasswordInput.required = true;
  } else {
    oldPasswordInput.style.display = "none";
    oldPasswordInput.required = false;
  }
}

document.getElementById("save").addEventListener("click", async () => {
  const status = document.getElementById("status");
  const passwordAlreadyExists = await hasPassword();

  if (passwordAlreadyExists) {
    const { passwordHash, salt } = await chrome.storage.local.get(["passwordHash", "salt"]);
    const oldHash = await deriveHash(oldPasswordInput.value, salt);

    if (!timingSafeEqual(oldHash, passwordHash)) {
      status.textContent = "Current password is incorrect.";
      status.style.color = "#dc2626";
      oldPasswordInput.value = "";
      oldPasswordInput.focus();
      return;
    }
  }

  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;

  if (password.length < 8) {
    status.textContent = "Use at least 8 characters.";
    status.style.color = "#dc2626";
    return;
  }

  if (password !== confirm) {
    status.textContent = "Passwords do not match.";
    status.style.color = "#dc2626";
    return;
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordHash = await deriveHash(password, salt);

  await chrome.storage.local.set({
    passwordHash,
    salt: bytesToHex(salt)
  });

  status.textContent = passwordAlreadyExists ? "Password changed." : "Password saved.";
  status.style.color = "#15803d";

  oldPasswordInput.value = "";
  document.getElementById("password").value = "";
  document.getElementById("confirm").value = "";
});

initPasswordField();

async function renderWhitelist() {
  const { whitelist } = await chrome.storage.local.get("whitelist");
  const list = whitelist || [];
  const ul = document.getElementById("whitelist");
  ul.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No sites whitelisted yet.";
    ul.appendChild(empty);
    return;
  }

  list.forEach(host => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = host;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      const { whitelist: current } = await chrome.storage.local.get("whitelist");
      const updated = (current || []).filter(h => h !== host);
      await chrome.storage.local.set({ whitelist: updated });
      renderWhitelist();
    });

    li.append(span, removeBtn);
    ul.appendChild(li);
  });
}

document.getElementById("add-host").addEventListener("click", async () => {
  const input = document.getElementById("new-host");
  const host = normalizeHost(input.value);

  if (!host) return;

  if (host.includes(" ")) {
    input.value = "";
    return;
  }

  const { whitelist } = await chrome.storage.local.get("whitelist");
  const list = whitelist || [];

  if (!list.includes(host)) {
    list.push(host);
    list.sort();
    await chrome.storage.local.set({ whitelist: list });
  }

  input.value = "";
  renderWhitelist();
});

document.getElementById("new-host").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("add-host").click();
});

renderWhitelist();
