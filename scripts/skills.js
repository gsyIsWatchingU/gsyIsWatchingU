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

  const linksFor = (node) => (node.dataset.links || "").split(/\s+/).filter(Boolean);

  nodes.forEach((node) => {
    linksFor(node).forEach((targetId) => {
      if (!nodeById.has(targetId)) return;
      adjacency.get(node.dataset.nodeId).add(targetId);
      adjacency.get(targetId).add(node.dataset.nodeId);
    });
  });

  const edgeKindFor = (fromNode, toNode) => {
    if (fromNode.classList.contains("skill-node--bridge")) return "cross";
    if (fromNode.dataset.nodeId === "core" && toNode.classList.contains("skill-node--bridge")) return "bridge";
    if (fromNode.dataset.nodeId === "core") return "main";
    return "branch";
  };

  const pathBetween = (fromNode, toNode, edgeKind) => {
    const layerBounds = nodeLayer.getBoundingClientRect();
    const fromBounds = fromNode.getBoundingClientRect();
    const toBounds = toNode.getBoundingClientRect();
    const x1 = fromBounds.left + fromBounds.width / 2 - layerBounds.left;
    const y1 = fromBounds.top + fromBounds.height / 2 - layerBounds.top;
    const x2 = toBounds.left + toBounds.width / 2 - layerBounds.left;
    const y2 = toBounds.top + toBounds.height / 2 - layerBounds.top;
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (edgeKind !== "cross") return `M ${x1} ${y1} L ${x2} ${y2}`;

    const distance = Math.max(1, Math.hypot(dx, dy));
    const direction = (fromNode.dataset.nodeId.length + toNode.dataset.nodeId.length) % 2 ? 1 : -1;
    const bend = Math.min(28, distance * 0.055) * direction;
    const controlX = (x1 + x2) / 2 + (-dy / distance) * bend;
    const controlY = (y1 + y2) / 2 + (dx / distance) * bend;
    return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
  };

  const drawEdges = () => {
    svg.replaceChildren();
    edgeGroups.length = 0;

    if (window.matchMedia("(max-width: 700px)").matches) return;

    const layerBounds = nodeLayer.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${layerBounds.width} ${layerBounds.height}`);

    nodes.forEach((fromNode) => {
      linksFor(fromNode).forEach((targetId) => {
        const toNode = nodeById.get(targetId);
        if (!toNode) return;

        const group = document.createElementNS(svgNamespace, "g");
        const line = document.createElementNS(svgNamespace, "path");
        const flow = document.createElementNS(svgNamespace, "path");
        const edgeKind = edgeKindFor(fromNode, toNode);
        const path = pathBetween(fromNode, toNode, edgeKind);

        group.classList.add("skill-edge-group", `skill-edge-group--${edgeKind}`);
        group.dataset.from = fromNode.dataset.nodeId;
        group.dataset.to = targetId;
        line.classList.add("skill-edge", `skill-edge--${edgeKind}`);
        flow.classList.add("skill-edge__flow");
        line.setAttribute("d", path);
        flow.setAttribute("d", path);
        group.append(line, flow);
        svg.append(group);
        edgeGroups.push(group);

        const length = Math.ceil(line.getTotalLength());
        line.style.setProperty("--edge-length", `${length}`);
      });
    });
  };

  const positionTooltip = (node) => {
    if (window.matchMedia("(max-width: 700px)").matches) return;

    const graphBounds = graph.getBoundingClientRect();
    const nodeBounds = node.getBoundingClientRect();
    const tooltipWidth = Math.min(320, graphBounds.width - 32);
    const tooltipHeight = tooltip.offsetHeight || 190;
    const nodeCenterY = nodeBounds.top + nodeBounds.height / 2 - graphBounds.top;
    let x = nodeBounds.right - graphBounds.left + 24;
    let y = nodeCenterY - tooltipHeight / 2;

    if (x + tooltipWidth > graphBounds.width - 16) {
      x = nodeBounds.left - graphBounds.left - tooltipWidth - 24;
    }
    x = Math.max(16, Math.min(x, graphBounds.width - tooltipWidth - 16));
    y = Math.max(48, Math.min(y, graphBounds.height - tooltipHeight - 46));
    tooltip.style.setProperty("--tooltip-x", `${x}px`);
    tooltip.style.setProperty("--tooltip-y", `${y}px`);
  };

  const relatedNodesFor = (node) => {
    const related = new Set([node.dataset.nodeId]);
    const group = node.dataset.group;

    if (node.dataset.nodeId === "core") {
      nodes.forEach((item) => related.add(item.dataset.nodeId));
      return related;
    }

    if (node.classList.contains("skill-node--domain") && group) {
      nodes.forEach((item) => {
        if (item.dataset.group === group || item.dataset.nodeId === "core") {
          related.add(item.dataset.nodeId);
        }
      });
      [...related].forEach((id) => {
        if (id === "core") return;
        adjacency.get(id)?.forEach((neighbor) => related.add(neighbor));
      });
      return related;
    }

    adjacency.get(node.dataset.nodeId)?.forEach((neighbor) => related.add(neighbor));
    return related;
  };

  const showNode = (node) => {
    const related = relatedNodesFor(node);
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
      const touchesCurrent = edge.dataset.from === node.dataset.nodeId || edge.dataset.to === node.dataset.nodeId;
      const isDomainPath = node.classList.contains("skill-node--domain") && fromIsRelated && toIsRelated;
      edge.classList.toggle("is-active", touchesCurrent || isDomainPath);
      edge.classList.toggle("is-muted", !fromIsRelated || !toIsRelated);
    });

    tooltip.querySelector(".skill-tooltip__kicker").textContent = node.dataset.kicker || "能力节点";
    tooltip.querySelector(".skill-tooltip__title").textContent = node.textContent.trim().replace(/\s+/g, " ");
    tooltip.querySelector(".skill-tooltip__description").textContent = node.dataset.description || "";
    tooltip.querySelector(".skill-tooltip__tags").textContent = node.dataset.tags || "";
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
    resizeFrame = requestAnimationFrame(drawEdges);
  };

  const resizeObserver = new ResizeObserver(scheduleDraw);
  resizeObserver.observe(graph);
  window.addEventListener("load", drawEdges, { once: true });
  drawEdges();
})();
