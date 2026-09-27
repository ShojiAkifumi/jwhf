(() => {
  "use strict";

  /* ---------- SPメニュー ---------- */
  const toggle = document.querySelector(".header__toggle");
  const nav = document.getElementById("gnav");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    nav.classList.toggle("is-open", open);
  };
  toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- ヒーロースライダー ---------- */
  const hero = document.querySelector(".hero");
  if (hero) {
    const slides = hero.querySelectorAll(".hero__slide");
    const dots = hero.querySelectorAll(".hero__dot");
    const INTERVAL = 5000; // 1枚あたりの表示時間
    const FADE = 1200; // フェード時間（CSSの transition と合わせる）
    let current = 0;
    let timer = null;
    const leaveTimers = new Map();

    const show = (index) => {
      const next = (index + slides.length) % slides.length;
      if (next === current) return;
      const prev = slides[current];

      // 前のスライドはフェードアウトが終わるまでズーム状態を保持
      prev.classList.add("is-leaving");
      clearTimeout(leaveTimers.get(prev));
      leaveTimers.set(
        prev,
        setTimeout(() => prev.classList.remove("is-leaving"), FADE),
      );

      current = next;
      slides.forEach((s, i) => {
        const on = i === current;
        if (on) s.classList.remove("is-leaving");
        s.classList.toggle("is-active", on);
        s.setAttribute("aria-hidden", String(!on));
      });
      dots.forEach((d, i) => {
        const on = i === current;
        d.classList.toggle("is-active", on);
        on ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current");
      });
      preload(current + 1);
    };

    // 次のスライドの画像を先に読み込んでおく
    const preload = (i) => {
      slides[i % slides.length].querySelector("img")?.removeAttribute("loading");
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(() => show(current + 1), INTERVAL);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };
    const restart = () => {
      stop();
      start();
    };

    dots.forEach((dot, i) =>
      dot.addEventListener("click", () => {
        show(i);
        restart();
      }),
    );
    // スワイプ：右へスワイプで次の画像、左へスワイプで前の画像
    const SWIPE_MIN = 50; // スワイプと判定する横移動量（px）
    const area = hero.querySelector(".hero__slides");
    let startX = null;
    let startY = 0;
    area.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
    });
    area.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
      show(current + (dx > 0 ? -1 : 1));
      restart();
    });
    area.addEventListener("pointercancel", () => (startX = null));

    // タブが非表示の間は停止し、戻ったら再開
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

    // 初期化：読み込みと同時に自動再生を開始
    slides.forEach((s, i) => s.setAttribute("aria-hidden", String(i !== 0)));
    preload(1);
    start();
  }

  /* ---------- ルールのタブ切り替え ---------- */
  const tabs = document.querySelectorAll(".rule-card");
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });
  };
  tabs.forEach((tab, i) => {
    tab.tabIndex = tab.classList.contains("is-active") ? 0 : -1;
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      const next = tabs[(i + dir + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  /* ---------- 年表：矢印に合わせて順にフェードイン ---------- */
  const history = document.querySelector(".history");
  if (history && "IntersectionObserver" in window) {
    history.classList.add("js-anim");
    const hio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          // 初期状態を描画してからアニメーションを開始
          requestAnimationFrame(() => requestAnimationFrame(() => history.classList.add("is-animated")));
          hio.disconnect();
        });
      },
      { threshold: 0.8 },
    );
    hio.observe(history);
  }

  /* ---------- Charm のリング：中央を原点に拡大 ----------
     リングの中心が画面の縦半分より上に来たら実行 */
  const ring = document.querySelector(".charm__ring");
  if (ring) {
    ring.classList.add("js-anim");
    let ticking = false;
    const check = () => {
      ticking = false;
      // scale は中心を原点にかかるため、縮小中でも矩形の中心＝リングの中心
      const r = ring.getBoundingClientRect();
      if (r.top + r.height / 1.25 > innerHeight / 1.25) return;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      requestAnimationFrame(() => requestAnimationFrame(() => ring.classList.add("is-animated")));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll(); // 読み込み時にすでに条件を満たしている場合
  }

  /* ---------- POINT：灰帯 → 青帯 → 内容 の順に表示 ---------- */
  const points = document.querySelectorAll(".point");
  if (points.length && "IntersectionObserver" in window) {
    const pio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-animated")));
          pio.unobserve(el);
        });
      },
      { threshold: 0.3 },
    );
    points.forEach((el) => {
      el.classList.add("js-anim");
      pio.observe(el);
    });
  }

  /* ---------- スクロールでフェードイン ---------- */
  const targets = document.querySelectorAll(
    ".about__inner > :not(.history), .charm__inner > *, .rule__box, .future__inner > *, .support__box > *",
  );
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("is-show");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -20% 0px" },
    );
    targets.forEach((el) => {
      el.classList.add("js-fade");
      io.observe(el);
    });
  }

  /* ---------- マウスに追従するボール ---------- */
  const ball = document.querySelector(".cursor-ball");
  if (ball && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const EASE = 0.8; // 追従の滑らかさ（1で遅れなし）
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = null;

    const render = () => {
      pos.x += (target.x - pos.x) * EASE;
      pos.y += (target.y - pos.y) * EASE;
      ball.style.translate = `${pos.x}px ${pos.y}px`;
      // ほぼ追いついたら停止し、次のマウス移動で再開
      raf = Math.hypot(target.x - pos.x, target.y - pos.y) > 0.1 ? requestAnimationFrame(render) : null;
    };

    // 表示するのは「支援する」ボタンか Support セクションの上だけ。リンクの上では1.5倍に拡大
    const AREA = ".gnav__cta, .support, .hero";
    const update = (el) => {
      const show = !!el?.closest(AREA);
      ball.classList.toggle("is-link", show && !!el.closest("a"));
      if (!show) {
        ball.classList.remove("is-visible");
        return false;
      }
      // 表示し始めや動きを減らす設定では遅れなしで移動
      if (!ball.classList.contains("is-visible") || reduce) {
        pos.x = target.x;
        pos.y = target.y;
        ball.style.translate = `${pos.x}px ${pos.y}px`;
        ball.classList.add("is-visible");
        return false;
      }
      return true;
    };

    let hasPointer = false;
    document.addEventListener("mousemove", (e) => {
      hasPointer = true;
      target.x = e.clientX;
      target.y = e.clientY;
      if (update(e.target) && !raf) raf = requestAnimationFrame(render);
    });
    // マウスを動かさずにスクロールした場合も、カーソル下の要素で判定し直す
    window.addEventListener("scroll", () => hasPointer && update(document.elementFromPoint(target.x, target.y)), {
      passive: true,
    });
    // ウィンドウの外に出たら隠す
    document.documentElement.addEventListener("mouseleave", () => {
      hasPointer = false;
      ball.classList.remove("is-visible", "is-link", "is-pressed");
    });
    // クリック中（ボタンを押している間）は20%縮小
    document.addEventListener("mousedown", (e) => e.button === 0 && ball.classList.add("is-pressed"));
    document.addEventListener("mouseup", () => ball.classList.remove("is-pressed"));
    window.addEventListener("blur", () => ball.classList.remove("is-pressed"));
  }

  /* ---------- クリック時の波紋（hero・「支援する」ボタン・Support） ---------- */
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.addEventListener("click", (e) => {
      // キーボード操作によるクリック（座標なし）では出さない
      if (e.detail === 0 || !e.target.closest(".hero, .gnav__cta, .support")) return;
      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.setAttribute("aria-hidden", "true");
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.addEventListener("animationend", () => ripple.remove());
      document.body.appendChild(ripple);
    });
  }

  /* ---------- マーカー（黄色・白い下線）：左から右へ伸ばす ---------- */
  const markers = document.querySelectorAll(
    ".about__catch span, .charm__catch > span, .future__text mark, .support__text mark",
  );
  if (markers.length && "IntersectionObserver" in window) {
    const mio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-marked");
          mio.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    markers.forEach((el) => {
      el.classList.add("js-marker");
      mio.observe(el);
    });
  }
})();
