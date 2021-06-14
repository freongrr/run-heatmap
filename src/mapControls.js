const loadingOverlay = document.getElementById('loadOverlay');
const mapControls = document.getElementById('mapControls');
const trackOverlay = document.getElementById('trackOverlay');
const selectedTracks = document.getElementById('selectedTracks');

const mapWrapper = new MapWrapper();

mapWrapper.onLoadFilesStart = () => {
    loadingOverlay.style.display = 'block';
    mapControls.style.display = 'none';
};

mapWrapper.onLoadFilesFinish = (e) => {
    loadingOverlay.style.display = 'none';
    mapControls.style.display = 'block';
};

mapWrapper.onSelection = (features) => {
    while (selectedTracks.children.length > 0) {
        selectedTracks.removeChild(selectedTracks.children[0]);
    }

    const titleElement = document.createElement('h2');
    if (features.length > 1) {
        titleElement.innerText = `${features.length} tracks selected`;
    } else {
        titleElement.innerText = `${features.length} track selected`;
    }
    selectedTracks.appendChild(titleElement);

    //features.sort((a, b) => +a.properties.trackId - +b.properties.trackId);
    for (let i = 0; i < Math.min(10, features.length); i++) {
        const f = features[i];
        const divElement = document.createElement('div');
        const aElement = document.createElement('a');
        aElement.innerText = `${f.properties.description} (${formatTime(f.properties.time)})`;
        aElement.href = 'https://www.strava.com/activities/' + f.properties.trackId;
        divElement.appendChild(aElement);
        selectedTracks.appendChild(divElement);
    }
    // Hide/show the block
    if (features.length === 0) {
        trackOverlay.style.display = 'none';
        selectedTracks.style.display = 'none';
    } else {
        trackOverlay.style.display = 'block';
        selectedTracks.style.display = 'block';
    }
};

/* Year Filter */

const yearSelect = document.getElementById('yearSelect');
addSelectOption(yearSelect, '', 'All', true);
for (let i = 2021; i >= 2013; i--) {
    addSelectOption(yearSelect, '' + i, '' + i, false);
}
yearSelect.addEventListener('change', (e) => {
    mapWrapper.setYearFilter(e.target.value === '' ? null : +e.target.value);
});

/* Data Sampling */

const samplingSelect = document.getElementById('samplingSelect');
[2, 4, 8, 16, 32, 64].forEach((o) => {
    addSelectOption(samplingSelect, '' + o, '1/' + o, o === mapWrapper.skipCount);
});
samplingSelect.addEventListener('change', (e) => {
    mapWrapper.setDataSampling(+e.target.value);
});

/* Raw Data Render */

const rawDataSelect = document.getElementById('rawDataSelect');
['Hidden', 'Tracks', 'Points'].forEach((o) => {
    addSelectOption(rawDataSelect, o, o, o === mapWrapper.rawDataMode);
});
rawDataSelect.addEventListener('change', (e) => {
    mapWrapper.setRawDataRender(e.target.value);
});

mapWrapper.init('map');

/* Shared stuff */

function addSelectOption(selectElement, value, label, selected) {
    const optionElement = document.createElement('option');
    optionElement.value = value;
    optionElement.innerText = label;
    if (selected) {
        optionElement.selected = selected;
    }
    selectElement.appendChild(optionElement);
}

function formatTime(timeString) {
    // Raw format: 2014-12-07T05:54:07Z)
    // TODO : better format including local time?
    return timeString.substring(0, 10)
}
