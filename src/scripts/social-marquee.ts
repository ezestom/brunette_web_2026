/** A slow radial loop, with a small, decaying boost from downward page scroll. */
export function initSocialMarquees() {
  document
    .querySelectorAll<HTMLElement>("[data-social-marquee]")
    .forEach((section) => {
      if (section.dataset.initialized) return;
      section.dataset.initialized = "true";
      const ring = section.querySelector<HTMLElement>(".social-ring")!;
      const button = section.querySelector<HTMLButtonElement>(
        "[data-social-pause]",
      )!;
      const label = button.querySelector<HTMLElement>(
        "[data-social-pause-label]",
      )!;
      const videos = [...section.querySelectorAll<HTMLVideoElement>("video")];
      const visibleVideos = new Set<HTMLVideoElement>();
      const preference = matchMedia("(prefers-reduced-motion: reduce)");
      let cardStep = 20;
      function sizeStage() {
        if (preference.matches) return;
        cardStep = parseFloat(
          getComputedStyle(section).getPropertyValue("--card-step"),
        );
        const stage = section.querySelector<HTMLElement>(".social-stage")!;
        const orbit = section.querySelector<HTMLElement>(".social-orbit")!;
        const card = section.querySelector<HTMLElement>(".social-card")!;
        const radius = orbit.offsetWidth / 2;
        const halfWidth = card.offsetWidth / 2;
        const halfHeight = card.offsetHeight / 2;
        const innerRadius = radius - halfHeight;
        // The last corner must clear the side before reaching the stage floor.
        // Include room for the shadow so no opacity mask or bottom crop is needed.
        const exitAngle =
          Math.atan2(halfWidth, innerRadius) +
          Math.asin(
            Math.min(
              1,
              (stage.clientWidth / 2 + 24) / Math.hypot(innerRadius, halfWidth),
            ),
          );
        const height =
          radius +
          halfHeight +
          32 -
          innerRadius * Math.cos(exitAngle) +
          halfWidth * Math.sin(exitAngle) +
          32;
        section.style.setProperty("--stage-height", `${Math.ceil(height)}px`);
      }
      sizeStage();
      addEventListener("resize", sizeStage);
      let visible = false,
        paused = false,
        frame = 0;
      let angle = -8,
        boost = 0,
        previousTime = 0;
      let previousScroll = scrollY,
        scrollTime = performance.now();
      const running = () =>
        visible && !paused && !document.hidden && !preference.matches;
      function syncVideos() {
        videos.forEach((video) => {
          if (running() && visibleVideos.has(video)) {
            if (!video.getAttribute("src")) video.src = video.dataset.src!;
            video.muted = true;
            void video.play().catch(() => {
              /* Keep the poster if autoplay is unavailable. */
            });
          } else video.pause();
        });
      }
      function tick(time: number) {
        frame = 0;
        if (!running()) return;
        const delta = Math.min((time - previousTime) / 1000, 0.05);
        previousTime = time;
        angle = (angle - (1.2 + boost) * delta * (cardStep / 20)) % 360;
        boost *= Math.exp(-delta * 2);
        ring.style.transform = `rotate(${angle}deg)`;
        frame = requestAnimationFrame(tick);
      }
      function sync() {
        section.toggleAttribute("data-reduced-motion", preference.matches);
        if (preference.matches) ring.style.transform = "";
        if (running() && !frame) {
          previousTime = performance.now();
          frame = requestAnimationFrame(tick);
        } else if (!running()) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        syncVideos();
      }
      const sectionObserver = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      });
      sectionObserver.observe(section);
      const videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target as HTMLVideoElement;
            if (entry.isIntersecting) visibleVideos.add(video);
            else visibleVideos.delete(video);
          });
          syncVideos();
        },
        { threshold: 0.1 },
      );
      videos.forEach((video) => videoObserver.observe(video));
      button.addEventListener("click", () => {
        paused = !paused;
        button.setAttribute("aria-pressed", String(paused));
        button.setAttribute(
          "aria-label",
          paused ? "Reanudar carrusel" : "Pausar carrusel",
        );
        label.textContent = paused ? "Reanudar" : "Pausar";
        sync();
      });
      ring.addEventListener("focusin", (event) => {
        if (!preference.matches && event.target instanceof HTMLElement) {
          const card = event.target.closest(".social-card");
          // Only keyboard focus recenters a card; clicking follows its link.
          if (!card?.matches(":focus-visible")) return;
          const index = [...ring.children].indexOf(card!);
          if (index >= 0) {
            angle = -index * cardStep;
            ring.style.transform = `rotate(${angle}deg)`;
          }
        }
      });
      addEventListener(
        "scroll",
        () => {
          const time = performance.now();
          const distance = Math.max(0, scrollY - previousScroll);
          const velocity = distance / Math.max(16, time - scrollTime);
          if (running())
            boost = Math.min(6, boost + distance * 0.035 + velocity * 1.5);
          previousScroll = scrollY;
          scrollTime = time;
        },
        { passive: true },
      );
      preference.addEventListener("change", () => {
        sync();
        sizeStage();
      });
      document.addEventListener("visibilitychange", sync);
      addEventListener("pagehide", () => {
        cancelAnimationFrame(frame);
        frame = 0;
        videos.forEach((video) => video.pause());
      });
      addEventListener("pageshow", sync);
      sync();
    });
}
