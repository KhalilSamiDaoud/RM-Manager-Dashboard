const timer = ms => new Promise(res => setTimeout(res, ms));

function isColor(strColor) {
    if (!strColor) return false;

    let s = new Option().style;
    s.color = strColor;

    return (s.color == strColor);
}

function rgbToHex(rgbString) {
    try {
        let rbgRegex = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
        let colors = rbgRegex.exec(rgbString);

        return (colors) ?
            '#' + ((1 << 24) + (~colors[0] << 16) + (~colors[1] << 8) + ~colors[2]).toString(16) :
            (() => { throw new Error('ERROR: invalid RBG string'); });
    }
    catch (err) {
        console.error(err);
        return '#000';
    }
}

function timeToString(time = clockCurrTime, round = true) {
    if (round)
        time = ((time % 1) > 0.5) ? Math.ceil(time) : Math.floor(time);

    let hours = Math.floor(time / 60);
    let minutes = time % 60;

    if (hours < 12)
        return (hours == 0) ? ('00' + hours + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' :
            ('00' + hours).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM';
    else if (hours == 12)
        return ('00' + 12).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
    else
        return (hours == 24) ? ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' AM' :
            ('00' + (hours - 12)).slice(-2) + ':' + ('00' + minutes).slice(-2) + ' PM';
}

// mode 0 = time array [hr,min,sec]
// mode 1 = minutes representation
// mode 2 = both [minutes, [hr,min,sec]]
function parseTime(timeString, mode = 1) {
    let UDTfix = (timeString.length > 11) ? true : false;
    let hms, minutes;

    if (UDTfix)
        timeString = new Date(timeString).toLocaleTimeString();

    hms = timeString.substring(0, 11).split(/:| /);

    switch (mode) {
        case 0:
            return hms;
        case 1:
        case 2:
            minutes = (+hms[0]) * 60 + (+hms[1]) + (+hms[2] / 60);

            if (hms[hms.length - 1] == 'PM')
                minutes = (+hms[0] != 12) ? minutes + 720 : minutes;
            else if (hms[hms.length - 1] == 'AM')
                minutes = (+hms[0] != 12) ? minutes : minutes - 720;

            if (mode == 1)
                return minutes;
            else {
                if ((hms[hms.length - 1] == 'AM' && +hms[0] == 12))
                    return [minutes, [(+hms[0] - 12), +hms[1], +hms[2]]];
                if ((hms[hms.length - 1] == 'PM' && +hms[0] != 12))
                    return [minutes, [(+hms[0] + 12), +hms[1], +hms[2]]];

                return [minutes, [+hms[0], +hms[1], +hms[2]]];
            }
        default:
            throw new Error('invalid mode (' + mode + ')');
    }
}

export { isColor, rgbToHex, timeToString, timer, parseTime };