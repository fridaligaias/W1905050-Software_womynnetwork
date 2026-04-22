import { router } from "./utils/router.js";
import { initTheme } from "./utils/theme.js";

console.log("Womyn app running...");

initTheme();

//correct page when the user first opens the site
window.addEventListener("load", router);

//correct page whenever the URL changes
window.addEventListener("hashchange", router);
