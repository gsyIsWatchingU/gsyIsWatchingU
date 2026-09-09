(() => {
  const sky = document.querySelector("#guestbook-sky");
  const openButton = document.querySelector("#guestbook-open");
  const dialog = document.querySelector("#guestbook-dialog");
  const closeButton = document.querySelector("#guestbook-close");
  const form = document.querySelector("#guestbook-form");
  const submitButton = document.querySelector("#guestbook-submit");
  const status = document.querySelector("#guestbook-status");
  const nickname = document.querySelector("#guestbook-nickname");
  const content = document.querySelector("#guestbook-content");
  const characterCount = document.querySelector("#guestbook-character-count");
  const toast = document.querySelector("#guestbook-toast");
  if (!sky || !openButton || !dialog || !closeButton || !form || !submitButton || !status || !nickname || !content || !characterCount || !toast) return;

  const config = globalThis.GUESTBOOK_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || "").replace(/\/$/, "");
  const apiConfigured = /^https?:\/\//.test(apiBaseUrl);
  let messageIndex = 0;
  let toastTimer;
  const launchLabel = submitButton.querySelector(".guestbook-launch__label");
  const launchDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1120;

  const request = async (path, options = {}) => {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "星际信号暂时中断");
    return payload;
  };

  const createDanmaku = (item, index, immediate = false) => {
    const message = document.createElement("div");
    const author = document.createElement("strong");
    const body = document.createElement("span");
    const mobile = window.matchMedia("(max-width: 680px)").matches;
    const laneCount = mobile ? 5 : 7;
    const text = String(item.content || "").replace(/\s*\n+\s*/g, " ");
    const duration = 20 + Math.min(text.length, 60) * 0.12 + (index % 4) * 1.7;

    message.className = "guestbook-danmaku";
    message.style.setProperty("--lane-top", `${10 + (index % laneCount) * 12}%`);
    message.style.setProperty("--duration", `${duration}s`);
    message.style.setProperty("--delay", immediate ? "0s" : `${-((index * 4.1) % duration)}s`);
    author.textContent = String(item.nickname || "访客");
    body.textContent = text;
    message.append(author, body);
    return message;
  };

  const appendDanmaku = (item, immediate = false) => {
    sky.append(createDanmaku(item, messageIndex, immediate));
    messageIndex += 1;
  };

  const showToast = (message) => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };

  const setStatus = (message, type = "") => {
    status.textContent = message;
    status.dataset.type = type;
  };

  const setDialogCursor = (isOpen) => {
    document.documentElement.classList.toggle("guestbook-dialog-open", isOpen);
  };

  const setLaunchState = (isLaunching) => {
    submitButton.classList.toggle("is-launching", isLaunching);
    submitButton.toggleAttribute("aria-busy", isLaunching);
    submitButton.disabled = isLaunching;
    if (launchLabel) launchLabel.textContent = isLaunching ? "正在升空" : "发射到星海";
  };

  const loadMessages = async () => {
    try {
      const payload = await request("/api/messages?limit=18");
      sky.replaceChildren();
      messageIndex = 0;
      payload.items.forEach((item) => appendDanmaku(item));
    } catch {
      // 留言读取失败时保留原有星海，不打断首屏体验。
    }
  };

  const recordVisit = async () => {
    try {
      await request("/api/visits", { method: "POST", body: "{}" });
    } catch {
      // 访客记录失败不影响留言体验。
    }
  };

  openButton.addEventListener("click", () => {
    if (!apiConfigured) {
      showToast("留言服务暂时不可用");
      return;
    }
    setStatus("");
    setDialogCursor(true);
    dialog.showModal();
    window.setTimeout(() => nickname.focus(), 0);
  });

  dialog.addEventListener("close", () => setDialogCursor(false));
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;
    if (!inside) dialog.close();
  });

  content.addEventListener("input", () => {
    characterCount.textContent = String(content.value.length);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;
    setLaunchState(true);
    setStatus("正在点火，校准发射轨道…", "launching");
    const data = new FormData(form);
    const launchAnimation = new Promise((resolve) => window.setTimeout(resolve, launchDuration));

    try {
      const [payload] = await Promise.all([
        request("/api/messages", {
          method: "POST",
          body: JSON.stringify({
            nickname: data.get("nickname"),
            content: data.get("content"),
            website: data.get("website"),
          }),
        }),
        launchAnimation,
      ]);
      appendDanmaku(payload.item, true);
      form.reset();
      characterCount.textContent = "0";
      dialog.close();
      showToast("你的留言正在穿过星海");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      setLaunchState(false);
    }
  });

  if (!apiConfigured) return;
  Promise.allSettled([recordVisit(), loadMessages()]);
})();
