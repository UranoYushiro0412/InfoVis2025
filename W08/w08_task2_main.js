d3.csv("https://UranoYushiro0412.github.io/InfoVis2025/W08/w08_task2.csv")
    .then( data => {
        data.forEach( d => { d.x = +d.x; d.y = +d.y; });

        var config = {
            parent: '#drawing_region',
            width: 512,
            height: 512,
            margin: {top:20, right:20, bottom:40, left:40},
        };

        const line_chart = new LineChart( config, data );
        line_chart.update();
    })
    .catch( error => {
        console.log( error );
    });

class LineChart {

    constructor( config, data ) {
        this.config = {
            parent: config.parent,
            width: config.width || 512,
            height: config.height || 512,
            margin: config.margin || {top:20, right:20, bottom:40, left:40},
        }
        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        self.svg = d3.select( self.config.parent )
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.xscale = d3.scaleLinear()
            .range( [0, self.inner_width] );
    
        self.yscale = d3.scaleLinear()
            .range( [self.inner_height, 0] );

        self.xaxis = d3.axisBottom( self.xscale )
            .ticks(5)
            .tickSizeOuter(0);

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);
        
        self.yaxis = d3.axisLeft( self.yscale )
            .ticks(5)
            .tickSizeOuter(0);

        self.yaxis_group = self.chart.append('g');

        self.line = d3.line()
            .x( d => self.xscale(d.x) )
            .y( d => self.yscale(d.y) );

        self.area = d3.area()
            .x( d => self.xscale(d.x) )
            .y1( d => self.yscale(d.y) )
            .y0( self.yscale(0) );
    }

    update() {
        let self = this;

        const xmax = d3.max( self.data, d => d.x );
        self.xscale.domain( [0, xmax * 1.05] );

        const ymax = d3.max( self.data, d => d.y );
        self.yscale.domain( [0, ymax * 1.05] );

        self.render();
    }

    render() {
        let self = this;

        self.chart.selectAll(".area")
            .data([self.data])
            .join('path')
            .attr('class', 'area')
            .attr('d', self.area)
            .attr('fill', 'lightblue')
            .attr('opacity', 0.5);

        self.chart.selectAll(".line")
            .data([self.data])
            .join('path')
            .attr('d', self.line)
            .attr('stroke', 'black')
            .attr('fill', 'none')
            .attr('stroke-width', 2);

        self.chart.selectAll("circle")
            .data(self.data)
            .join('circle')
            .attr("cx", d => self.xscale(d.x))
            .attr("cy", d => self.yscale(d.y))
            .attr("r", 5)
            .attr("fill", "black");

        self.xaxis_group
            .call( self.xaxis );
        
        self.xaxis_group.selectAll('text')
            .style('font-size', '12px');

        self.yaxis_group
            .call( self.yaxis );
        
        self.yaxis_group.selectAll('text')
            .style('font-size', '12px');
    }
}
