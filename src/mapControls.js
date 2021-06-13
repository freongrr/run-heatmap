const loadingOverlay = document.getElementById('loadOverlay');
const mapControls = document.getElementById('mapControls');

const mapWrapper = new MapWrapper();

mapWrapper.onLoadFilesStart = () => {
    loadingOverlay.innerText = 'Loading...';
    loadingOverlay.style.display = 'block';
    mapControls.style.display = 'none';
};

mapWrapper.onLoadFilesFinish = (e) => {
    if (e) {
        loadingOverlay.innerText = 'Error: ' + e.toString();
    } else {
        loadingOverlay.style.display = 'none';
        mapControls.style.display = 'block';
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
