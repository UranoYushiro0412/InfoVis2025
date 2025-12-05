d3.csv("https://UranoYushiro0412.github.io/InfoVis2025/W08/w08_task2.csv")
    .then( data => {
        data.forEach( d => { d.population = +d.population; });

        var config = {
            parent: '#drawing_region',
            width: 512,
            height: 512,
            margin: {top:80, right:20, bottom:80, left:100},
            title: "Population of Kinki Region Prefectures",
            xlabel: "Prefecture",
            ylabel: "Population"
        };

        const bar_chart = new BarChart( config, data );
        bar_chart.update();
    })
    .catch( error => {
        console.log( error );
    });

class BarChart {

    constructor( config, data ) {
        this.config = {
            parent: config.parent,
            width: config.width || 512,
            height: config.height || 512,
            margin: config.margin || {top:80, right:20, bottom:80, left:100},
            title: config.title,
            xlabel: config.xlabel,
            ylabel: config.ylabel
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

        self.xscale = d3.scaleBand()
            .range( [0, self.inner_width] )
            .paddingInner(0.1)
            .paddingOuter(0.2);
    
        self.yscale = d3.scaleLinear()
            .range( [self.inner_height, 0] );

        self.xaxis = d3.axisBottom( self.xscale )
            .tickSizeOuter(0);

        self.xaxis_group = self.chart.append('g')
            .attr('transform', `translate(0, ${self.inner_height})`);
        
        self.yaxis = d3.axisLeft( self.yscale )
            .ticks(5)
            .tickSizeOuter(0);

        self.yaxis_group = self.chart.append('g')

        self.svg.append("text")
        .attr("x", self.config.width / 2)
        .attr("y", self.config.margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text(self.config.title);

        self.svg.append("text")
            .attr("x", self.config.margin.left + self.inner_width / 2)
            .attr("y", self.config.height - self.config.margin.bottom / 3)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text(self.config.xlabel);

        self.svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", self.config.margin.left / 4)
            .attr("x", -self.config.margin.top - (self.inner_height / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text(self.config.ylabel);
    }

    update() {
        let self = this;

        self.xscale.domain(self.data.map(d => d.label) );

        const ymax = d3.max( self.data, d => d.population );
        self.yscale.domain( [0, ymax * 1.15] );

        self.render();
    }

    render() {
        let self = this;

        self.chart.selectAll("rect")
            .data(self.data)
            .enter()
            .append("rect")
            .attr("x", d => self.xscale(d.label))
            .attr("y", d => self.yscale(d.population)) 
            .attr("height", d => self.inner_height - self.yscale(d.population))
            .attr("width", self.xscale.bandwidth())
            .style("fill", function(d){ return d.color; });

        self.xaxis_group
            .call( self.xaxis );
        
        self.xaxis_group.selectAll('text')
            .style('font-size', '12px');

        self.yaxis_group
            .call( self.yaxis );
    }
}
