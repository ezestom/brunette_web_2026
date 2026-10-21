import { syncDialogScroll } from "../lib/dialog-scroll";
const toggleSearch = document.querySelector<HTMLButtonElement>(
  "[data-action=toggle-search]",
);
const search = document.querySelector<HTMLElement>("#site-search");
const overlay = document.querySelector<HTMLElement>(".overlay-menu");
const header = document.querySelector("header");
const drawer = document.querySelector<HTMLDialogElement>(".Menu_Drawer");
const menuButton = document.querySelector<HTMLButtonElement>(
  "[data-action=open-side-menu]",
);
let closeTimer: ReturnType<typeof setTimeout>;
function setSearch(open: boolean) {
  search?.classList.toggle("open", open);
  if (search) search.inert = !open;
  toggleSearch?.setAttribute("aria-expanded", String(open));
  header?.classList.toggle("FilledSearch", open);
  overlay?.classList.toggle("open", open);
  if (open)
    setTimeout(
      () => search?.querySelector<HTMLInputElement>("input")?.focus(),
      450,
    );
}
toggleSearch?.addEventListener("click", () =>
  setSearch(!search?.classList.contains("open")),
);
document
  .querySelector("[data-action=close-search]")
  ?.addEventListener("click", () => {
    setSearch(false);
    toggleSearch?.focus();
  });
overlay?.addEventListener("click", () => setSearch(false));
function setMenu(open: boolean) {
  if (!drawer) return;
  clearTimeout(closeTimer);
  if (open) {
    setSearch(false);
    drawer.showModal();
    syncDialogScroll();
    requestAnimationFrame(() => drawer.classList.add("open"));
  } else {
    drawer.classList.remove("open");
    closeTimer = setTimeout(
      () => {
        drawer.close();
        syncDialogScroll();
        menuButton?.focus();
      },
      matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 1200,
    );
  }
  menuButton?.setAttribute("aria-expanded", String(open));
  document.dispatchEvent(
    new CustomEvent("brunette:drawer", { detail: { open } }),
  );
}
menuButton?.addEventListener("click", () => setMenu(true));
document
  .querySelector("[data-action=close-side-menu]")
  ?.addEventListener("click", () => setMenu(false));
drawer?.addEventListener("cancel", (event) => {
  event.preventDefault();
  setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && search?.classList.contains("open")) {
    setSearch(false);
    toggleSearch?.focus();
  }
});
