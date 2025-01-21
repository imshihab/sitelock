// theme-handler.js
document.addEventListener("DOMContentLoaded", function () {
    // Initialize system theme detection
    const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    // Get stored theme or default to system
    const currentTheme = localStorage.getItem("theme") || "system";

    // Apply the theme
    if (currentTheme === "system") {
        document.documentElement.setAttribute(
            "data-theme",
            systemThemeMedia.matches ? "dark" : "light"
        );
    } else {
        document.documentElement.setAttribute("data-theme", currentTheme);
    }

    // Listen for system theme changes
    systemThemeMedia.addEventListener("change", (e) => {
        if (localStorage.getItem("theme") === "system") {
            document.documentElement.setAttribute(
                "data-theme",
                e.matches ? "dark" : "light"
            );
        }
    });
});
