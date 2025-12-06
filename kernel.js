/* MiniOS main logic */
let z = 100;
const openWindows = new Map();

// --- Window functions (global) ---
function openWindow(app, title, innerHTML, width = 560, height = 360) {
    const id = `${app}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const win = document.createElement("div");
    win.className = "window";
    win.style.width = width + "px";
    win.style.height = height + "px";
    win.style.left = (80 + Math.random() * 200) + "px";
    win.style.top = (60 + Math.random() * 80) + "px";
    win.style.zIndex = ++z;
    win.setAttribute("data-win-id", id);

    win.innerHTML = `
        <div class="titlebar" data-win-id="${id}">
            <div class="title">${title}</div>
            <div class="controls">
                <button class="min">—</button>
                <button class="close">✖</button>
            </div>
        </div>
        <div class="content">${innerHTML}</div>
    `;

    document.body.appendChild(win);
    win.style.opacity = 0;
    win.style.transform = "scale(0.9)";
    requestAnimationFrame(() => {
        win.style.transition = "all 0.25s ease";
        win.style.opacity = 1;
        win.style.transform = "scale(1)";
    });

    makeDraggable(win);

    win.querySelector(".close").addEventListener("click", () => closeWindow(id));
    win.querySelector(".min").addEventListener("click", () => toggleMinimize(id));

    openWindows.set(id, { el: win, app, minimized: false });
    addTaskbarButton(id, app, title);

    return win.querySelector(".content");
}

function closeWindow(id) {
    const rec = openWindows.get(id);
    if (!rec) return;
    const btn = document.querySelector(`.tb-app[data-win-id="${id}"]`);
    if (btn) btn.remove();

    rec.el.style.transition = "all 0.25s ease";
    rec.el.style.opacity = 0;
    rec.el.style.transform = "scale(0.9)";
    setTimeout(() => rec.el.remove(), 250);

    openWindows.delete(id);
}

function toggleMinimize(id) {
    const rec = openWindows.get(id);
    if (!rec) return;

    rec.minimized = !rec.minimized;
    rec.el.style.display = rec.minimized ? "none" : "block";

    const btn = document.querySelector(`.tb-app[data-win-id="${id}"]`);
    if (btn) btn.classList.toggle("active", !rec.minimized);
}

function restoreWindow(id) {
    const rec = openWindows.get(id);
    if (!rec) return;

    rec.minimized = false;
    rec.el.style.display = "block";
    rec.el.style.zIndex = ++z;

    const btn = document.querySelector(`.tb-app[data-win-id="${id}"]`);
    if (btn) btn.classList.add("active");
}

function addTaskbarButton(id, app, title) {
    const btn = document.createElement("button");
    btn.className = "tb-app active";
    btn.setAttribute("data-win-id", id);
    btn.title = title;

    const iconMap = {
        explorer: "📁",
        notepad: "📝",
        terminal: "💻",
        snake: "🐍",
        pong: "🏓",
		cube: "🧊"
    };
    btn.innerText = iconMap[app] || "•";

    btn.addEventListener("click", () => {
        const rec = openWindows.get(id);
        if (!rec) return;
        if (rec.minimized) restoreWindow(id);
        else toggleMinimize(id);
    });

    document.getElementById("taskbar-apps").appendChild(btn);
}

function makeDraggable(win) {
    const bar = win.querySelector(".titlebar");
    let dragging = false;
    let offsetX = 0, offsetY = 0;
    let currentX = 0, currentY = 0;

    const rect = win.getBoundingClientRect();
    currentX = win.offsetLeft;
    currentY = win.offsetTop;

    bar.addEventListener("mousedown", (e) => {
        dragging = true;
        offsetX = e.clientX - win.offsetLeft;
        offsetY = e.clientY - win.offsetTop;
        win.style.zIndex = ++z;
        document.body.style.cursor = "grabbing";
        win.style.transition = "none";
    });

    document.addEventListener("mouseup", () => {
        dragging = false;
        document.body.style.cursor = "";
    });

    document.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        const targetX = e.clientX - offsetX;
        const targetY = e.clientY - offsetY;

        currentX += (targetX - currentX) * 0.5;
        currentY += (targetY - currentY) * 0.5;

        win.style.left = currentX + "px";
        win.style.top = currentY + "px";
    });
}

// --- DOMContentLoaded and core logic ---
document.addEventListener("DOMContentLoaded", async () => {
    const boot = document.getElementById("boot-screen");
    const desktop = document.getElementById("desktop");
    const startButton = document.getElementById("start-button");
    const startMenu = document.getElementById("start-menu");
    const clockEl = document.getElementById("clock");
    const shutdown = document.getElementById("shutdown");
    const icons = document.querySelectorAll(".icon");
    const taskbarApps = document.getElementById("taskbar-apps");
    const notifications = document.getElementById("notifications");
    const loginScreen = document.getElementById("login-screen");
    const loginUsername = document.getElementById("login-username");
    const loginPassword = document.getElementById("login-password");
    const loginBtn = document.getElementById("login-btn");
    const signupBtn = document.getElementById("signup-btn");
    const loginError = document.getElementById("login-error");

    let validKeys = [];
    try {
        const res = await fetch("core/keys/keys.json");
        const raw = await res.json();
        validKeys = Array.isArray(raw.keys) ? raw.keys : [];
    } catch (e) {
        console.error("Failed to load keys:", e);
    }

    let disk = JSON.parse(localStorage.getItem("MiniOS_Disk") || "{}");
    if (!disk.accounts) disk.accounts = {};
    if (!disk.files) disk.files = {};
    if (!disk.accounts["admin"]) disk.accounts["admin"] = { password: "ad", files: {}, key: null };

    let currentUser = null;
    let fileSystem = {};
    const saveDisk = () => localStorage.setItem("MiniOS_Disk", JSON.stringify(disk));

    window.notify = (msg) => {
        const el = document.createElement("div");
        el.className = "notification";
        el.textContent = msg;
        notifications.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    };

    async function promptKey(user) {
        if (disk.accounts[user].key) return true;
        let attempts = 0;
        while (attempts < 3) {
            const keyInput = prompt("Enter your MiniOS key:");
            if (!keyInput) continue;
            if (validKeys.includes(keyInput.trim())) {
                disk.accounts[user].key = keyInput.trim();
                saveDisk();
                notify("Key validated!");
                return true;
            } else {
                alert("Invalid key.");
                attempts++;
            }
        }
        alert("Too many invalid attempts. Cannot log in.");
        return false;
    }

    async function login(username, password) {
        loginError.classList.add("hidden");
        if (!username || !password) {
            loginError.textContent = "Please fill in the username and password.";
            loginError.classList.remove("hidden");
            return false;
        }
        const acc = disk.accounts[username];
        if (acc && acc.password === password) {
            currentUser = username;
            fileSystem = JSON.parse(JSON.stringify(acc.files || {}));
            if (username !== "admin" && !acc.key) {
                const valid = await promptKey(username);
                if (!valid) return false;
            }
            loginScreen.style.display = "none";
            desktop.classList.remove("hidden");
            desktop.removeAttribute("aria-hidden");
            desktop.inert = false;
            notify(`Welcome, ${username}!`);
            return true;
        } else {
            loginError.textContent = "Invalid username or password.";
            loginError.classList.remove("hidden");
            return false;
        }
    }

    async function signup(username, password) {
        loginError.classList.add("hidden");
        if (!username || !password) {
            loginError.textContent = "Please fill in the username and password.";
            loginError.classList.remove("hidden");
            return false;
        }
        if (disk.accounts[username]) {
            loginError.textContent = "Username already exists.";
            loginError.classList.remove("hidden");
            return false;
        }
        disk.accounts[username] = { password, files: {}, key: null };
        saveDisk();
        const valid = await promptKey(username);
        if (!valid) {
            delete disk.accounts[username];
            saveDisk();
            return false;
        }
        notify(`Account created for ${username}`);
        return login(username, password);
    }

    loginBtn.addEventListener("click", () => login(loginUsername.value.trim(), loginPassword.value.trim()));
    signupBtn.addEventListener("click", () => signup(loginUsername.value.trim(), loginPassword.value.trim()));

    boot.style.display = "flex";
    boot.style.opacity = 1;
    loginScreen.style.display = "none";

    const bootDuration = 2000;
    setTimeout(() => {
        boot.classList.add("fade-out");
        setTimeout(() => {
            boot.style.display = "none";
            loginScreen.style.display = "flex";
        }, 900);
    }, bootDuration);

    const updateClock = () => clockEl.textContent = new Date().toLocaleTimeString();
    updateClock();
    setInterval(updateClock, 1000);

    startButton.addEventListener("click", e => {
        e.stopPropagation();
        startMenu.style.display = startMenu.style.display === "flex" ? "none" : "flex";
        startMenu.style.opacity = 0;
        requestAnimationFrame(() => {
            startMenu.style.transition = "opacity 0.2s ease";
            startMenu.style.opacity = 1;
        });
    });

    window.addEventListener("click", (e) => {
        if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
            startMenu.style.transition = "opacity 0.2s ease";
            startMenu.style.opacity = 0;
            setTimeout(() => startMenu.style.display = "none", 200);
        }
    });

    shutdown.addEventListener("click", () => {
        desktop.classList.add("hidden");
        boot.style.display = "flex";
        boot.querySelector(".boot-text").textContent = "Shutting down...";
        saveCurrentUserFiles();
        setTimeout(() => location.reload(), 1100);
    });

    // Apps registry
    const apps = {
        explorer: () => openExplorer(),
        notepad: (filename, content) => openNotepad(filename, content),
        terminal: () => openTerminal(),
        snake: () => openSnakeGame(),
        pong: () => openPongGame(),
		cube: () => openCubeApp()
    };

    [...icons, ...startMenu.querySelectorAll("[data-app]")].forEach(el => {
        const appName = el.dataset.app;
        el.addEventListener("dblclick", () => apps[appName]?.());
        el.addEventListener("click", () => {
            apps[appName]?.();
            startMenu.style.display = "none";
        });
    });

    function openExplorer() {
        const contentHtml = `<div id="files-root"></div>`;
        const content = openWindow("explorer", "File Explorer", contentHtml, 520, 360);
        renderExplorer(content.querySelector("#files-root"));
    }

    function renderExplorer(container) {
        const keys = Object.keys(fileSystem).sort();
        let html = `<div style="display:flex;gap:8px;margin-bottom:8px">
                       <button id="newfile" class="explorer-button">+ New</button>
                       <button id="refresh" class="explorer-button">Refresh</button>
                   </div>`;
        html += `<ul style="padding-left:14px">`;
        if (!keys.length) html += `<li><i>No files</i></li>`;
        else keys.forEach(k => html += `<li data-file="${k}" style="padding:6px;border-radius:6px;cursor:default">📄 ${k}</li>`);
        html += `</ul>`;
        container.innerHTML = html;

        container.querySelector("#newfile").addEventListener("click", () => {
            const name = prompt("New file name (include extension):", `note-${Date.now()}.txt`);
            if (!name) return;
            if (fileSystem[name]) return alert("File exists");
            fileSystem[name] = "";
            saveCurrentUserFiles();
            renderExplorer(container);
            notify(`File "${name}" created`);
        });

        container.querySelector("#refresh").addEventListener("click", () => renderExplorer(container));

        container.querySelectorAll("li[data-file]").forEach(li => {
            li.addEventListener("dblclick", () => apps.notepad(li.dataset.file, fileSystem[li.dataset.file]));
            li.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                const f = li.dataset.file;
                const choice = confirm(`Delete "${f}"?`);
                if (choice) {
                    delete fileSystem[f];
                    saveCurrentUserFiles();
                    renderExplorer(container);
                    notify(`File "${f}" deleted`);
                }
            });
        });
    }

    function openNotepad(filename, content = "") {
        if (fileSystem[filename] !== undefined) content = fileSystem[filename];
        const cont = openWindow("notepad", `Notepad - ${filename}`, `<textarea id="np-area">${escapeHtml(content)}</textarea>`, 560, 420);
        const ta = cont.querySelector("#np-area");
        ta.addEventListener("input", () => {
            fileSystem[filename] = ta.value;
            saveCurrentUserFiles();
        });
    }

    function openTerminal() {
        const html = `
            <div id="termout" style="font-family:monospace; font-size:12px; color:#6aff6a; background:#111; padding:8px; height:calc(100% - 30px); overflow-y:auto;">
                Welcome to MiniOS Terminal
                Type 'help' for commands.
            </div>
            <input id="termin" placeholder="Enter command and press Enter" style="width:100%; box-sizing:border-box; padding:4px; font-family:monospace; background:#222; color:#6aff6a; border:none; outline:none;" />
        `;
        const cont = openWindow("terminal", "Terminal", html, 520, 340);
        const out = cont.querySelector("#termout");
        const input = cont.querySelector("#termin");

        input.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                const cmd = input.value.trim();
                input.value = "";
                if (!cmd) return;
                out.textContent += `\n> ${cmd}`;
                handleCmd(cmd, out);
                out.scrollTop = out.scrollHeight;
            }
        });
    }

    function handleCmd(cmd, outEl) {
        const parts = cmd.split(" ").filter(Boolean);
        const base = parts[0]?.toLowerCase();
        switch (base) {
            case "help":
                outEl.textContent += "\nCommands: help, ls, mkdir <name>, cat <file>, rm <file>, edit <file>, clear, time, about, print <text>, alert <text>, exportdisk, importdisk, open <url>, eval <js>, snake, notify <text>, pong";
                if (currentUser === "Administrator") outEl.textContent += ", clralldata";
                break;
            case "ls":
                outEl.textContent += `\n${Object.keys(fileSystem).length ? Object.keys(fileSystem).join("\n") : "(no files)"}`;
                break;
            case "mkdir": {
                const name = parts[1];
                if (!name) outEl.textContent += "\nSpecify folder name";
                else {
                    fileSystem[name] = {};
                    saveCurrentUserFiles();
                    outEl.textContent += `\nFolder "${name}" created`;
                    notify(`Folder "${name}" created`);
                }
                break;
            }
            case "cat": {
                const f = parts[1];
                outEl.textContent += `\n${fileSystem[f] ?? "File not found."}`;
                break;
            }
            case "rm": {
                const f = parts[1];
                if (!f) outEl.textContent += "\nSpecify file";
                else if (fileSystem[f]) {
                    delete fileSystem[f];
                    saveCurrentUserFiles();
                    outEl.textContent += `\nDeleted ${f}`;
                    notify(`File "${f}" deleted`);
                } else outEl.textContent += "\nFile not found.";
                break;
            }
            case "edit": {
                const f = parts[1];
                if (!f) outEl.textContent += "\nSpecify file";
                else apps.notepad(f, fileSystem[f] ?? "");
                break;
            }
            case "clear":
                outEl.textContent = "";
                break;
            case "time":
                outEl.textContent += `\n${new Date().toString()}`;
                break;
            case "about":
                outEl.textContent += "\nMiniOS v1.3 — Browser-based OS simulation.";
                break;
            case "print": {
                const msg = parts.slice(1).join(" ");
                console.log("[MiniOS print]", msg);
                outEl.textContent += `\n${msg}`;
                break;
            }
            case "alert": {
                const msg = parts.slice(1).join(" ");
                alert(msg || "(empty)");
                break;
            }
            case "notify": {
                const msg = parts.slice(1).join(" ");
                notify(msg);
                break;
            }
            case "exportdisk": {
                const blob = new Blob([JSON.stringify(disk)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `MiniOS_disk_${Date.now()}.json`;
                a.click();
                outEl.textContent += "\nDisk exported";
                break;
            }
            case "importdisk": {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = e => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            disk = JSON.parse(reader.result);
                            saveDisk();
                            outEl.textContent += "\nDisk imported successfully";
                        } catch {
                            outEl.textContent += "\nFailed to import disk";
                        }
                    };
                    reader.readAsText(file);
                };
                input.click();
                break;
            }
            case "open": {
                const url = parts.slice(1).join(" ");
                if (!url) outEl.textContent += "\nSpecify URL";
                else window.open(url, "_blank");
                break;
            }
            case "eval": {
                if (currentUser !== "admin") outEl.textContent += "\nPermission denied";
                else {
                    try {
                        const res = eval(parts.slice(1).join(" "));
                        outEl.textContent += `\n${res}`;
                    } catch (e) {
                        outEl.textContent += `\nError: ${e}`;
                    }
                }
                break;
            }
            case "snake":
                apps.snake();
                break;
            case "pong":
                apps.pong();
                break;
            case "clralldata":
                if (currentUser === "admin" && confirm("Delete all disk data?")) {
                    disk = { accounts: {}, files: {} };
                    saveDisk();
                    outEl.textContent += "\nAll data cleared";
                } else outEl.textContent += "\nPermission denied";
                break;
            default:
                if (base) outEl.textContent += `\nUnknown command "${base}"`;
        }
    }

    function saveCurrentUserFiles() {
        if (currentUser) {
            disk.accounts[currentUser].files = JSON.parse(JSON.stringify(fileSystem));
            saveDisk();
        }
    }
	
	window.addEventListener("beforeunload", saveCurrentUserFiles);

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" })[m]);
    }

    console.log("kernel fully initialized");
});
