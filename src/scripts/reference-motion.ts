// @ts-nocheck
/** Public-reference motion. Commerce remains owned by the React islands. */
async function initReferenceMotion() {
  if (document.documentElement.dataset.referenceMotion) return;
  document.documentElement.dataset.referenceMotion = "ready";
  await document.fonts.ready;
  const gsap = window.gsap,
    ScrollTrigger = window.ScrollTrigger;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const all = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const one = (selector, root = document) => root.querySelector(selector);
  const timers = [];
  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  // Use the reference's Lenis build and a single GSAP clock. Touch stays native.
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  let lenis;
  const scrollTick = (time) => lenis?.raf(time * 1000);
  const syncScrollLock = () => {
    const locked = document.documentElement.classList.contains("has-modal");
    if (!lenis || lenis.isStopped === locked) return;
    locked ? lenis.stop() : lenis.start();
  };
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.setAttribute("data-lenis-prevent", "");
  });
  const scrollLockObserver = new MutationObserver(syncScrollLock);
  scrollLockObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  function configureScroll() {
    gsap?.ticker.remove(scrollTick);
    lenis?.destroy();
    lenis = null;
    if (!motionPreference.matches && window.Lenis && gsap && ScrollTrigger) {
      lenis = new window.Lenis({
        lerp: 0.1,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 1,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(scrollTick);
      gsap.ticker.lagSmoothing(0);
      syncScrollLock();
    }
  }
  configureScroll();
  motionPreference.addEventListener("change", configureScroll);
  ScrollTrigger?.addEventListener("refresh", () => lenis?.resize());
  addEventListener("pagehide", (event) => {
    gsap?.ticker.remove(scrollTick);
    if (!event.persisted) {
      scrollLockObserver.disconnect();
      lenis?.destroy();
    }
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted && lenis) {
      lenis.resize();
      lenis.scrollTo(scrollY, { immediate: true, force: true });
      gsap.ticker.add(scrollTick);
      syncScrollLock();
    }
  });
  const tweenScroll = (target, trigger, start, end, vars, from = false) => {
    if (!target || !trigger || !gsap || reduced) return;
    const options = {
      scrollTrigger: { trigger, start, end, scrub: true },
      ...vars,
    };
    from ? gsap.from(target, options) : gsap.to(target, options);
  };
  const reveal = (target, vars) => !reduced && gsap?.from(target, vars);

  const hero = one(".Hero_Wrapper.Parallax_Wrapper");
  all(".Hero_Wrapper .Parallax_Back_Hero").forEach((back) => {
    if (innerWidth <= 768) return;
    tweenScroll(back, back, "top top", "bottom top", {
      ease: "none",
      y: "70%",
    });
    tweenScroll(one("img", back), back, "top top", "bottom top", {
      ease: "none",
      scale: 1.4,
    });
    tweenScroll(back.closest(".Hero_Wrapper"), back, "top top", "bottom top", {
      ease: "none",
      borderRadius: "0 0 5rem 5rem",
      minHeight: "90vh",
    });
  });
  [
    [".Parallax_Back_Start", "top top", "50%"],
    [".Parallax_Back", "top bottom", "50%"],
    [".Parallax_Front", "top bottom", "-75%"],
    [".Parallax_Hero_Front", "top top", "-75%"],
  ].forEach(([selector, start, defaultY]) => {
    all(selector).forEach((item) =>
      tweenScroll(
        item,
        selector === ".Parallax_Hero_Front" ? hero : item,
        start,
        "bottom top",
        { ease: "none", y: item.dataset.pDisplace || defaultY },
      ),
    );
  });
  all(".Parallax_Image").forEach((img) =>
    tweenScroll(
      img,
      img,
      "top bottom",
      "bottom top",
      { ease: "linear", y: "-20%" },
      true,
    ),
  );
  const header = one("header");
  function menuColor(dark) {
    document.documentElement.style.setProperty(
      "--menu-text-color",
      dark ? "var(--beige)" : "var(--dark)",
    );
    one(".Logo_Light")?.classList.toggle("Shown", dark);
    one(".Logo_Dark")?.classList.toggle("Shown", !dark);
    header?.classList.toggle("Filled", !dark);
  }
  const darkSections = all("main .Dark_Section");
  function updateMenuColor() {
    const headerThreshold = (header?.offsetHeight || 90) * 0.7;
    menuColor(
      darkSections.some((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= 20 && bounds.bottom >= headerThreshold;
      }),
    );
  }
  let menuFrame = 0;
  addEventListener(
    "scroll",
    () => {
      if (!menuFrame)
        menuFrame = requestAnimationFrame(() => {
          menuFrame = 0;
          updateMenuColor();
        });
    },
    { passive: true },
  );
  addEventListener("resize", updateMenuColor);
  ScrollTrigger?.addEventListener("refresh", updateMenuColor);
  updateMenuColor();
  let currentParent = null,
    delay = 0;
  all(".Window_Image").forEach((image) => {
    const parent = image.closest("section");
    delay = parent === currentParent ? delay + 0.15 : 0;
    currentParent = parent;
    const limit = one(".Window_Image_Limit", image),
      img = one(".Window_Image_Container img", image);
    if (reduced || !gsap) {
      if (limit) Object.assign(limit.style, { width: "100%", height: "100%" });
      if (img) img.style.transform = "scale(1)";
      return;
    }
    if (image.classList.contains("No_Anim")) return;
    if (image.classList.contains("Instant")) {
      if (limit)
        gsap.to(limit, {
          scrollTrigger: { trigger: image, start: "top bottom-=100px" },
          ease: "power2.out",
          width: "100%",
          height: "100%",
          duration: 0.75,
          delay,
        });
      if (img)
        gsap.to(img, {
          scrollTrigger: { trigger: image, start: "top bottom-=100px" },
          ease: "power1.out",
          scale: 1,
          duration: 0.8,
          delay,
        });
    } else {
      tweenScroll(limit, image, "top bottom", "bottom center+=200px", {
        ease: "power1.out",
        width: "100%",
        height: "100%",
      });
      tweenScroll(img, image, "top bottom", "top center", {
        ease: "linear",
        scale: 1,
      });
    }
  });
  // The editable Spanish heading can contain longer words than the reference.
  // Keep the reference font size unless a complete word would be clipped.
  const heroHeading = one(".Hero_Heading");
  const heroText = heroHeading?.textContent.trim();
  function fitHeroHeading() {
    if (!heroHeading || !heroText) return;
    heroHeading.style.fontSize = "";
    const style = getComputedStyle(heroHeading),
      size = parseFloat(style.fontSize),
      ctx = document.createElement("canvas").getContext("2d");
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const longest =
      Math.max(
        ...heroText
          .split(/\s+/)
          .map(
            (word) =>
              ctx.measureText(
                style.textTransform === "uppercase"
                  ? word.toLocaleUpperCase("es")
                  : word,
              ).width,
          ),
      ) +
      size * 0.3;
    const available = Math.min(
      heroHeading.getBoundingClientRect().width,
      heroHeading.parentElement.getBoundingClientRect().width,
    );
    if (longest > available)
      heroHeading.style.fontSize = `${(size * available) / longest}px`;
  }
  fitHeroHeading();
  addEventListener("resize", fitHeroHeading);
  all(".Cool_Text_Anim.Words").forEach((anim) => {
    if (reduced || !gsap) return;
    const text = anim.textContent;
    anim.setAttribute("aria-label", text);
    anim.replaceChildren();
    const spans = [];
    text
      .trim()
      .split(/\s+/)
      .forEach((word) => {
        const outer = document.createElement("span"),
          inner = document.createElement("span");
        outer.className = "Word";
        outer.setAttribute("aria-hidden", "true");
        inner.textContent = word;
        outer.append(inner);
        anim.append(outer);
        spans.push(inner);
      });
    reveal(spans, {
      delay: 0.3,
      scrollTrigger: anim,
      stagger: { amount: 0.5 },
      ease: "expo.out",
      duration: 1.5,
      rotation: 12,
      y: "101%",
    });
  });
  all(".Cool_Text_Anim.Lines").forEach((anim) => {
    if (reduced || !gsap) return;
    const text = anim.textContent.trim(),
      words = text.split(/\s+/),
      canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d");
    anim.setAttribute("aria-label", text);
    let width = innerWidth,
      tween,
      observer;
    let appeared = false;
    const newsletter = anim.closest(".Newsletter_Container");
    function split() {
      const style = getComputedStyle(anim);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const lineWidth = anim.getBoundingClientRect().width;
      let measured = 0,
        items = [],
        current = document.createElement("span");
      anim.replaceChildren();
      const append = () => {
        const outer = document.createElement("span");
        outer.className = "Line";
        outer.setAttribute("aria-hidden", "true");
        outer.append(current);
        anim.append(outer);
        items.push(current);
      };
      words.forEach((word) => {
        const wordWidth =
          ctx.measureText(word + " ").width * 1.0454545454545454;
        if (measured && measured + wordWidth >= lineWidth) {
          append();
          current = document.createElement("span");
          measured = 0;
        }
        current.append(document.createTextNode((measured ? " " : "") + word));
        measured += wordWidth;
      });
      append();
      tween?.scrollTrigger?.kill();
      tween?.kill();
      observer?.disconnect();
      // Filtering changes the page height. Observe the shared footer in the
      // viewport instead of keeping an obsolete absolute ScrollTrigger offset.
      if (newsletter) {
        if (appeared) {
          gsap.set(items, { y: 0, rotation: 0 });
          return;
        }
        tween = gsap.from(items, {
          paused: true,
          stagger: { amount: 0.3 },
          ease: "expo.out",
          duration: 1.2,
          rotation: 12,
          y: "101%",
        });
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              appeared = true;
              tween.play();
              observer.disconnect();
            }
          },
          { threshold: 0.1 },
        );
        observer.observe(anim);
        return;
      }
      tween = reveal(items, {
        delay: 0.3,
        scrollTrigger: anim,
        stagger: { amount: 0.3 },
        ease: "expo.out",
        duration: 1.2,
        rotation: 12,
        y: "101%",
      });
    }
    split();
    addEventListener("resize", () => {
      if (width !== innerWidth) {
        width = innerWidth;
        split();
      }
    });
  });
  all(".Cool_Anim.Grow").forEach((anim) =>
    reveal(anim, {
      scrollTrigger: anim,
      duration: 1,
      scale: 0.6,
      delay: 0.5,
      ease: "expo.out",
    }),
  );
  all(".Cool_Anim.Fade").forEach((anim) =>
    reveal(anim, {
      scrollTrigger: anim,
      duration: 1,
      opacity: 0,
      y: "4rem",
      delay: 0.5,
      ease: "expo.out",
    }),
  );
  all(".Cool_Anim.Fade.Multiple").forEach((anim) =>
    reveal(all(".Cool_Anim>div", anim), {
      scrollTrigger: anim,
      stagger: { amount: 0.4 },
      duration: 1,
      opacity: 0,
      y: "4rem",
      delay: 0.5,
      ease: "expo.out",
    }),
  );
  all(".Grow_Anim").forEach((anim) => {
    if (anim.querySelector(".letter") || anim.children.length) return;
    const text = anim.textContent;
    anim.setAttribute("aria-label", text);
    anim.replaceChildren();
    text.split(" ").forEach((word, index) => {
      if (index) anim.append(document.createTextNode(" "));
      const outer = document.createElement("span");
      outer.className = "word";
      outer.setAttribute("aria-hidden", "true");
      [...word].forEach((letter) => {
        const inner = document.createElement("span");
        inner.className = "letter";
        inner.textContent = letter;
        outer.append(inner);
      });
      anim.append(outer);
    });
  });
  all(".Collections_CTA_Button").forEach((button) => {
    if (!reduced)
      gsap?.to(button, {
        scrollTrigger: button,
        scale: 1.2,
        ease: "expo.out",
        duration: 1.5,
      });
  });
  all(".Collections_CTA_Title_SVG").forEach((anim) =>
    tweenScroll(
      one("textPath", anim),
      anim.closest(".Collections_CTA_Image"),
      "top bottom",
      "bottom top",
      { ease: "none", attr: { startOffset: 20 } },
    ),
  );
  all(".Dynamic_Separator").forEach((separator) => {
    const path = one(".Dynamic_Path", separator);
    if (path?.dataset.target)
      tweenScroll(path, one("footer"), "top bottom+=150px", "bottom bottom", {
        ease: "linear",
        attr: { d: path.dataset.target },
      });
  });
  all(".Timeline_Line").forEach((timeline) => {
    tweenScroll(
      one(".Timeline_Inner", timeline),
      timeline,
      "top center+=100px",
      "bottom center+=100px",
      { ease: "linear", height: "100%" },
    );
    if (ScrollTrigger)
      all(".Timeline_Anchor", timeline).forEach((anchor) =>
        ScrollTrigger.create({
          trigger: anchor,
          start: "top center+=100px",
          end: "bottom center+=100px",
          onEnter: () => anchor.classList.add("Passed"),
          onLeaveBack: () => anchor.classList.remove("Passed"),
        }),
      );
  });
  all(".Relative_To_Mouse").forEach((tracker) =>
    ["mouseenter", "mouseleave"].forEach((type) =>
      tracker.addEventListener(type, (event) => {
        const bounds = tracker.getBoundingClientRect();
        tracker.style.setProperty(
          "--mouse-x",
          `${event.clientX - bounds.left}px`,
        );
        tracker.style.setProperty(
          "--mouse-y",
          `${event.clientY - bounds.top}px`,
        );
      }),
    ),
  );
  // Original collection-browser timing: exit, 1.2s swap, staggered entrance.
  const tabs = all(".Collection_Browser_Tab_Button"),
    containers = all(".Collection_Browser_Products_Container");
  let collectionBusy = false;
  const cards = (container) =>
    all(
      ".Collection_Browser_Product_Page.Open .Collection_Browser_Product form",
      container,
    );
  function hideCards(items) {
    if (!gsap || reduced) return;
    gsap.to(items, {
      onStart: () =>
        items.forEach((item) => (item.style.transformOrigin = "top left")),
      stagger: { amount: 0.4 },
      duration: 0.5,
      y: "101%",
      rotation: 15,
      ease: "power3.in",
    });
  }
  function showCards(items, done) {
    if (!items.length || !gsap || reduced) {
      done();
      return;
    }
    items.forEach((item) => (item.style.transformOrigin = "top right"));
    gsap.fromTo(
      items,
      { y: "101%", rotation: -15 },
      {
        delay: 1.2,
        stagger: { amount: 0.4 },
        duration: 0.5,
        y: "0%",
        rotation: 0,
        ease: "expo.out",
        onComplete: done,
      },
    );
  }
  function finishCollection() {
    collectionBusy = false;
    ScrollTrigger?.refresh();
    dispatchEvent(new Event("resize"));
  }
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      if (collectionBusy || tab.classList.contains("Selected")) return;
      const target = containers.find(
        (container) => container.dataset.id === tab.dataset.id,
      );
      if (!target) return;
      collectionBusy = true;
      tabs.forEach((button) => {
        const selected = button === tab;
        button.classList.toggle("Selected", selected);
        button.setAttribute("aria-selected", String(selected));
      });
      containers.forEach((container) => {
        if (container !== target && container.classList.contains("Open")) {
          hideCards(cards(container));
          setTimeout(
            () => {
              target.classList.add("Open");
              container.classList.remove("Open");
            },
            reduced ? 0 : 1200,
          );
        }
      });
      showCards(cards(target), finishCollection);
    }),
  );
  containers.forEach((container) => {
    const pages = all(".Collection_Browser_Product_Page", container),
      prev = one(".Collection_Browser_Arrow.Left", container),
      next = one(".Collection_Browser_Arrow.Right", container);
    if (!pages.length) return;
    let index = Math.max(
      0,
      pages.findIndex((page) => page.classList.contains("Open")),
    );
    function buttons() {
      prev?.classList.toggle("Disabled", index === 0);
      next?.classList.toggle("Disabled", index === pages.length - 1);
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === pages.length - 1;
    }
    function change(nextIndex) {
      if (collectionBusy || nextIndex < 0 || nextIndex >= pages.length) return;
      collectionBusy = true;
      const old = pages[index];
      index = nextIndex;
      hideCards(all(".Collection_Browser_Product form", old));
      showCards(
        all(".Collection_Browser_Product form", pages[index]),
        finishCollection,
      );
      setTimeout(
        () => {
          old.classList.remove("Open");
          pages[index].classList.add("Open");
        },
        reduced ? 0 : 1200,
      );
      buttons();
    }
    prev?.addEventListener("click", () => change(index - 1));
    next?.addEventListener("click", () => change(index + 1));
    buttons();
    if (container.classList.contains("Open"))
      showCards(cards(container), finishCollection);
  });
  all(".Images_Display_Container").forEach((container) => {
    if (reduced || !ScrollTrigger) container.classList.add("Animate");
    else
      ScrollTrigger.create({
        trigger: container,
        start: "top bottom",
        once: true,
        onEnter: () => container.classList.add("Animate"),
      });
    const queueNode = one(".Images_Queue", container),
      displays = all(".Image_Display", container);
    if (!queueNode || !displays.length) return;
    const queue = all("img", queueNode);
    displays.forEach((display) => {
      if (!one("img", display) && queue.length) display.append(queue.shift());
    });
    if (reduced) return;
    timers.push(
      setInterval(
        () =>
          displays.forEach((display, index) => {
            const current = one("img", display),
              next = queue.shift();
            if (!current || !next) return;
            next.classList.add("Left");
            next.classList.remove("Behind");
            display.append(next);
            setTimeout(
              () => {
                next.classList.remove("Left");
                current.classList.add("Behind");
              },
              200 + index * 120,
            );
            setTimeout(() => {
              queueNode.append(current);
              queue.push(current);
            }, 5000);
          }),
        8000,
      ),
    );
  });
  const arches = all(".Arches_Display_Container .Window_Image"),
    half = Math.floor(arches.length / 2);
  for (let group = 0; group < 3; group++) {
    const flip = Math.random() < 0.5;
    for (
      let index = Math.floor((group * half) / 3);
      index < Math.floor(((group + 1) * half) / 3);
      index++
    ) {
      const value = (index + (flip ? 0 : 1)) % 2;
      arches[index]?.style.setProperty("--random", value);
      arches[index + half]?.style.setProperty("--random", value);
    }
  }
  const footerWrapper = one(".Footer_Wrapper"),
    footer = one("footer", footerWrapper || document),
    space = one(".Footer_Space");
  const wordmark = one(".Footer_Big_Logo_Text");
  function fitFooterWordmark() {
    if (!wordmark) return;
    // Measure the mixed roman/italic lettering after fonts load, at every width.
    wordmark.style.fontSize = "100px";
    const range = document.createRange();
    range.selectNodeContents(wordmark);
    const measured = range.getBoundingClientRect().width;
    if (measured)
      wordmark.style.fontSize = `${(wordmark.parentElement.clientWidth / measured) * 100}px`;
    if (innerWidth > 768 && !motionPreference.matches) {
      const middle = wordmark.closest(".Footer_Middle");
      const style = getComputedStyle(middle);
      const available =
        middle.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
      const height = wordmark.offsetHeight;
      if (height > available && available > 0)
        wordmark.style.fontSize = `${(parseFloat(wordmark.style.fontSize) * available) / height}px`;
    }
  }
  function resizeFooter() {
    if (!footerWrapper || !footer || !space) return;
    fitFooterWordmark();
    // Desktop rows reserve space for links and fit the wordmark proportionally.
    // Only exceptionally short windows and mobile use the natural document flow.
    const height = footer.offsetHeight;
    const fixed =
      innerWidth > 768 &&
      !motionPreference.matches &&
      height <= innerHeight - (header?.offsetHeight || 80) - 16;
    space.style.height = fixed ? `${height}px` : "auto";
    footerWrapper.classList.toggle("Fixed", fixed);
    lenis?.resize();
  }
  resizeFooter();
  addEventListener("resize", resizeFooter);
  motionPreference.addEventListener("change", resizeFooter);
  if (footer && window.ResizeObserver)
    new ResizeObserver(resizeFooter).observe(footer);
  const fixedAdd = one(".Product_Hero_Fixed"),
    fixedTarget = one(".Product_Second_Image");
  if (fixedAdd && fixedTarget) {
    const check = () => {
      fixedAdd.style.maxWidth = `${fixedTarget.getBoundingClientRect().width}px`;
      fixedAdd.style.bottom = `${Math.max(0, innerHeight - fixedTarget.getBoundingClientRect().bottom - innerWidth / 25)}px`;
    };
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    check();
  }
  all(".Product_Media").forEach((carousel) => {
    if (carousel.hasAttribute("data-react-gallery")) return;
    const images = all(".Main_Image", carousel),
      toggles = all(".Additional_Image", carousel);
    if (!images.length || !toggles.length) return;
    let active = images.findIndex((img) => img.classList.contains("Active"));
    if (active < 0) active = 0;
    const initial = active;
    let busy = false;
    toggles[active]?.classList.add("Active");
    toggles.forEach((toggle, index) =>
      toggle.addEventListener("click", () => {
        if (busy) return;
        const target = index === active ? initial : index;
        if (target === active) return;
        busy = true;
        const old = images[active];
        old.classList.add("Deactive");
        toggles[active]?.classList.remove("Active");
        active = target;
        images[active]?.classList.add("Active");
        toggles[active]?.classList.add("Active");
        setTimeout(
          () => {
            old.classList.remove("Active", "Deactive");
            busy = false;
          },
          reduced ? 0 : 1010,
        );
      }),
    );
  });
  const pageLoad = one(".pageload .anim-path"),
    pageHide = one(".pagehide .anim-path"),
    hideStart = pageHide?.getAttribute("d");
  if (pageLoad) {
    if (reduced || !gsap) pageLoad.closest("svg")?.remove();
    else {
      const image = one(".Hero_Back_Img img");
      await Promise.race([
        image && !image.complete
          ? new Promise((resolve) => {
              image.addEventListener("load", resolve, { once: true });
              image.addEventListener("error", resolve, { once: true });
            })
          : Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      gsap.to(pageLoad, {
        duration: 1.2,
        attr: { d: pageLoad.dataset.endPath },
        ease: "power2.inOut",
      });
    }
  }
  let navigating = false;
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download") ||
      link.target === "_blank" ||
      link.dataset.action ||
      link.closest("dialog,.Cart_Drawer")
    )
      return;
    const url = new URL(link.href, location.href);
    if (
      url.origin !== location.origin ||
      url.pathname.startsWith("/admin") ||
      !["http:", "https:"].includes(url.protocol)
    )
      return;
    if (
      url.hash &&
      url.pathname === location.pathname &&
      url.search === location.search
    ) {
      const target = document.getElementById(
        decodeURIComponent(url.hash.slice(1)),
      );
      if (target) {
        event.preventDefault();
        if (lenis)
          lenis.scrollTo(target, { offset: -(header?.offsetHeight || 100) });
        else
          scrollTo({
            top:
              target.getBoundingClientRect().top +
              scrollY -
              (header?.offsetHeight || 100),
            behavior: motionPreference.matches ? "instant" : "smooth",
          });
        // Preserve keyboard navigation when the skip link scrolls through Lenis.
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
          target.addEventListener(
            "blur",
            () => target.removeAttribute("tabindex"),
            { once: true },
          );
        }
        target.focus({ preventScroll: true });
      }
      return;
    }
    // Browsing products must not wait for the decorative 800ms page curtain.
    if (
      one(".carta-page") ||
      url.href === location.href ||
      url.hash ||
      reduced ||
      !pageHide ||
      !gsap
    )
      return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    gsap.to(pageHide, {
      duration: 1.2,
      attr: { d: pageHide.dataset.endPath },
      ease: "power2.inOut",
    });
    setTimeout(() => location.assign(url.href), 800);
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted) {
      navigating = false;
      if (pageHide && gsap && hideStart)
        gsap.set(pageHide, { attr: { d: hideStart } });
      ScrollTrigger?.refresh();
      updateMenuColor();
    }
  });
  const favicon = one("#favicon");
  if (!reduced && favicon && window.favicon1 && window.favicon2) {
    const base = favicon.href;
    let index = 0;
    timers.push(
      setInterval(() => {
        favicon.href = [base, window.favicon1, window.favicon2][index++ % 3];
      }, 1200),
    );
  }
  document.addEventListener("brunette:motion-refresh", () =>
    ScrollTrigger?.refresh(),
  );
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ScrollTrigger?.refresh();
  });
  ScrollTrigger?.refresh();
  // Draw crumbs only while particles exist, on a viewport-sized canvas.
  const canvas = one("#js-front-canvas");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d"),
      crumbs = [];
    let frame = 0,
      last = 0;
    const resize = () => {
      canvas.width = document.documentElement.clientWidth;
      canvas.height = innerHeight;
    };
    resize();
    addEventListener("resize", resize);
    all(
      ".Quantity_Selector_Button,.Hero_Float_Inner,.Product_Hero_Add_Button",
    ).forEach((trigger) =>
      ["mouseenter", "click"].forEach((type) =>
        trigger.addEventListener(type, () => {
          if (document.hidden || motionPreference.matches) return;
          const bounds = trigger.getBoundingClientRect(),
            size = bounds.width,
            color = getComputedStyle(trigger).backgroundColor;
          for (let i = 0; i < 3; i++) {
            const radius =
                (Math.random() * (size / 4 - size / 7) + size / 7) / 2,
              factor = Math.log(size / 48) + 1;
            crumbs.push({
              x: bounds.x + (size * 2) / 3 + (i * size) / 14,
              y:
                bounds.y +
                bounds.height -
                (size * 2) / 3 -
                ((size / 7) * 3) / 4 +
                (i * size) / 14,
              radius,
              color,
              factor,
              alpha: 1,
              vx: ((Math.random() * 0.5 + 0.5) * 3 * factor) / 2,
              vy: -(Math.random() * 0.5 + 0.5) * 4 * factor,
              rotation: Math.random() * Math.PI * 2,
              spin: (Math.random() * Math.PI * 2) / 60,
            });
          }
          if (!frame) frame = requestAnimationFrame(tick);
        }),
      ),
    );
    function tick(time) {
      frame = 0;
      if (time - last < 1000 / 60) {
        if (crumbs.length) frame = requestAnimationFrame(tick);
        return;
      }
      last = time;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let index = crumbs.length - 1; index >= 0; index--) {
        const c = crumbs[index];
        c.alpha = Math.max(0, c.alpha - 1 / 60);
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.spin;
        c.vy += 0.249 * c.factor;
        c.vx = Math.max(c.vx - 0.249 / 8, 0.6);
        if (!c.alpha || c.y > canvas.height) {
          crumbs.splice(index, 1);
          continue;
        }
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.scale(c.radius * c.alpha, c.radius * c.alpha);
        ctx.rotate(c.rotation);
        ctx.beginPath();
        ctx.moveTo(-0.7636, -0.4727);
        ctx.quadraticCurveTo(-0.5091, -0.9818, 0.6182, -0.4727);
        ctx.quadraticCurveTo(1.1091, -0.1818, 0.5818, 0.4727);
        ctx.quadraticCurveTo(0.2545, 0.8, -0.7636, 0.5636);
        ctx.quadraticCurveTo(-1, 0.4545, -0.7636, -0.4727);
        ctx.fillStyle = c.color;
        ctx.fill();
        ctx.restore();
      }
      if (crumbs.length) frame = requestAnimationFrame(tick);
    }
    const stopParticles = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (crumbs.length) ctx.clearRect(0, 0, canvas.width, canvas.height);
      crumbs.length = 0;
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopParticles();
    });
    motionPreference.addEventListener("change", () => {
      if (motionPreference.matches) stopParticles();
    });
    addEventListener("pagehide", stopParticles, {
      once: true,
    });
  }
  addEventListener("pagehide", () => timers.forEach(clearInterval), {
    once: true,
  });
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initReferenceMotion, {
    once: true,
  });
else initReferenceMotion();
