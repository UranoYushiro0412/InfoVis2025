class EarthquakeMap {
    constructor(config, data, geoData) {
        this.config = {
            parent: config.parent,
            width: config.width || 800,
            height: config.height || 600,
            margin: config.margin || { top: 20, right: 20, bottom: 20, left: 20 }
        };
        this.data = data;
        this.geoData = geoData;
        this.init();
    }

    init() {
        let self = this;

        self.svg = d3.select(self.config.parent)
            .attr('width', self.config.width)
            .attr('height', self.config.height);

        // Projection for Japan - Final adjustment to optimize centering
        self.projection = d3.geoMercator()
            .center([137.0, 35.6])
            .scale(1300)
            .translate([self.config.width / 2, self.config.height / 2]);

        self.path = d3.geoPath().projection(self.projection);

        // Draw Map
        self.svg.append('g')
            .selectAll('path')
            .data(self.geoData.features)
            .join('path')
            .attr('d', self.path)
            .attr('fill', '#ECEFF1')
            .attr('stroke', '#CFD8DC')
            .attr('stroke-width', 0.5);

        // Graticule
        const graticule = d3.geoGraticule().step([5, 5]);
        self.svg.append('path')
            .datum(graticule)
            .attr('d', self.path)
            .attr('fill', 'none')
            .attr('stroke', '#B0BEC5')
            .attr('stroke-width', 0.2)
            .attr('stroke-dasharray', '2,2');

        // Layers
        self.quake_layer = self.svg.append('g');
        self.overlay_layer = self.svg.append('g');

        // UI Overlay: Date and Max Intensity
        self.date_text = self.overlay_layer.append('text')
            .attr('x', 20)
            .attr('y', 45)
            .attr('font-size', '28px')
            .attr('font-weight', 'bold')
            .attr('fill', '#263238')
            .style('font-family', '"Courier New", Courier, monospace')
            .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)');

        // Mouse coordinates
        self.coord_text = self.overlay_layer.append('text')
            .attr('x', 20)
            .attr('y', self.config.height - 15)
            .attr('font-size', '11px')
            .attr('fill', '#78909C')
            .style('font-family', 'monospace')
            .text('Lat: --, Lon: --');

        self.svg.on('mousemove', (event) => {
            const [x, y] = d3.pointer(event);
            const [lon, lat] = self.projection.invert([x, y]);
            self.coord_text.text(`北緯: ${lat.toFixed(2)}°, 東経: ${lon.toFixed(2)}°`);
        });

        this.drawLegends();
    }

    getIntensityColor(intensity) {
        const colors = {
            '震度４': '#81D4FA',   // 水色 (Light Blue)
            '震度５弱': '#FFF176', // 黄色 (Yellow)
            '震度５強': '#FFB74D', // オレンジ (Orange)
            '震度６弱': '#E57373', // 赤色 (Red)
            '震度６強': '#C62828', // 濃い赤色 (Dark Red)
            '震度７': '#9C27B0'    // 紫色 (Purple)
        };
        return colors[intensity] || '#CFD8DC';
    }

    getRadius(m) {
        if (m > 2) {
            // Steeper power-based scaling to emphasize larger events: 2 * (M - 2)^2 + 2
            return Math.pow(m - 2, 2) * 2 + 2;
        } else {
            // Linear scaling for very small events
            return Math.max(1, m * 1.5);
        }
    }

    drawLegends() {
        let self = this;
        const bgWidth = 220;
        const bgHeight = 230;
        const legendX = self.config.width - bgWidth - 20;
        const legendY = self.config.height - bgHeight - 20;

        const legendGroup = self.svg.append('g')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Background for legends
        legendGroup.append('rect')
            .attr('width', bgWidth)
            .attr('height', bgHeight)
            .attr('fill', 'rgba(255, 255, 255, 0.85)')
            .attr('rx', 8);

        // Magnitude Legend (Horizontal)
        const magLegend = legendGroup.append('g').attr('transform', 'translate(7, 50)');
        magLegend.append('text')
            .attr('y', -22)
            .text('マグニチュード')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold');

        const magValues = [3, 5, 7];
        const circleGap = 20; // Constant gap between circumferences
        let currentX = 12;    // Start margin

        magValues.forEach((m) => {
            const r = self.getRadius(m);
            const centerX = currentX + r;
            const centerY = 35;

            magLegend.append('circle')
                .attr('cx', centerX)
                .attr('cy', centerY)
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#455A64')
                .attr('stroke-width', 1);

            const isInside = (m > 3);
            magLegend.append('text')
                .attr('x', centerX)
                .attr('y', isInside ? centerY + 4 : 58) // Center in circle for M5/M7, closer below for M3
                .attr('text-anchor', 'middle')
                .attr('font-size', isInside ? '10px' : '11px') // Slightly smaller inside to fit
                .attr('font-weight', isInside ? 'bold' : 'normal')
                .text(`M${m}`);

            currentX = centerX + r + circleGap;
        });

        // Intensity Legend - Two Column Layout to save height
        const intLegend = legendGroup.append('g').attr('transform', 'translate(10, 145)');
        intLegend.append('text')
            .attr('y', 0)
            .text('震度')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold');

        const labels = ['震度４', '震度５弱', '震度５強', '震度６弱', '震度６強', '震度７'];
        labels.forEach((label, i) => {
            const col = i < 3 ? 0 : 1;
            const row = i % 3;
            const xPos = col * 85;
            const yPos = 18 + row * 22;

            intLegend.append('rect')
                .attr('x', xPos)
                .attr('y', yPos)
                .attr('width', 14)
                .attr('height', 14)
                .attr('fill', self.getIntensityColor(label))
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5);

            intLegend.append('text')
                .attr('x', xPos + 22)
                .attr('y', yPos + 11)
                .attr('font-size', '11px')
                .text(label.replace('震度', ''));
        });
    }

    update(quakes, dateStr) {
        let self = this;
        self.date_text.text(dateStr);

        const groups = self.quake_layer.selectAll('g.quake-group')
            .data(quakes, d => d.id);

        const enter = groups.enter().append('g')
            .attr('class', 'quake-group');

        // Multi-stage animation: Quick grow to legend size -> Hold -> Shrink and fade
        enter.append('circle')
            .attr('cx', d => self.projection([d.longitude, d.latitude])[0])
            .attr('cy', d => self.projection([d.longitude, d.latitude])[1])
            .attr('r', 0) // Start from 0
            .attr('fill', d => self.getIntensityColor(d.intensity))
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .attr('opacity', 1.0)
            .transition()
            .duration(200) // Fast growth
            .attr('r', d => self.getRadius(d.magnitude))
            .transition()
            .duration(500) // Hold briefly at the exact legend size
            .transition()
            .duration(300) // Shrink and fade away
            .attr('r', 0)
            .attr('opacity', 0)
            .remove();
    }

    clearQuakes() {
        this.quake_layer.selectAll('g.quake-group').interrupt().remove();
    }

    pauseTransitions() {
        this.quake_layer.selectAll('g.quake-group circle').interrupt();
    }

    resumeTransitions() {
        // Restart the fade-out/shrink transition for any frozen circles
        this.quake_layer.selectAll('g.quake-group circle')
            .transition()
            .duration(500)
            .attr('r', 0)
            .attr('opacity', 0)
            .remove();
    }
}
