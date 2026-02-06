class Timeline {
    constructor(config, data) {
        this.config = {
            parent: config.parent,
            width: config.width || 800,
            height: config.height || 50,
            margin: config.margin || { top: 10, right: 30, bottom: 30, left: 40 }
        };
        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        // Use a container for both SVG (axes) and Canvas (dots)
        self.container = d3.select(self.config.parent)
            .style('width', `${self.config.width}px`)
            .style('height', `${self.config.height}px`);

        // Create SVG for axes and progress line
        self.svg = self.container.append('svg')
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xscale = d3.scaleTime()
            .range([0, self.inner_width]);

        self.xaxis = d3.axisBottom(self.xscale);

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);

        // Progress line
        self.progress_line = self.chart.append('line')
            .attr('stroke', 'rgba(211, 47, 47, 0.8)')
            .attr('stroke-width', 2)
            .attr('y1', 0)
            .attr('y2', self.inner_height)
            .style('display', 'none');
    }

    update(currentTime) {
        let self = this;
        if (self.xscale.domain()[0] && currentTime) {
            self.progress_line
                .attr('x1', self.xscale(currentTime))
                .attr('x2', self.xscale(currentTime))
                .style('display', 'block');
        }
    }

    render(timeExtent) {
        let self = this;
        const extent = timeExtent || d3.extent(self.data, d => d.timestamp);
        self.xscale.domain(extent);

        self.xaxis_group.call(self.xaxis);
    }
}
