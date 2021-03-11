var d3cola = cola.d3adaptor(d3).convergenceThreshold(0.1);

var width = 960, height = 700;

var outer = d3.select("#graphviz").append("svg")
    .attr('width',width)
    .attr('height',height)
    .attr('pointer-events',"all");

outer.append('rect')
    .attr('class','background')
    .attr('width',"100%")
    .attr('height',"100%")
    .call(d3.zoom().on("zoom", redraw));

var vis = outer
    .append('g')
    .attr('transform', 'translate(250,250) scale(0.3)');

function redraw() {
    var transform = d3.event.transform;
    vis.attr("transform", "translate(" + transform.x + "," + transform.y+")" + " scale(" + transform.k + ")");
}

outer.append('svg:defs').append('svg:marker')
    .attr('id','end-arrow')
    .attr('viewBox','0 -5 10 10')
    .attr('refX',8)
    .attr('markerWidth',6)
    .attr('markerHeight',6)
    .attr('orient','auto')
  .append('svg:path')
    .attr('d','M0,-5L10,0L0,5L2,0')
    .attr('stroke-width','0px')
    .attr('fill','#000');

function show_graph(g) {

    var nodes = g.topics().map(function(t,i) {
        return {
            id: i,
            name: t.name(),
            topic: t,
        }
    });

    var edges = [];
    nodes.forEach(function(n) {
        n.topic.depends_on().forEach(function(t2) {
            var n2 = nodes.find(function(n2) { return n2.topic==t2; });
            edges.push({ source: n2.id, target: n.id });
        });
    });

    console.log(nodes,edges);

    d3cola
        .avoidOverlaps(true)
        .convergenceThreshold(1e-3)
        .flowLayout('x', 200)
        .size([width, height])
        .nodes(nodes)
        .links(edges)
        .jaccardLinkLengths(200);

    var link = vis.selectAll(".link")
        .data(edges)
        .enter().append("path")
        .attr("class", "link");

    var margin = 10, pad = 12;
    var node = vis.selectAll(".node")
        .data(nodes)
        .enter().append("rect")
        .classed("node", true)
        .attr('rx',5)
        .attr('ry',5)
        .call(d3cola.drag);

    var label = vis.selectAll(".label")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .text(function (d) { return d.name.slice(0,4); })
        .call(d3cola.drag)
        .each(function (d) {
            var b = this.getBBox();
            var extra = 2 * margin + 2 * pad;
            d.width = b.width + extra;
            d.height = b.height + extra;
        });

    var lineFunction = d3.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; });

    var routeEdges = function () {
        d3cola.prepareEdgeRouting();
        link.attr("d", function (d) {
            return lineFunction(d3cola.routeEdge(d
             // show visibility graph
                //, function (g) {
                //    if (d.source.id === 10 && d.target.id === 11) {
                //    g.E.forEach(function (e) {
                //        vis.append("line").attr("x1", e.source.p.x).attr("y1", e.source.p.y)
                //            .attr("x2", e.target.p.x).attr("y2", e.target.p.y)
                //            .attr("stroke", "green");
                //    });
                //    }
                //}
            ));
        });
        if (isIE()) link.each(function (d) { this.parentNode.insertBefore(this, this) });
    }
    d3cola.start(50, 100, 200).on("tick", function () {
        node.each(function (d) { d.innerBounds = d.bounds.inflate(-margin); })
            .attr("x", function (d) { return d.innerBounds.x; })
            .attr("y", function (d) { return d.innerBounds.y; })
            .attr("width", function (d) {
                return d.innerBounds.width();
            })
            .attr("height", function (d) { return d.innerBounds.height(); });

        link.attr("d", function (d) {
            var route = cola.makeEdgeBetween(d.source.innerBounds, d.target.innerBounds, 5);
            return lineFunction([route.sourceIntersection, route.arrowStart]);
        });
        if (isIE()) link.each(function (d) { this.parentNode.insertBefore(this, this) });

        label
            .attr("x", function (d) { return d.x })
            .attr("y", function (d) { return d.y + (margin + pad) / 2 });

    }).on("end", routeEdges);
};
function isIE() { return ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\.0-9]{0,})").exec(navigator.userAgent) != null))); }
