(() => {
  const graph = document.querySelector("[data-skill-graph]");
  if (!graph) return;

  const nodeLayer = graph.querySelector(".skills-graph__nodes");
  const svg = graph.querySelector(".skills-graph__edges");
  const tooltip = graph.querySelector("[data-skill-tooltip]");
  const nodes = [...graph.querySelectorAll("[data-node-id]")];
  const nodeById = new Map(nodes.map((node) => [node.dataset.nodeId, node]));
  const adjacency = new Map(nodes.map((node) => [node.dataset.nodeId, new Set()]));
  const edgeGroups = [];
  const svgNamespace = "http://www.w3.org/2000/svg";
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pinnedNode = null;
  let resizeFrame = 0;

  const idsFor = (node, attribute) =>
    (node.dataset[attribute] || "").split(/\s+/).filter(Boolean);

  const edgeDefinitions = [];
  nodes.forEach((node) => {
    [
      ["links", node.dataset.nodeId === "core" ? "spoke" : "orbit"],
      ["crossLinks", "cross"],
    ].forEach(([attribute, kind]) => {
      idsFor(node, attribute).forEach((targetId) => {
        if (!nodeById.has(targetId)) return;
        edgeDefinitions.push({ fromId: node.dataset.nodeId, toId: targetId, kind });
        adjacency.get(node.dataset.nodeId).add(targetId);
        adjacency.get(targetId).add(node.dataset.nodeId);
      });
    });
  });

  const centerFor = (node, layerBounds) => {
    const bounds = node.getBoundingClientRect();
    return {
      x: bounds.left + bounds.width / 2 - layerBounds.left,
      y: bounds.top + bounds.height / 2 - layerBounds.top,
    };
  };

  const pathBetween = (fromNode, toNode, edgeKind, layerBounds) => {
    const from = centerFor(fromNode, layerBounds);
    const to = centerFor(toNode, layerBounds);
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (edgeKind === "spoke") {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }

    const distance = Math.max(1, Math.hypot(dx, dy));
    const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };

    if (edgeKind === "orbit") {
      const core = centerFor(nodeById.get("core"), layerBounds);
      const outwardX = midpoint.x - core.x;
      const outwardY = midpoint.y - core.y;
      const outwardDistance = Math.max(1, Math.hypot(outwardX, outwardY));
      const bend = Math.min(54, distance * 0.22);
      const controlX = midpoint.x + (outwardX / outwardDistance) * bend;
      const controlY = midpoint.y + (outwardY / outwardDistance) * bend;
      return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
    }

    const direction =
      (fromNode.dataset.nodeId.length + toNode.dataset.nodeId.length) % 2 ? 1 : -1;
    const bend = Math.min(34, distance * 0.085) * direction;
    const controlX = midpoint.x + (-dy / distance) * bend;
    const controlY = midpoint.y + (dx / distance) * bend;
    return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
  };

  const accentFor = (fromNode, toNode) => {
    const accentNode = fromNode.dataset.nodeId === "core" ? toNode : fromNode;
    const accent = getComputedStyle(accentNode).getPropertyValue("--node-accent").trim();
    return accent || getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#0d0d0c";
  };

  const drawEdges = () => {
    svg.replaceChildren();
    edgeGroups.length = 0;

    if (window.matchMedia("(max-width: 980px)").matches) return;

    const layerBounds = nodeLayer.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${layerBounds.width} ${layerBounds.height}`);

    edgeDefinitions.forEach(({ fromId, toId, kind }) => {
      const fromNode = nodeById.get(fromId);
      const toNode = nodeById.get(toId);
      if (!fromNode || !toNode) return;

      const group = document.createElementNS(svgNamespace, "g");
      const line = document.createElementNS(svgNamespace, "path");
      const flow = document.createElementNS(svgNamespace, "path");
      const path = pathBetween(fromNode, toNode, kind, layerBounds);

      group.classList.add("skill-edge-group", `skill-edge-group--${kind}`);
      group.dataset.from = fromId;
      group.dataset.to = toId;
      group.style.setProperty("--edge-accent", accentFor(fromNode, toNode));
      line.classList.add("skill-edge", `skill-edge--${kind}`);
      flow.classList.add("skill-edge__flow");
      line.setAttribute("d", path);
      flow.setAttribute("d", path);
      group.append(line, flow);
      svg.append(group);
      edgeGroups.push(group);

      line.style.setProperty("--edge-length", `${Math.ceil(line.getTotalLength())}`);
    });
  };

  const positionTooltip = (node) => {
    if (window.matchMedia("(max-width: 980px)").matches) return;

    const graphBounds = graph.getBoundingClientRect();
    const nodeBounds = node.getBoundingClientRect();
    const tooltipWidth = Math.min(304, graphBounds.width - 32);
    const tooltipHeight = tooltip.offsetHeight || 220;
    const nodeCenterY = nodeBounds.top + nodeBounds.height / 2 - graphBounds.top;
    let x = nodeBounds.right - graphBounds.left + 22;
    let y = nodeCenterY - tooltipHeight / 2;

    if (x + tooltipWidth > graphBounds.width - 16) {
      x = nodeBounds.left - graphBounds.left - tooltipWidth - 22;
    }

    x = Math.max(16, Math.min(x, graphBounds.width - tooltipWidth - 16));
    y = Math.max(48, Math.min(y, graphBounds.height - tooltipHeight - 46));
    tooltip.style.setProperty("--tooltip-x", `${x}px`);
    tooltip.style.setProperty("--tooltip-y", `${y}px`);
  };

  const relatedNodesFor = (node) => {
    const related = new Set([node.dataset.nodeId]);

    if (node.dataset.nodeId === "core" || node.dataset.scope === "all") {
      nodes.forEach((item) => related.add(item.dataset.nodeId));
      return related;
    }

    adjacency.get(node.dataset.nodeId)?.forEach((neighbor) => related.add(neighbor));
    return related;
  };

  const renderTags = (value) => {
    const fragment = document.createDocumentFragment();
    value
      .split("|")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const item = document.createElement("span");
        item.textContent = tag;
        fragment.append(item);
      });
    tooltip.querySelector(".skill-tooltip__tags").replaceChildren(fragment);
  };

  const showNode = (node) => {
    const related = relatedNodesFor(node);
    const scopeAll = node.dataset.scope === "all";
    graph.classList.add("has-active-node");

    nodes.forEach((item) => {
      const isCurrent = item === node;
      const isRelated = related.has(item.dataset.nodeId) && !isCurrent;
      item.classList.toggle("is-active", isCurrent);
      item.classList.toggle("is-related", isRelated);
      item.classList.toggle("is-muted", !isCurrent && !isRelated);
    });

    edgeGroups.forEach((edge) => {
      const fromIsRelated = related.has(edge.dataset.from);
      const toIsRelated = related.has(edge.dataset.to);
      const touchesCurrent =
        edge.dataset.from === node.dataset.nodeId || edge.dataset.to === node.dataset.nodeId;
      edge.classList.toggle("is-active", scopeAll || touchesCurrent);
      edge.classList.toggle("is-muted", !fromIsRelated || !toIsRelated);
    });

    tooltip.querySelector(".skill-tooltip__kicker").textContent =
      node.dataset.kicker || "能力节点";
    tooltip.querySelector(".skill-tooltip__title").textContent =
      node.dataset.title || node.textContent.trim().replace(/\s+/g, " ");
    tooltip.querySelector(".skill-tooltip__description").textContent =
      node.dataset.description || "";
    tooltip.style.setProperty("--tooltip-accent", accentFor(node, node));
    renderTags(node.dataset.tags || "");
    tooltip.setAttribute("aria-hidden", "false");
    tooltip.classList.add("is-visible");
    positionTooltip(node);
  };

  const clearNode = () => {
    graph.classList.remove("has-active-node");
    nodes.forEach((node) => node.classList.remove("is-active", "is-related", "is-muted"));
    edgeGroups.forEach((edge) => edge.classList.remove("is-active", "is-muted"));
    tooltip.classList.remove("is-visible");
    tooltip.setAttribute("aria-hidden", "true");
  };

  const unpin = () => {
    if (pinnedNode) pinnedNode.setAttribute("aria-pressed", "false");
    pinnedNode = null;
    clearNode();
  };

  nodes.forEach((node) => {
    node.addEventListener("pointerenter", () => {
      if (!pinnedNode && finePointer) showNode(node);
    });

    node.addEventListener("pointerleave", () => {
      if (!pinnedNode && finePointer) clearNode();
    });

    node.addEventListener("focus", () => {
      if (!pinnedNode) showNode(node);
    });

    node.addEventListener("blur", () => {
      if (!pinnedNode) clearNode();
    });

    node.addEventListener("click", () => {
      if (pinnedNode === node) {
        unpin();
        return;
      }

      if (pinnedNode) pinnedNode.setAttribute("aria-pressed", "false");
      pinnedNode = node;
      node.setAttribute("aria-pressed", "true");
      showNode(node);
    });
  });

  graph.addEventListener("pointermove", (event) => {
    if (!finePointer || reduceMotion) return;
    const bounds = graph.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 24;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 20;
    graph.style.setProperty("--graph-light-x", `${x}px`);
    graph.style.setProperty("--graph-light-y", `${y}px`);

    const core = nodeById.get("core");
    const coreBounds = core.getBoundingClientRect();
    const eyeX = event.clientX - (coreBounds.left + coreBounds.width / 2);
    const eyeY = event.clientY - (coreBounds.top + coreBounds.height / 2);
    const eyeDistance = Math.max(1, Math.hypot(eyeX, eyeY));
    const eyeTravel = Math.min(5, eyeDistance / 24);
    core.style.setProperty("--pupil-x", `${(eyeX / eyeDistance) * eyeTravel}px`);
    core.style.setProperty("--pupil-y", `${(eyeY / eyeDistance) * eyeTravel}px`);
  });

  graph.addEventListener("pointerleave", () => {
    if (!pinnedNode) clearNode();
    graph.style.setProperty("--graph-light-x", "0px");
    graph.style.setProperty("--graph-light-y", "0px");
    nodeById.get("core").style.setProperty("--pupil-x", "0px");
    nodeById.get("core").style.setProperty("--pupil-y", "0px");
  });

  document.addEventListener("pointerdown", (event) => {
    if (pinnedNode && !graph.contains(event.target)) unpin();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && pinnedNode) unpin();
  });

  const scheduleDraw = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      drawEdges();
      if (pinnedNode) {
        showNode(pinnedNode);
      }
    });
  };

  const resizeObserver = new ResizeObserver(scheduleDraw);
  resizeObserver.observe(graph);
  window.addEventListener("load", drawEdges, { once: true });
  drawEdges();
})();
