// Menü (Hamburger ≤ 760 px) und Service Worker. Kein Tracking, keine Cookies, keine externen Aufrufe.
const btn = document.querySelector(".menu-btn");
const nav = document.getElementById("site-nav");
if (btn && nav) {
  const set = (open) => { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); };
  btn.addEventListener("click", () => set(!nav.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches) set(false); });
}
const secure = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
if (secure && "serviceWorker" in navigator) {
  const url = new URL("../../sw.js", import.meta.url);
  navigator.serviceWorker.register(url.href, { scope: new URL("../../", import.meta.url).pathname }).catch(() => {});
}
