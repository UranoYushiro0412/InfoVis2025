class SidePanel {
    constructor(config) {
        this.config = {
            parent: config.parent,
            width: config.width || 300,
            height: config.height || 600,
            maxHistory: 6 // Limit to 6 items
        };
        this.history = [];
        this.init();
    }

    init() {
        let self = this;
        self.container = d3.select(self.config.parent);

        // History List Title
        self.container.append('h3')
            .text('地震履歴 (M7.0↑ または 震度6弱↑)')
            .style('border-bottom', '2px solid #00796b')
            .style('padding-bottom', '5px')
            .style('margin-bottom', '15px');

        // Scroll Container for list
        self.list_container = self.container.append('div')
            .attr('class', 'history-list')
            .style('display', 'flex')
            .style('flex-direction', 'column')
            .style('gap', '8px')
            .style('height', '500px')
            .style('overflow', 'hidden'); // Animation handles the "sliding"
    }

    // Clear history (used when slider is touched)
    clear() {
        this.history = [];
        this.render();
    }

    update(currentQuakes) {
        let self = this;

        // Filter for M7.0+ OR Intensity 6-Lower+ (震度6弱以上)
        const highIntensityLevels = ['震度６弱', '震度６強', '震度７'];
        const significantQuakes = currentQuakes.filter(d =>
            d.magnitude >= 7.0 || highIntensityLevels.includes(d.intensity)
        );

        significantQuakes.forEach(quake => {
            // Check if already in history (prevent double counting in same time window)
            if (!self.history.find(h => h.id === quake.id)) {
                // Add to TOP
                self.history.unshift(quake);

                // Keep only last 6 (remove from bottom)
                if (self.history.length > self.config.maxHistory) {
                    self.history.pop();
                }

                // Render immediately
                self.render();
            }
        });
    }

    render() {
        let self = this;

        const items = self.list_container.selectAll('div.history-item')
            .data(self.history, d => d.id);

        items.join(
            enter => enter.append('div')
                .attr('class', 'history-item')
                .style('opacity', 0)
                .style('height', '0px')
                .style('margin-bottom', '-8px') // Compensate for gap during animation
                .style('background', '#fff')
                .style('padding', '0px 10px')
                .style('border-radius', '4px')
                .style('border-left', '4px solid #d32f2f')
                .style('box-shadow', '0 1px 2px rgba(0,0,0,0.1)')
                .style('overflow', 'hidden')
                .html(d => `
                    <div style="padding: 6px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <div>
                                <span style="font-weight:bold; color:#d32f2f; font-size:1.0em; margin-right: 8px;">M${d.magnitude.toFixed(1)}</span>
                                <span style="font-size:0.85em; font-weight:bold;">${d.intensity}</span>
                            </div>
                            <span style="font-size:0.75em; color:#666;">${d.timestamp.toLocaleDateString()} ${d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style="font-size:0.75em; color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.location || '震源地不明'}</div>
                    </div>
                `)
                .call(enter => enter.transition()
                    .duration(500)
                    .style('opacity', 1)
                    .style('height', '52px') // Target height
                    .style('margin-bottom', '0px')
                    .style('padding', '6px 10px')),
            update => update,
            exit => exit.transition()
                .duration(500)
                .style('opacity', 0)
                .style('height', '0px')
                .style('margin-bottom', '-8px')
                .style('padding', '0px 10px')
                .remove()
        );
    }
}
