function getCurrentRoute() {
    const hash = window.location.hash || "#/feed";

    if (hash.startsWith("#/profile")) return "#/profile";
    if (hash.startsWith("#/thread")) return "#/feed";
    if (hash.startsWith("#/circle")) return "#/circles";
    if (hash.startsWith("#/post")) return "#/post";
    if (hash.startsWith("#/mod")) return "#/mod";
    if (hash.startsWith("#/notifications")) return "#/notifications";
    if (hash.startsWith("#/settings")) return "#/settings";
    if (hash.startsWith("#/explore")) return "#/explore";

    return hash;
}

function getNavIcon(icon) {
    const icons = {
        home: `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
  <path fill-rule="evenodd" d="M11.293 3.293a1 1 0 0 1 1.414 0l6 6 2 2a1 1 0 0 1-1.414 1.414L19 12.414V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-3h-2v3a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2v-6.586l-.293.293a1 1 0 0 1-1.414-1.414l2-2 6-6Z" clip-rule="evenodd"/>
</svg>
`,
        explore: `<svg id='Search_24' width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'><rect width='24' height='24' stroke='none' fill='#000000' opacity='0'/><g transform="matrix(0.46 0 0 0.46 12 12)" ><path style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-dashoffset: 0; stroke-linejoin: miter; stroke-miterlimit: 4; fill-rule: nonzero; opacity: 1;" transform=" translate(-25.31, -24.81)" d="M 21 3 C 11.601563 3 4 10.601563 4 20 C 4 29.398438 11.601563 37 21 37 C 24.355469 37 27.460938 36.015625 30.09375 34.34375 L 42.375 46.625 L 46.625 42.375 L 34.5 30.28125 C 36.679688 27.421875 38 23.878906 38 20 C 38 10.601563 30.398438 3 21 3 Z M 21 7 C 28.199219 7 34 12.800781 34 20 C 34 27.199219 28.199219 33 21 33 C 13.800781 33 8 27.199219 8 20 C 8 12.800781 13.800781 7 21 7 Z" stroke-linecap="round" /></g></svg>`,
        circles: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.4771525 2 2 6.4771525 2 12C2 17.5228475 6.4771525 22 12 22C17.5228475 22 22 17.5228475 22 12C22 6.4771525 17.5228475 2 12 2Z"></path></svg>`,
        post: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20L18.5 9.5C19.6045695 8.3954305 19.6045695 6.6045695 18.5 5.5C17.3954305 4.3954305 15.6045695 4.3954305 14.5 5.5L4 16V20H8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M13.5 6.5L17.5 10.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16 18H20M18 16V20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
        mod: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L19 5V11C19 15.418 16.387 19.418 12 21C7.613 19.418 5 15.418 5 11V5L12 2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.5 11.8L11.2 13.5L14.8 9.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
        notifications: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C11.172 2 10.5 2.672 10.5 3.5V4.1953125C7.9131836 4.862095 6 7.2048001 6 10V16L4.4648438 17.15625C4.1745053 17.33988 4 17.658114 4 18C4 18.552285 4.4477153 19 5 19H19C19.552285 19 20 18.552285 20 18C20.000081 17.658114 19.825494 17.33988 19.537109 17.15625L18 16V10C18 7.2048001 16.086816 4.862095 13.5 4.1953125V3.5C13.5 2.672 12.828 2 12 2ZM10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20H10Z"></path></svg>`,
        profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM12 4.75C13.795 4.75 15.25 6.205 15.25 8C15.25 9.795 13.795 11.25 12 11.25C10.205 11.25 8.75 9.795 8.75 8C8.75 6.205 10.205 4.75 12 4.75ZM12 20C9.23 20 6.79 18.592 5.354 16.453C6.475 14.823 10.046 14 12 14C13.954 14 17.525 14.823 18.646 16.453C17.21 18.592 14.77 20 12 20Z"></path></svg>`,
        settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.490234 2C10.011234 2 9.6017656 2.3385938 9.5097656 2.8085938L9.1757812 4.5234375C8.3550224 4.8338012 7.5961042 5.2674041 6.9296875 5.8144531L5.2851562 5.2480469C4.8321563 5.0920469 4.33375 5.2793594 4.09375 5.6933594L2.5859375 8.3066406C2.3469375 8.7216406 2.4339219 9.2485 2.7949219 9.5625L4.1132812 10.708984C4.0447181 11.130337 4 11.559284 4 12C4 12.440716 4.0447181 12.869663 4.1132812 13.291016L2.7949219 14.4375C2.4339219 14.7515 2.3469375 15.278359 2.5859375 15.693359L4.09375 18.306641C4.33275 18.721641 4.8321562 18.908906 5.2851562 18.753906L6.9296875 18.1875C7.5958842 18.734206 8.3553934 19.166339 9.1757812 19.476562L9.5097656 21.191406C9.6017656 21.661406 10.011234 22 10.490234 22H13.509766C13.988766 22 14.398234 21.661406 14.490234 21.191406L14.824219 19.476562C15.644978 19.166199 16.403896 18.732596 17.070312 18.185547L18.714844 18.751953C19.167844 18.907953 19.66625 18.721641 19.90625 18.306641L21.414062 15.691406C21.653063 15.276406 21.566078 14.7515 21.205078 14.4375L19.886719 13.291016C19.955282 12.869663 20 12.440716 20 12C20 11.559284 19.955282 11.130337 19.886719 10.708984L21.205078 9.5625C21.566078 9.2485 21.653063 8.7216406 21.414062 8.3066406L19.90625 5.6933594C19.66725 5.2783594 19.167844 5.0910938 18.714844 5.2460938L17.070312 5.8125C16.404116 5.2657937 15.644607 4.8336609 14.824219 4.5234375L14.490234 2.8085938C14.398234 2.3385937 13.988766 2 13.509766 2H10.490234ZM12 8C14.209 8 16 9.791 16 12C16 14.209 14.209 16 12 16C9.791 16 8 14.209 8 12C8 9.791 9.791 8 12 8Z"></path></svg>`
    };

    return icons[icon] || "";
}

