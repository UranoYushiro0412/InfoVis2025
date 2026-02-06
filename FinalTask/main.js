let input_data = [];
let japan_geo;
let map_view;
let timeline_view;
let is_playing = false;
let animation_id = null;
let current_time;
let time_step = 1000 * 60 * 60 * 72; // Default: 3 days per step
let time_extent;
let current_data_index = 0; // Optimization: track current position in sorted data

// Helper to parse JMA coordinate format (e.g., 38°26.9′N)
function parseCoord(coordStr) {
    if (!coordStr) return 0;
    const matches = coordStr.match(/(\d+\.?\d*)/g);
    if (matches && matches.length >= 2) {
        const degrees = parseFloat(matches[0]);
        const minutes = parseFloat(matches[1]);
        return degrees + minutes / 60;
    }
    return matches ? parseFloat(matches[0]) : 0;
}

Promise.all([
    d3.json("data/japan.geojson"),
    d3.csv("data/earthquake_data_sort.csv")
]).then(([geoData, raw_data]) => {
    japan_geo = geoData;
    const findKey = (d, searchTerms) => Object.keys(d).find(k => searchTerms.some(term => k.includes(term)));

    input_data = raw_data.map((d, i) => {
        const dateKey = findKey(d, ['発生日']);
        const timeKey = findKey(d, ['時刻']);
        const latKey = findKey(d, ['緯度']);
        const lonKey = findKey(d, ['経度']);
        const magKey = findKey(d, ['M', 'Ｍ']);
        const locKey = findKey(d, ['震央']);
        const intKey = findKey(d, ['震度']);
        const lat = parseCoord(d[latKey]);
        const lon = parseCoord(d[lonKey]);
        const mag = parseFloat(d[magKey]);
        let timeVal = d[timeKey] || "";
        if (timeVal.split(':').length === 2) timeVal = "00:" + timeVal;
        return {
            id: i,
            date: d[dateKey],
            time_str: d[timeKey],
            timestamp: new Date(d[dateKey] + ' ' + timeVal),
            latitude: lat,
            longitude: lon,
            magnitude: mag || 0,
            location: d[locKey],
            intensity: d[intKey]
        };
    }).filter(d => !isNaN(d.latitude) && !isNaN(d.longitude) && !isNaN(d.timestamp.getTime()))
        .sort((a, b) => a.timestamp - b.timestamp);

    // Set fixed time range: 2006/01/01 to 2026/01/31
    time_extent = [new Date('2006/01/01 00:00:00'), new Date('2026/01/31 23:59:59')];
    current_time = new Date(time_extent[0]);

    map_view = new EarthquakeMap({ parent: '#map', width: 800, height: 600 }, [], japan_geo);
    timeline_view = new Timeline({ parent: '#timeline', width: 800, height: 50 }, input_data);
    side_panel_view = new SidePanel({ parent: '#side-panel-content', width: 300, height: 600 });

    timeline_view.render(time_extent);
    updateStep(true);

    d3.select('#play-pause').on('click', togglePlay);
    d3.select('#reset').on('click', resetAnimation);
    d3.select('#speed-select').on('change', function () {
        const hours = parseInt(this.value);
        time_step = 1000 * 60 * 60 * hours;
    });

    d3.select('#time-slider')
        .attr('max', 1000)
        .on('input', function () {
            side_panel_view.clear();
            map_view.clearQuakes();
            const pct = +this.value / 1000;
            const totalDuration = time_extent[1] - time_extent[0];
            current_time = new Date(time_extent[0].getTime() + totalDuration * pct);
            updateStep(true);
        });
}).catch(error => console.error("Data loading error:", error));

function togglePlay() {
    is_playing = !is_playing;
    d3.select('#play-pause').text(is_playing ? 'Pause' : 'Play');
    if (is_playing) {
        map_view.resumeTransitions();
        animate();
    } else {
        cancelAnimationFrame(animation_id);
        map_view.pauseTransitions(); // Freeze current animations
    }
}

function resetAnimation() {
    is_playing = false;
    current_time = new Date(time_extent[0]);
    current_data_index = 0;
    side_panel_view.clear();
    map_view.clearQuakes(); // Clear circles on map
    updateStep(true);
    d3.select('#play-pause').text('Play');
    d3.select('#time-slider').property('value', 0);
    cancelAnimationFrame(animation_id);
}

function animate() {
    if (current_time <= time_extent[1]) {
        updateStep();
        current_time = new Date(current_time.getTime() + time_step);
        setTimeout(() => {
            if (is_playing) animation_id = requestAnimationFrame(animate);
        }, 50);
    } else {
        is_playing = false;
        d3.select('#play-pause').text('Play');
    }
}

function updateStep(manual = false) {
    if (manual) {
        // If manually scrubbing, reset the search to find the START of the window
        const windowStartSearch = new Date(current_time.getTime() - time_step);
        current_data_index = input_data.findIndex(d => d.timestamp >= windowStartSearch);
        if (current_data_index === -1) current_data_index = input_data.length;
    }

    const windowStart = new Date(current_time.getTime() - time_step);

    // Optimized: instead of filter(), grab quakes since the last index
    let quakes = [];
    while (current_data_index < input_data.length && input_data[current_data_index].timestamp <= current_time) {
        if (input_data[current_data_index].timestamp > windowStart) {
            quakes.push(input_data[current_data_index]);
        }
        current_data_index++;
    }
    // If we incremented the index but quakes list is empty (time step was small),
    // we might need to backtrack slightly or handle the "jump" case.
    // However, for sequential animation, this is the most efficient.

    const dateStr = current_time.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    map_view.update(quakes, dateStr);

    if (!manual) {
        const totalDuration = time_extent[1] - time_extent[0];
        const elapsed = current_time - time_extent[0];
        d3.select('#time-slider').property('value', (elapsed / totalDuration) * 1000);
    }

    timeline_view.update(current_time);
    side_panel_view.update(quakes);

    d3.select('#current-date').text(`日付: ${dateStr}`);
    timeline_view.update(current_time);
}
