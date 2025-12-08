d3.csv("https://UranoYushiro0412.github.io/InfoVis2025/W04/w04_task2.csv")
    .then( data => {
        data.forEach( d => { d.population = +d.population; });

        var config = {
            parent: '#drawing_region',
            width: 512,
            height: 512,
            margin: {top:80, right:20, bottom:40, left:40},
            title: "Population of Kinki Region Prefectures",
        };

        const pie_chart = new PieChart( config, data );
        pie_chart.update();
    })
    .catch( error => {
        console.log( error );
    });

class PieChart {

    constructor( config, data ) {
        this.config = {
            parent: config.parent,
            width: config.width || 512,
            height: config.height || 512,
            margin: config.margin || {top:80, right:20, bottom:40, left:40},
            title: config.title,
        }
        this.data = data;
        this.init();
    }

    init() {
        let self = this;

        self.svg = d3.select( self.config.parent )
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        self.inner_width = self.config.width - self.config.margin.left - self.config.margin.right;
        self.inner_height = self.config.height - self.config.margin.top - self.config.margin.bottom;

        self.chart = self.svg.append('g')
            .attr('transform', `translate(${self.config.margin.left}, ${self.config.margin.top})`);

        self.radius = Math.min(self.inner_width, self.inner_height) / 2;
        
        self.pie_group = self.chart.append('g')
            .attr('transform', `translate(${self.inner_width / 2}, ${self.inner_height / 2})`);

        self.pie = d3.pie()
            .value( d => d.population );
        
        self.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(self.radius);
        
        self.svg.append("text")
            .attr("x", self.config.width / 2)
            .attr("y", self.config.margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("font-weight", "bold")
            .text(self.config.title);
    }

    update() {
        let self = this;

        self.render();
    }

    render() {
        let self = this;

        self.pie_group.selectAll('path')
            .data( self.pie(self.data) ) 
            .join('path')
            .attr('d', self.arc)
            .attr('fill', d => d.data.color) 
            .attr('stroke', 'white')
            .style('stroke-width', '2px');

        const labelArc = d3.arc()
            .outerRadius(self.radius * 0.7)
            .innerRadius(self.radius * 0.7);

        self.pie_group.selectAll('text')
            .data( self.pie(self.data) )
            .join('text')
            .attr('transform', d => `translate(${labelArc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('fill', 'black')
            .text(d => d.data.label);
    }
}