export function renderNavbar() {
    const currentRoute = getCurrentRoute();
    const navItems = [
        { href: "#/feed", label: "Home", icon: "home" },
        { href: "#/explore", label: "Explore", icon: "explore" },
        { href: "#/circles", label: "Circles", icon: "circles" },
        { href: "#/notifications", label: "Notifications", icon: "notifications" },
        { href: "#/profile", label: "Profile", icon: "profile" },
        { href: "#/settings", label: "Settings", icon: "settings" }
    ];
    const currentProfile = window.__womynCurrentUserProfile || null;

    if (currentProfile?.isModerator) {
        navItems.splice(4, 0, { href: "#/mod", label: "Mod Dashboard", icon: "mod" });
    }

    const linksHTML = navItems.map((item) => {
        const activeClass = currentRoute === item.href ? "navbar-link-active" : "";

        return `
            <li class="navbar-item">
                <a href="${item.href}" class="navbar-link ${activeClass}">
                    <span class="navbar-link-icon">${getNavIcon(item.icon)}</span>
                    <span class="navbar-link-label">${item.label}</span>
                </a>
            </li>
        `;
    }).join("");

    const postActiveClass = currentRoute === "#/post" ? "navbar-link-active" : "";

    return `
    <div class="navbar-wrapper">
        <div class="logo">
            <span class="logo-text">w</span>
        </div>
        <nav class="navbar" aria-label="Primary">
            <div class="navbar-actions">
                <a href="#/post" class="navbar-link navbar-post-link ${postActiveClass}">
                    <span class="navbar-link-icon">${getNavIcon("post")}</span>
                    <span class="navbar-link-label">Post</span>
                </a>
            </div>
            <ul class="navbar-list navbar-main-list">
                ${linksHTML}
            </ul>
        </nav>
    </div>
    `;
}
