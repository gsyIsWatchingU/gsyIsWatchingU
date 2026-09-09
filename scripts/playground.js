(() => {
  const starterCode = `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // 在这里编写你的代码

}`;

  const visibleCases = [
    { nums: [2, 7, 11, 15], target: 9 },
    { nums: [3, 2, 4], target: 6 },
    { nums: [3, 3], target: 6 },
  ];
  const hiddenCases = [
    { nums: [-3, 4, 3, 90], target: 0 },
    { nums: [0, 4, 3, 0], target: 0 },
    { nums: [-10, -3, 4, 7, 11], target: 1 },
    { nums: [1000000000, -1000000000, 8, 2], target: 10 },
  ];
  const draftKey = "gsy-algorithm-playground-two-sum";
  const fallback = document.querySelector("#code-fallback");
  const editorShell = document.querySelector(".editor-shell");
  const saveStatus = document.querySelector("#save-status");
  const toast = document.querySelector("#toast");
  let editor = null;
  let saveTimer = null;
  let activeCase = 0;
  let toastTimer = null;

  const storedDraft = localStorage.getItem(draftKey);
  fallback.value = storedDraft || starterCode;

  const getCode = () => editor ? editor.getValue() : fallback.value;
  const setCode = (value) => {
    if (editor) editor.setValue(value);
    fallback.value = value;
  };

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  };

  const saveDraft = () => {
    saveStatus.textContent = "保存中…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(draftKey, getCode());
      saveStatus.textContent = "已自动保存";
    }, 420);
  };

  fallback.addEventListener("input", saveDraft);
  fallback.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const start = fallback.selectionStart;
      fallback.setRangeText("  ", start, fallback.selectionEnd, "end");
      saveDraft();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runCode(false);
  });

  if (window.require) {
    window.require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });
    window.require(["vs/editor/editor.main"], () => {
      editor = monaco.editor.create(document.querySelector("#monaco-editor"), {
        value: fallback.value,
        language: "javascript",
        theme: "vs",
        automaticLayout: true,
        minimap: { enabled: false },
        fontFamily: "Cascadia Code, JetBrains Mono, Consolas, monospace",
        fontSize: 14,
        lineHeight: 23,
        lineNumbersMinChars: 3,
        padding: { top: 12 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        roundedSelection: true,
        renderLineHighlight: "all",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: false },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
      });
      editorShell.classList.add("is-monaco-ready");
      editor.onDidChangeModelContent(saveDraft);
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runCode(false));
    }, () => {
      showToast("编辑器增强组件加载失败，已切换到基础编辑器");
    });
  }

  const updateCaseView = () => {
    const test = visibleCases[activeCase];
    document.querySelector("#case-nums").value = JSON.stringify(test.nums);
    document.querySelector("#case-target").value = String(test.target);
    document.querySelectorAll(".case-chip").forEach((chip, index) => chip.classList.toggle("is-active", index === activeCase));
  };

  document.querySelectorAll(".case-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      activeCase = Number(chip.dataset.case);
      updateCaseView();
    });
  });
  updateCaseView();

  const switchTestTab = (name) => {
    const showResult = name === "result";
    document.querySelector("#cases-tab").classList.toggle("is-active", !showResult);
    document.querySelector("#cases-tab").setAttribute("aria-selected", String(!showResult));
    document.querySelector("#result-tab").classList.toggle("is-active", showResult);
    document.querySelector("#result-tab").setAttribute("aria-selected", String(showResult));
    document.querySelector("#cases-panel").hidden = showResult;
    document.querySelector("#result-panel").hidden = !showResult;
  };

  document.querySelector("#cases-tab").addEventListener("click", () => switchTestTab("cases"));
  document.querySelector("#result-tab").addEventListener("click", () => switchTestTab("result"));

  const isValidAnswer = (output, test) => {
    if (!Array.isArray(output) || output.length !== 2) return false;
    const [first, second] = output;
    return Number.isInteger(first)
      && Number.isInteger(second)
      && first !== second
      && first >= 0
      && second >= 0
      && first < test.nums.length
      && second < test.nums.length
      && test.nums[first] + test.nums[second] === test.target;
  };

  const executeInWorker = (code, tests) => new Promise((resolve) => {
    const workerSource = `
      self.onmessage = ({ data }) => {
        const { code, tests } = data;
        const results = [];
        try {
          const solution = new Function(code + "\\n; return typeof twoSum === 'function' ? twoSum : null;")();
          if (!solution) throw new Error("未找到 twoSum 函数，请保留题目给出的函数名");
          for (const test of tests) {
            const startedAt = performance.now();
            try {
              const output = solution([...test.nums], test.target);
              results.push({ output, elapsed: performance.now() - startedAt });
            } catch (error) {
              results.push({ error: error?.message || String(error), elapsed: performance.now() - startedAt });
            }
          }
          self.postMessage({ results });
        } catch (error) {
          self.postMessage({ fatal: error?.message || String(error) });
        }
      };
    `;
    const blobUrl = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
    const worker = new Worker(blobUrl);
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      URL.revokeObjectURL(blobUrl);
      resolve(payload);
    };
    const timeout = setTimeout(() => finish({ fatal: "执行超时：代码运行超过 2 秒" }), 2000);
    worker.onmessage = ({ data }) => {
      clearTimeout(timeout);
      finish(data);
    };
    worker.onerror = (event) => {
      clearTimeout(timeout);
      finish({ fatal: event.message || "代码执行失败" });
    };
    worker.postMessage({ code, tests });
  });

  const renderResults = (payload, tests, isSubmit) => {
    const summary = document.querySelector("#result-summary");
    const list = document.querySelector("#result-list");
    document.querySelector("#result-empty").hidden = true;
    summary.hidden = false;
    list.replaceChildren();

    if (payload.fatal) {
      summary.className = "result-summary is-fail";
      summary.textContent = payload.fatal;
      return false;
    }

    const results = payload.results.map((result, index) => ({
      ...result,
      passed: !result.error && isValidAnswer(result.output, tests[index]),
    }));
    const passedCount = results.filter((result) => result.passed).length;
    const allPassed = passedCount === tests.length;
    summary.className = `result-summary ${allPassed ? "is-pass" : "is-fail"}`;
    summary.textContent = allPassed
      ? (isSubmit ? `通过 · ${tests.length} / ${tests.length} 个测试用例` : `执行通过 · ${tests.length} / ${tests.length}`)
      : `未通过 · ${passedCount} / ${tests.length} 个测试用例`;

    results.forEach((result, index) => {
      const item = document.createElement("div");
      item.className = `result-item ${result.passed ? "is-pass" : "is-fail"}`;
      const caseName = isSubmit && index >= visibleCases.length ? `隐藏用例 ${index - visibleCases.length + 1}` : `Case ${index + 1}`;
      const detail = result.error
        ? `错误：${result.error}`
        : result.passed
          ? `输出：${JSON.stringify(result.output)}`
          : `输出：${JSON.stringify(result.output)}，结果不是一组有效下标`;
      item.innerHTML = `<span>${result.passed ? "●" : "×"}</span><strong>${caseName}</strong><time>${result.elapsed.toFixed(1)} ms</time><p class="result-detail"></p>`;
      item.querySelector(".result-detail").textContent = detail;
      list.append(item);
    });
    return allPassed;
  };

  async function runCode(isSubmit) {
    const tests = isSubmit ? [...visibleCases, ...hiddenCases] : visibleCases;
    const buttons = document.querySelectorAll("#run-top, #run-bottom, #submit-top, #submit-bottom");
    buttons.forEach((button) => button.classList.add("is-loading"));
    switchTestTab("result");
    const summary = document.querySelector("#result-summary");
    document.querySelector("#result-empty").hidden = true;
    summary.hidden = false;
    summary.className = "result-summary";
    summary.textContent = isSubmit ? "正在评测全部用例…" : "正在运行可见用例…";
    document.querySelector("#result-list").replaceChildren();

    const payload = await executeInWorker(getCode(), tests);
    const allPassed = renderResults(payload, tests, isSubmit);
    buttons.forEach((button) => button.classList.remove("is-loading"));
    if (isSubmit) showToast(allPassed ? "提交成功，全部测试通过" : "提交未通过，请继续调试");
  }

  document.querySelector("#run-top").addEventListener("click", () => runCode(false));
  document.querySelector("#run-bottom").addEventListener("click", () => runCode(false));
  document.querySelector("#submit-top").addEventListener("click", () => runCode(true));
  document.querySelector("#submit-bottom").addEventListener("click", () => runCode(true));
  document.querySelector("#reset-code").addEventListener("click", () => {
    if (!window.confirm("确定要重置为初始代码吗？当前草稿将被覆盖。")) return;
    setCode(starterCode);
    localStorage.setItem(draftKey, starterCode);
    saveStatus.textContent = "已重置并保存";
    showToast("代码已重置");
  });

  const bindResizer = (element, onMove) => {
    element.addEventListener("pointerdown", (event) => {
      if (window.matchMedia("(max-width: 820px)").matches) return;
      element.setPointerCapture(event.pointerId);
      element.classList.add("is-dragging");
      const move = (moveEvent) => onMove(moveEvent);
      const stop = () => {
        element.classList.remove("is-dragging");
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", stop);
        element.removeEventListener("pointercancel", stop);
      };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", stop);
      element.addEventListener("pointercancel", stop);
    });
  };

  bindResizer(document.querySelector("#workspace-resizer"), (event) => {
    const workspace = document.querySelector("#workspace");
    const bounds = workspace.getBoundingClientRect();
    const width = Math.min(Math.max(event.clientX - bounds.left, 310), bounds.width - 405);
    document.documentElement.style.setProperty("--left-pane", `${width}px`);
  });

  bindResizer(document.querySelector("#coding-resizer"), (event) => {
    const column = document.querySelector("#coding-column");
    const bounds = column.getBoundingClientRect();
    const height = Math.min(Math.max(event.clientY - bounds.top, 255), bounds.height - 191);
    document.documentElement.style.setProperty("--editor-height", `${height}px`);
  });

  const startedAt = Date.now();
  setInterval(() => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    document.querySelector("#timer").textContent = `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  }, 1000);
})();
