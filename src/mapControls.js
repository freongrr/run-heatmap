const loadingOverlay = document.getElementById('loadOverlay');
const mapControls = document.getElementById('mapControls');

const mapWrapper = new MapWrapper();

mapWrapper.onLoadFilesStart = () => {
    loadingOverlay.style.display = 'block';
    mapControls.style.display = 'none';
};

mapWrapper.onLoadFilesFinish = () => {
    loadingOverlay.style.display = 'none';
    mapControls.style.display = 'block';
};

const yearSelect = document.getElementById('yearSelect');
for (let i = 2021; i >= 2013; i--) {
    const optionElement = document.createElement('option');
    optionElement.value = '' + i;
    optionElement.innerText = '' + i;
    yearSelect.appendChild(optionElement);
}
yearSelect.addEventListener('change', (e) => {
    mapWrapper.setYearFilter(e.target.value === '' ? null : +e.target.value);
});

document.getElementById('samplingSelect')
    .addEventListener('change', (e) => {
        mapWrapper.setDataSampling(+e.target.value);
    });

document.getElementById('showRawDataCheckbox')
    .addEventListener('change', (e) => {
        mapWrapper.setShowTracks(e.target.checked);
    });

mapWrapper.init('map');
