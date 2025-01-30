import Storage from "./esmls.js";

// Theme options
const themeOptions = {
    light: "light",
    dark: "dark",
    system: "system",
};

const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

function getCurrentTheme() {
    return Storage.get("theme") || themeOptions.system;
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

function resolveTheme(theme) {
    return theme === themeOptions.system
        ? systemThemeMedia.matches
            ? themeOptions.dark
            : themeOptions.light
        : theme;
}

function setTheme(theme) {
    Storage.set("theme", theme);
    applyTheme(resolveTheme(theme));
    updateActiveButton(theme);
}

function updateActiveButton(theme) {
    document.querySelectorAll(".theme-option").forEach((button) => {
        button.classList.toggle("active", button.dataset.theme === theme);
    });
}

function handleThemeChange() {
    if (getCurrentTheme() === themeOptions.system) {
        applyTheme(resolveTheme(themeOptions.system));
    }
}

// Initialize theme
const storedTheme = getCurrentTheme();
setTheme(storedTheme);

// Handle system theme changes
themeOptions.system &&
    systemThemeMedia.addEventListener("change", handleThemeChange);

// Listen for storage changes across tabs
Storage.onChange("theme", (newTheme) => {
    applyTheme(resolveTheme(newTheme));
    updateActiveButton(newTheme);
});

// Set up button handlers
document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.theme));
});
