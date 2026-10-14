(function () {
  const facebookRow = document.querySelector("[data-facebook-url]");
  if (facebookRow) {
    const facebookUrl = (facebookRow.getAttribute("data-facebook-url") || "").trim();
    if (facebookUrl) {
      const facebookLink = facebookRow.querySelector("a");
      if (facebookLink) {
        facebookLink.href = facebookUrl;
        facebookRow.hidden = false;
      }
    }
  }

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const shots = [...document.querySelectorAll(".shot")];
  const status = document.getElementById("gallery-status");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = lightbox.querySelector("img");
  const caption = document.getElementById("lightbox-caption");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const prevButton = lightbox.querySelector(".lightbox-prev");
  const nextButton = lightbox.querySelector(".lightbox-next");

  const filterNames = {
    all: "photos",
    kitchens: "kitchens",
    wardrobes: "wardrobes",
    tv: "TV units",
    other: "other photos",
  };

  let opener = null;
  let current = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchOnControl = false;

  function visibleShots() {
    return shots.filter((shot) => !shot.hidden);
  }

  function show(index) {
    const items = visibleShots();
    if (!items.length) return;
    current = (index + items.length) % items.length;
    const shot = items[current];
    const thumb = shot.querySelector("img");
    lightboxImage.src = shot.dataset.full;
    lightboxImage.alt = thumb.alt;
    caption.textContent = thumb.alt;
  }

  function openLightbox(shot) {
    const index = visibleShots().indexOf(shot);
    if (index < 0) return;
    opener = shot;
    show(index);
    lightbox.hidden = false;
    document.body.classList.add("is-locked");
    closeButton.focus();
  }

  function closeLightbox(restoreFocus) {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
    document.body.classList.remove("is-locked");
    const returnTo = opener;
    opener = null;
    if (restoreFocus && returnTo) returnTo.focus();
  }

  function step(delta) {
    show(current + delta);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-on", selected);
        item.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      let count = 0;
      shots.forEach((shot) => {
        const match = filter === "all" || shot.dataset.cat === filter;
        shot.hidden = !match;
        if (match) count += 1;
      });
      status.textContent = "Showing " + count + " " + filterNames[filter] + ".";
      closeLightbox(false);
    });
  });

  shots.forEach((shot) => {
    shot.addEventListener("click", () => openLightbox(shot));
  });

  closeButton.addEventListener("click", () => closeLightbox(true));
  prevButton.addEventListener("click", () => step(-1));
  nextButton.addEventListener("click", () => step(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox(true);
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox(true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "Tab") {
      const focusable = [closeButton, prevButton, nextButton];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  lightbox.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return;
      touchOnControl = Boolean(event.target.closest("button"));
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true },
  );

  lightbox.addEventListener(
    "touchend",
    (event) => {
      if (touchOnControl || lightbox.hidden) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      step(deltaX < 0 ? 1 : -1);
    },
    { passive: true },
  );
})();
