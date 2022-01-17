import './nouislider.min.js';
import { activeVehicle } from './liveQueue.js';
import { timeToString } from './utils.js';

const LEFT_VALUE = document.getElementById('lefttimevalue');
const RIGHT_VALUE = document.getElementById('righttimevalue');
const RESET_SLIDER = document.getElementById('resettimeslider');
const QUEUE_FOOTER = document.getElementById('queuefooter');

const SLIDER = noUiSlider.create(document.getElementById("timeslider"), {
    start: [0, 1439],
    tooltips: [false, false],
    connect: true,
    step: 5,
    range: {
        'min': 0,
        'max': 1439
    },
    pips: {
        mode: 'values',
        values: [360, 720, 1080],
        density: 3,
        format: {
            to: function(value) {
                return formatPipTime(value);
            },
            from: Number
        }
    }
});

SLIDER.on('update', (values, handle) => {
    handleSliderUpdate(values, handle);
});

document.getElementById("timeslider").addEventListener('click', () => {
    if (activeVehicle?.vehicle) {
        activeVehicle.vehicle.updateTimedMarkers();
    }
});

RESET_SLIDER.addEventListener('click', () => {
    SLIDER.set([0, 1439]);

    if (activeVehicle?.vehicle) {
        activeVehicle.vehicle.tripDisplayWindow.setTimeVals([0, 1439]);
        activeVehicle.vehicle.updateTimedMarkers();
    }
});

function handleSliderUpdate(values, handle = -1) {
    if (activeVehicle?.vehicle)
        activeVehicle.vehicle.tripDisplayWindow.setTimeVals(values);

    if (handle === 0) {
        LEFT_VALUE.innerText = timeToString(values[0]);
        return;
    };
    if (handle === -1) {
        LEFT_VALUE.innerText = timeToString(values[0]);
    }

    RIGHT_VALUE.innerText = timeToString(values[1]);
};

function checkQFooterDisabled(newSelection) {
    if(newSelection?.vehicle)
        QUEUE_FOOTER.classList.remove('disable-control');
    else {
        QUEUE_FOOTER.classList.add('disable-control');
    }
}

function formatPipTime(value) {
    let tempTime = timeToString(value);

    return (tempTime[0] === '0') ? tempTime.substring(1, tempTime.length) : tempTime;
}

function setSlider(values) {
    SLIDER.set(values);
}

export { setSlider, checkQFooterDisabled };