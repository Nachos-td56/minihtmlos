let unityGameWindow = null;

function openUnityGame() {
    if (unityGameWindow) return; // prevent multiple instances

    const contentHTML = `
        <iframe id="unity-iframe"
                src="./unity-build/index.html"
                style="width:100%; height:100%; border:none; background:#111;"
                allow="autoplay; fullscreen; accelerometer; gyroscope; magnetometer; xr-spatial-tracking;">
        </iframe>
    `;

    const content = openWindow("unitygame", "Project Car Sandbox", contentHTML, 920, 680);

    // Optional, bigger window size for most Unity games
    // Can change 920×680 to whatever fits your game best

    const closeBtn = content.closest(".window").querySelector(".close");
    closeBtn.addEventListener("click", () => {
        unityGameWindow = null;
    });

    unityGameWindow = content.closest(".window");
}

console.log("unitygame.js loaded");
