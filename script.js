
"use strict";

class SlidePresentation {
  constructor() {
    this.slides = [...document.querySelectorAll(".slide")];
    this.deck = document.getElementById("deck");
    this.index = Math.max(0, this.slides.findIndex(slide =>
      slide.classList.contains("active")
    ));

    this.counter = document.getElementById("counter");
    this.fill = document.getElementById("progressFill");
    this.dots = document.getElementById("dots");

    this.flash = document.createElement("div");
    this.flash.className = "cinema-flash";
    document.body.appendChild(this.flash);

    this.buildDots();
    this.update(false);
    this.addCinematicAtmosphere();
    this.bind();
  }

  buildDots() {
    this.slides.forEach((slide, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Buka slide ${i + 1}`);
      button.addEventListener("click", () => this.go(i));
      this.dots.appendChild(button);
    });

    this.dotButtons = [...this.dots.querySelectorAll("button")];
  }

  
go(i) {
  const nextIndex = Math.max(
    0,
    Math.min(this.slides.length - 1, i)
  );

  // Klik slide yang sama: ulangi animasi masuk.
  if (nextIndex === this.index) {
    const current = this.slides[this.index];

    current.classList.remove("active");
    void current.offsetWidth;
    current.classList.add("active");

    this.playFlash();
    return;
  }

  // Hentikan pembersihan transisi sebelumnya jika
  // pengguna menekan tombol dengan cepat.
  if (this.transitionTimer) {
    clearTimeout(this.transitionTimer);
  }

  // Bersihkan kelas transisi yang tersisa.
  const cameraClasses = [
    "camera-leaving",
    "camera-entering",
    "camera-forward",
    "camera-backward",
    "camera-push",
    "camera-fly",
    "camera-pan"
  ];

  this.slides.forEach(slide => {
    slide.classList.remove(...cameraClasses);
  });

  const previousIndex = this.index;
  const outgoing = this.slides[previousIndex];
  const incoming = this.slides[nextIndex];

  const direction =
    nextIndex > previousIndex ? "forward" : "backward";

  // Ganti mode kamera secara bergantian.
  const modes = ["push", "fly", "pan"];
  const mode = modes[previousIndex % modes.length];

  // Tandai slide lama dan slide baru sebelum navigasi.
  outgoing.classList.add(
    "camera-leaving",
    `camera-${direction}`,
    `camera-${mode}`
  );

  incoming.classList.add(
    "camera-entering",
    `camera-${direction}`,
    `camera-${mode}`
  );

  // Fungsi update asli tetap mengatur:
  // active, counter, progress, dots, dan judul dokumen.
  this.index = nextIndex;
  this.update(true);

  // Bersihkan kelas setelah transisi selesai.
  this.transitionTimer = setTimeout(() => {
    outgoing.classList.remove(...cameraClasses);
    incoming.classList.remove(...cameraClasses);
    this.transitionTimer = null;
  }, 1150);
}


  update(animate = true) {
    this.slides.forEach((slide, i) => {
      const isActive = i === this.index;

      slide.classList.toggle("active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });

    this.dotButtons.forEach((dot, i) => {
      const isActive = i === this.index;

      dot.classList.toggle("active", isActive);

      if (isActive) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    this.counter.textContent =
      `${String(this.index + 1).padStart(2, "0")} / ` +
      `${String(this.slides.length).padStart(2, "0")}`;

    this.fill.style.width =
      `${((this.index + 1) / this.slides.length) * 100}%`;

    const current = this.slides[this.index];
    const heading = current.querySelector("h1, h2");

    document.title =
      `${String(this.index + 1).padStart(2, "0")} — ` +
      `${heading?.innerText.replace(/\n/g, " ") || "Sejarah Indonesia"}`;

    this.deck.style.setProperty(
      "--pointer-x",
      `${38 + (this.index % 4) * 8}%`
    );

    this.deck.style.setProperty(
      "--pointer-y",
      `${24 + (this.index % 3) * 19}%`
    );

    if (animate) this.playFlash();
  }

  playFlash() {
    if (!this.flash) return;

    this.flash.classList.remove("fire");
    void this.flash.offsetWidth;
    this.flash.classList.add("fire");
  }

  next() {
    this.go(this.index + 1);
  }

  prev() {
    this.go(this.index - 1);
  }

  addCinematicAtmosphere() {
    const canvas = document.createElement("canvas");
    canvas.className = "cinema-embers";
    canvas.setAttribute("aria-hidden", "true");
    this.deck.appendChild(canvas);

    const vignette = document.createElement("div");
    vignette.className = "cinema-vignette";
    vignette.setAttribute("aria-hidden", "true");
    this.deck.appendChild(vignette);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Tidak menjalankan loop animasi jika pengguna mengurangi gerakan.
    if (reducedMotion) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let embers = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = this.deck.clientWidth;
      height = this.deck.clientHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(18, Math.min(42, Math.round(width / 34)));

      embers = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: .5 + Math.random() * 1.6,
        v: .12 + Math.random() * .38,
        drift: (Math.random() - .5) * .28,
        a: .12 + Math.random() * .4,
        phase: Math.random() * Math.PI * 2
      }));
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      for (const ember of embers) {
        ember.y -= ember.v;
        ember.x += ember.drift + Math.sin(frame * .009 + ember.phase) * .13;

        if (ember.y < -8) {
          ember.y = height + 8;
          ember.x = Math.random() * width;
        }

        if (ember.x < 0) ember.x = width;
        if (ember.x > width) ember.x = 0;

        const pulse = .55 + .45 * Math.sin(frame * .025 + ember.phase);

        ctx.beginPath();
        ctx.fillStyle = `rgba(232,185,109,${ember.a * pulse})`;
        ctx.shadowColor = "rgba(228,77,50,.7)";
        ctx.shadowBlur = 7;
        ctx.arc(ember.x, ember.y, ember.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      this.animationFrame = requestAnimationFrame(draw);
    };

    this.animationFrame = requestAnimationFrame(draw);

    this.deck.addEventListener("pointermove", event => {
      if (event.pointerType === "touch") return;

      const rect = this.deck.getBoundingClientRect();

      this.deck.style.setProperty(
        "--pointer-x",
        `${((event.clientX - rect.left) / rect.width) * 100}%`
      );

      this.deck.style.setProperty(
        "--pointer-y",
        `${((event.clientY - rect.top) / rect.height) * 100}%`
      );
    }, { passive: true });
  }

  bind() {
    document.getElementById("next").addEventListener("click", () => this.next());
    document.getElementById("prev").addEventListener("click", () => this.prev());

    document.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        this.next();
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        this.prev();
      }

      if (event.key.toLowerCase() === "f") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
          document.exitFullscreen?.().catch(() => {});
        }
      }

      if (event.key === "Home") this.go(0);
      if (event.key === "End") this.go(this.slides.length - 1);
    });

    let wheelLock = false;

    document.addEventListener("wheel", event => {
      if (wheelLock || Math.abs(event.deltaY) < 20) return;

      wheelLock = true;

      if (event.deltaY > 0) this.next();
      else this.prev();

      window.setTimeout(() => {
        wheelLock = false;
      }, 750);
    }, { passive: true });

    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener("touchstart", event => {
      touchStartX = event.changedTouches[0].screenX;
      touchStartY = event.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener("touchend", event => {
      const dx = touchStartX - event.changedTouches[0].screenX;
      const dy = touchStartY - event.changedTouches[0].screenY;

      if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.next();
        else this.prev();
      } else if (Math.abs(dy) > 75) {
        if (dy > 0) this.next();
        else this.prev();
      }
    }, { passive: true });
  }
}

new SlidePresentation();
