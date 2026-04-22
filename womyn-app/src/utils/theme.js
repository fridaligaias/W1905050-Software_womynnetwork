const THEME_STORAGE_KEY = "womyn-theme";

export function getStoredTheme() {
    return localStorage.getItem(THEME_STORAGE_KEY);
}

export function getPreferredTheme() {
    const storedTheme = getStoredTheme();
    if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
    }

    return "light";
}

export function applyTheme(theme) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    return nextTheme;
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
    return applyTheme(currentTheme === "dark" ? "light" : "dark");
}

export function initTheme() {
    applyTheme(getPreferredTheme());
}
