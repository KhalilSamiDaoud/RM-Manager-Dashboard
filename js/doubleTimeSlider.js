import './nouislider.min.js';

const LEFT_VALUE = document.getElementById('lefttimevalue');
const RIGHT_VALUE = document.getElementById('righttimevalue');
const SLIDER = noUiSlider.create(document.getElementById("timeslider"), {
    start: [0, 1440],
    tooltips: [false, false],
    connect: true,
    step: 15,
    range: {
        'min': 0,
        'max': 1440
    }
});

var convertValuesToTime = function (values, handle) {
    var hours = 0,
        minutes = 0;

    if (handle === 0) {
        hours = convertToHour(values[0]);
        minutes = convertToMinute(values[0], hours);
        LEFT_VALUE.innerHTML = formatHoursAndMinutes(hours, minutes) + ' AM';
        return;
    };

    hours = convertToHour(values[1]);
    minutes = convertToMinute(values[1], hours);
    RIGHT_VALUE.innerHTML = formatHoursAndMinutes(hours, minutes) + ' PM';

};

var convertToHour = function (value) {
    return Math.floor(value / 60);
};
var convertToMinute = function (value, hour) {
    return value - hour * 60;
};
var formatHoursAndMinutes = function (hours, minutes) {
    if (hours.toString().length == 1) hours = '0' + hours;
    if (minutes.toString().length == 1) minutes = '0' + minutes;
    return hours + ':' + minutes;
};

SLIDER.on('update', function (values, handle) {
    convertValuesToTime(values, handle);
});
