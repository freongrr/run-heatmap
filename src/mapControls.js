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

document.getElementById('samplingSelect')
    .addEventListener('change', (e) => {
        mapWrapper.setDataSampling(+e.target.value);
    });

document.getElementById('showPointsCheckbox')
    .addEventListener('change', (e) => {
        mapWrapper.setShowTracks(e.target.checked);
    });

mapWrapper.init('map');
