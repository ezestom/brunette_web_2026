/** Lock the page while keeping the modal's own scroll container native. */
export function syncDialogScroll() {
  document.documentElement.classList.toggle(
    "has-modal",
    !!document.querySelector("dialog[open]"),
  );
}
