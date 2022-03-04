class Graph {
  constructor(elem, nodes, displayMode) {
    this.elem = elem;
    this.displayMode = displayMode || "default";
    this.data = this.formatData(nodes);

    this.chart = null;
    this.simulation = null;
    this.size = {
      width: 800,
      height: 600,
    };
    const translateOffset = 50;
    this.options = {
      zoom: {
        scale: [0.8, 5],
        translateBounds: [
          [-translateOffset, -translateOffset],
          [
            this.size.width + translateOffset,
            this.size.height + translateOffset,
          ],
        ],
      },
    };
    this.styles = {
      force: {
        distanceBetweenNodes: 80,
      },
      arrow: {
        strokeColor: "#DEDEDE",
        strokeWidth: 2,
        offsetX: 34,
        offsetY: 0,
        size: 6,
      },
      start: {
        strokeWidth: 1,
        strokeColor: "#B3C5F0",
        fill: "#E3EBFF",
        r: 50,
        xForce: 1000,
      },
      middle: {
        strokeWidth: 1,
        strokeColor: "#DEDEDE",
        fill: "#EAEAEA",
        r: 30,
        xForce: 500,
      },
      end: {
        strokeWidth: 1,
        strokeColor: "#F0D7D7",
        fill: "#FFE0E0",
        r: 50,
        xForce: 0,
      },
    };

    this.init();
    this.updateGraph();
  }

  formatData(nodes) {
    const simplifiedNodes = this.generateNodesForSimplifiedMode(nodes);
    const links = this.generateLinksFromNodes(nodes);
    const simplifiedLinks = this.generateLinksFromNodes(simplifiedNodes);

    return {
      default: {
        nodes: nodes,
        links: links,
      },
      simplified: {
        nodes: simplifiedNodes,
        links: simplifiedLinks,
      },
    };
  }

  updateMode(mode) {
    this.displayMode = mode;
    this.updateGraph();
  }

  generateNodesForSimplifiedMode(nodes) {
    let nodesCopy = nodes.map((a) => {
      return { ...a };
    });
    return nodesCopy
      .filter((node) => {
        return node.type !== "middle";
      })
      .map((node) => {
        if (node.type == "end") {
          node.target = 0;
          node.value = "";
        }
        return node;
      });
  }

  generateLinksFromNodes(nodes) {
    const links = [];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].target !== undefined) {
        links.push({
          source: nodes[i],
          target: nodes[nodes[i].target],
        });
      }
    }
    return links;
  }

  // SVG LINKS

  straightLink(d) {
    return `M${d.source.x},${d.source.y}A0,0 0 0,1 ${d.target.x},${d.target.y}`;
  }

  curvyLink(d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy);
    return (
      "M" +
      d.source.x +
      "," +
      d.source.y +
      "A" +
      dr +
      "," +
      dr +
      " 0 0,1 " +
      d.target.x +
      "," +
      d.target.y
    );
  }

  curvedLink(d) {
    return `M ${d.source.x} ${d.source.y}
            C ${d.source.x} ${(d.source.y + d.target.y) / 2},
              ${d.target.x} ${(d.source.y + d.target.y) / 2},
              ${d.target.x} ${d.target.y}`;
  }

  // D3 PART

  init() {
    this.chart = d3
      .select("#graph")
      .append("div")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.size.width} ${this.size.height}`)
      .classed("svg-content-responsive", true);

    const handleZoom = (e) => {
      this.chart.select("#canvas").attr("transform", e.transform);
    };

    this.zoom = d3
      .zoom()
      .scaleExtent(this.options.zoom.scale)
      .translateExtent(this.options.zoom.translateBounds)
      .on("zoom", handleZoom);
    this.chart.call(this.zoom);

    this.initArrow();

    this.chart.append("g").attr("id", "canvas");
    this.chart.select("#canvas").append("g").attr("id", "links");
    this.chart.select("#canvas").append("g").attr("id", "nodes");
    this.chart.select("#canvas").append("g").attr("id", "links-label");
    this.chart.select("#canvas").append("g").attr("id", "nodes-label");
  }

  initArrow() {
    let self = this;
    self.chart
      .append("defs")
      .selectAll("marker")
      .data([1])
      .join("marker")
      .attr("id", (d) => `arrow-1`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", self.styles.arrow.offsetX)
      .attr("refY", self.styles.arrow.offsetY)
      .attr("markerWidth", self.styles.arrow.size)
      .attr("markerHeight", self.styles.arrow.size)
      .attr("orient", "auto")
      .append("path")
      .attr("stroke", self.styles.arrow.strokeColor)
      .attr("fill", self.styles.arrow.strokeColor)
      // .attr("fill", "transparent")
      .attr("d", "M0,-5L10,0L0,5");
  }

  updateSimulation() {
    let self = this;
    if (self.simulation) self.simulation.stop();

    // d3 node force simulation
    self.simulation = d3
      .forceSimulation(self.data[self.displayMode].nodes)
      .alpha(0.9)
      .force(
        "center",
        d3.forceCenter(self.size.width / 2, self.size.height / 2)
      )
      .force("charge", d3.forceManyBody().strength(-60))
      .force(
        "link",
        d3.forceLink(self.data[self.displayMode].links).id((d) => d.id)
      )
      .force("y", d3.forceY())
      // .force("x", d3.forceX())
      .force(
        "x",
        d3.forceX().x(function (d) {
          return self.displayMode == "default" ? self.styles[d.type].xForce : 0;
        })
      )
      .force(
        "collide",
        d3.forceCollide((d) => self.styles.force.distanceBetweenNodes)
      )
      .on("tick", () => {
        self.tick();
      });

    const numberOfNodes = self.data[self.displayMode].nodes.length;
    for (var i = 0; i < numberOfNodes * numberOfNodes; ++i)
      self.simulation.tick();
  }

  updateGraph() {
    this.createLinks();
    this.createLinksLabels();
    this.createNodes();
    this.createNodesLabel();
    this.updateSimulation();
    this.zoomReset();
  }

  zoomReset() {
    this.chart.call(this.zoom.transform, d3.zoomIdentity);
  }

  tick() {
    let self = this;

    self.d3LinkElem.attr("d", self.straightLink);
    self.d3LinkLabelElem.attr(
      "transform",
      (d) =>
        `translate(${(d.source.x + d.target.x) / 2},${
          (d.source.y + d.target.y) / 2
        })`
    );
    self.d3NodeElem.attr("transform", (d) => `translate(${d.x},${d.y})`);
    self.d3NodeLabelElem.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  createLinks() {
    let self = this;
    self.d3LinkElem = self.chart
      .select("#links")
      .selectAll("path")
      .data(self.data[self.displayMode].links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", self.styles.arrow.strokeColor)
      .attr("stroke-width", self.styles.arrow.strokeWidth)
      .attr("marker-end", "url(#arrow-1)");
  }

  createLinksLabels() {
    let self = this;
    self.d3LinkLabelElem = self.chart
      .select("#links-label")
      .selectAll("text")
      .data(self.data[self.displayMode].links)
      .join(
        function (enter) {
          return enter
            .append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .attr("fill", (d) => {
              return d.source.value == "controle" ? "red" : "grey";
            })
            .text((d) => d.source.value);
        },
        function (update) {
          return update
            .attr("fill", (d) => {
              return d.source.value == "controle" ? "red" : "grey";
            })
            .text((d) => d.source.value);
        },
        function (exit) {
          return exit.remove();
        }
      );
  }

  createNodesLabel() {
    let self = this;
    self.d3NodeLabelElem = self.chart
      .select("#nodes-label")
      .selectAll("text")
      .data(self.data[self.displayMode].nodes)
      .join("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", "10")
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle")

      .attr("font-family", "Verdana")
      .attr("font-size", "12")
      .attr("font-weight", "900")
      // .attr("color", "white")
      // .attr("stroke", "white")
      // .attr("stroke-width", 4)
      .text((d) => d.name)
      // .clone(true)
      .attr("color", "black")
      .attr("stroke-width", 0);
  }

  createNodes() {
    let self = this;

    const dragstarted = (event, d) => {
      if (!event.active) self.simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragended = (event, d) => {
      if (!event.active) self.simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    };

    self.d3NodeElem = self.chart
      .select("#nodes")
      .selectAll("circle")
      .data(self.data[self.displayMode].nodes)
      .join(
        function (enter) {
          return (
            enter
              .append("circle")
              // .call(
              //   d3
              //     .drag()
              //     .on("start", dragstarted)
              //     .on("drag", dragged)
              //     .on("end", dragended)
              // )
              .attr("stroke", (d) => self.styles[d.type].strokeColor)
              .attr("stroke-width", (d) => self.styles[d.type].strokeWidth)
              .attr("r", (d) => self.styles[d.type].r)
              .attr("fill", (d) => self.styles[d.type].fill)
          );
        },
        function (update) {
          return update
            .attr("stroke", (d) => self.styles[d.type].strokeColor)
            .attr("stroke-width", (d) => self.styles[d.type].strokeWidth)
            .attr("r", (d) => self.styles[d.type].r)
            .attr("fill", (d) => self.styles[d.type].fill);
        },
        function (exit) {
          return exit.remove();
        }
      );
  }
}
