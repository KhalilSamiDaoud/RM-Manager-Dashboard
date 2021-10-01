//JS style enums
const initMode = Object.freeze({ test: 0, file: 1, API: 2, live: 3, none: 4 });
const tripType = Object.freeze({ pickup: 'hail', dropoff: 'follow_the_signs', fixedstop: 'directions_bus', depot: 'emoji_transportation', unknown: 'not_listed_location' });
const simArea = Object.freeze({ DC: 'DC Area', Cust: 'Custom Area' });
const windowType = Object.freeze({ statistics: 'statistics', log: 'eventlog', queue: 'tripqueue', unknown: 'unknown' });
const vehStatus = Object.freeze({ starting: 0, depot: 1, route: 2, loop: 3 });
const eventSeverity = Object.freeze({ none: 0, low: 1, med: 2, high: 3 });
const initEventEntry = Object.freeze({ 
    test: 'Initialized in test mode', 
    file: 'Initialized from file', 
    API: 'Initialized from API', 
    live: 'Initialized with live feed',
    APIError: 'Failed to initialize from API' 
});

//API Consts
const APIColumns = Object.freeze({
    splTrpIndex: 0,
    vehNumIndex: 1,
    typeIndex: 2,
    requestTimeIndex: 3,
    scheduleTimeIndex: 4,
    passengerIndex: 5,
    nameIndex: 6,
    latIndex: 7,
    longIndex: 8,
    adrIndex: 9,
    estTimeIndex: 10,
    estDistanceIndex: 11
});

const APIURL = 'http://192.168.8.25:1235/';
const APIFunctions = Object.freeze({ getTrips: 'get-trips?date=' });

//Const. values
const vehicleIDletter = 'ABCD';
const windowOptions = 'toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars=1,resizable=1,width=400,height=800,';
const dstatsTableHeader = '<tr><th>Vehicle</th><th>Passengers Served</th><th>Idle Time</th><th>Milage</th><th>Revenue</th><th>Avg. Trip Distance</th><th>Avg. Trip Time</th><th>Avg. Wait Time</th></tr>';
const SimulationNotification = '<div class="white-text header-notification"><i class="material-icons blue-text">smart_toy</i>SIMULATED</div>';
const liveNotification = '<div class="white-text header-notification"><i class="material-icons red-text">circle</i>LIVE</div>';

const colors =
    [
        { hex: '#ff0000', class: 'red-text' },
        { hex: '#ab47bc', class: 'purple-text text-lighten-1' },
        { hex: '#4caf50', class: 'green-text' },
        { hex: '#2196f3', class: 'blue-text' },
        { hex: '#424242', class: 'grey-text text-darken-3' },
        { hex: '#009688', class: 'teal-text' },
        { hex: '#ff9800', class: 'orange-text' },
        { hex: '#f06292', class: 'pink-text text-lighten-2' },
        { hex: '#8d6e63', class: 'brown-text text-lighten-1' },
        { hex: '#ff5722', class: 'deep-orange-text' },
        { hex: '#000000', class: 'black-text' }
    ];

const warningColors = 
    [
        { hex: '#fff9c4', class: 'yellow lighten-4' },
        { hex: '#ffe0b2', class: 'orange lighten-4' },
        { hex: '#ef9a9a', class: 'red lighten-4' },
        { hex: '#ffffff', class: 'white' }
    ]

const defaultZonePath =
    [
        { lat: 38.941783, lng: -77.1219338 },
        { lat: 38.954390, lng: -77.1088367 },
        { lat: 38.948603, lng: -77.1007886 },
        { lat: 38.917357, lng: -77.0579591 },
        { lat: 38.904801, lng: -77.0822492 },
    ];

const initCoords =
    [
        { lat: 38.902183, lng: -77.036842 },
        { lat: 34.051226, lng: -118.243546 }
    ];

//(testing only) fixed-stop loops & rand trip
const fixedStopLoopsDC = [
    [

        { name: 'Fixed Stop [1]', type: tripType.fixedstop, PUcoords: { lat: 38.912927, lng: -77.073144 }, DOcoords: { lat: 38.912597, lng: -77.084570 }, PUadr: '123 street', DOadr: '456 street', speed: 5, idleTime: 4 },
        { name: 'Fixed Stop [2]', type: tripType.fixedstop, PUcoords: { lat: 38.912597, lng: -77.084570 }, DOcoords: { lat: 38.932712, lng: -77.090764 }, PUadr: '456 street', DOadr: '789 street', speed: 5, idleTime: 3 },
        { name: 'Fixed Stop [3]', type: tripType.fixedstop, PUcoords: { lat: 38.932712, lng: -77.090764 }, DOcoords: { lat: 38.912927, lng: -77.073144 }, PUadr: '789 street', DOadr: '123 street', speed: 5, idleTime: 3 },
    ],
    [
        { name: 'Fixed Stop [1]', type: tripType.fixedstop, PUcoords: { lat: 38.892258, lng: -77.019672 }, DOcoords: { lat: 38.892402, lng: -77.003684 }, PUadr: '123 street', DOadr: '456 street', speed: 3, idleTime: 2 },
        { name: 'Fixed Stop [2]', type: tripType.fixedstop, PUcoords: { lat: 38.892402, lng: -77.003684 }, DOcoords: { lat: 38.900343, lng: -76.983527 }, PUadr: '456 street', DOadr: '777 street', speed: 3, idleTime: 2 },
        { name: 'Fixed Stop [3]', type: tripType.fixedstop, PUcoords: { lat: 38.900343, lng: -76.983527 }, DOcoords: { lat: 38.908574, lng: -77.004422 }, PUadr: '777 street', DOadr: '888 street', speed: 3, idleTime: 2 },
        { name: 'Fixed Stop [4]', type: tripType.fixedstop, PUcoords: { lat: 38.908574, lng: -77.004422 }, DOcoords: { lat: 38.903424, lng: -77.019672 }, PUadr: '888 street', DOadr: '899 street', speed: 3, idleTime: 2 },
        { name: 'Fixed Stop [5]', type: tripType.fixedstop, PUcoords: { lat: 38.903424, lng: -77.019672 }, DOcoords: { lat: 38.892258, lng: -77.019672 }, PUadr: '888 street', DOadr: '999 street', speed: 3, idleTime: 2 }
    ]];

const fixedStopLoopsLA = [
    [
        { name: 'Fixed Stop [1]', type: tripType.fixedstop, PUcoords: { lat: 34.057226, lng: -118.233546 }, DOcoords: { lat: 34.054226, lng: -118.193546 }, PUadr: '123 street', DOadr: '456 street', speed: 3, idleTime: 3 },
        { name: 'Fixed Stop [2]', type: tripType.fixedstop, PUcoords: { lat: 34.054226, lng: -118.193546 }, DOcoords: { lat: 34.054226, lng: -118.233546 }, PUadr: '456 street', DOadr: '777 street', speed: 5, idleTime: 4 },
        { name: 'Fixed Stop [3]', type: tripType.fixedstop, PUcoords: { lat: 34.054226, lng: -118.233546 }, DOcoords: { lat: 34.057226, lng: -118.233546 }, PUadr: '777 street', DOadr: '888 street', speed: 1, idleTime: 4 },
    ]];

const randTrip = { name: 'Trip 1', type: tripType.pickup, PUcoords: { lat: 38.849493, lng: -77.103652 }, DOcoords: { lat: 38.878080, lng: -77.150429 }, PUadr: '123 street', DOadr: '456 street', speed: 12, idleTime: 2 };

//encoded SVGs
var depotSVG = ['<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#484848">',
    '<g>', '<rect fill="none" height="24" width="24" />', '</g>', '<g>', '<g />', '<g>',
    '<path d="M20.57,10.66C20.43,10.26,20.05,10,19.6,10h-7.19c-0.46,0-0.83,0.26-0.98,0.66L10,14.77l0.01,5.51 c0,0.38,0.31,0.72,0.69,0.72h0.62C11.7,21,12,20.62,12,20.24V19h8v1.24c0,0.38,0.31,0.76,0.69,0.76h0.61 c0.38,0,0.69-0.34,0.69-0.72L22,18.91v-4.14L20.57,10.66z M12.41,11h7.19l1.03,3h-9.25L12.41,11z M12,17c-0.55,0-1-0.45-1-1 s0.45-1,1-1s1,0.45,1,1S12.55,17,12,17z M20,17c-0.55,0-1-0.45-1-1s0.45-1,1-1s1,0.45,1,1S20.55,17,20,17z" />',
    '<polygon points="14,9 15,9 15,3 7,3 7,8 2,8 2,21 3,21 3,9 8,9 8,4 14,4" />',
    '<rect height="2" width="2" x="5" y="11" />', '<rect height="2" width="2" x="10" y="5" />', '<rect height="2" width="2" x="5" y="15" />',
    '<rect height="2" width="2" x="5" y="19" />', '</g >', '</g >', '</svg >'].join('\n');

var dropoffSVG = ['<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="{{ color }}">', '<path d="M0 0h24v24H0z" fill="none" />',
    '<path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />',
    '</svg >'].join('\n');

var pickupSVG = ['<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="{{ color }}">', '<g>',
    '<rect fill="none" height="24" width="24" />', '</g >', '<g>', '<g />', '<g>',
    '<circle cx="12" cy="4" r="2" />', '<path d="M15.89,8.11C15.5,7.72,14.83,7,13.53,7c-0.21,0-1.42,0-2.54,0C8.24,6.99,6,4.75,6,2H4c0,3.16,2.11,5.84,5,6.71V22h2v-6h2 v6h2V10.05L18.95,14l1.41-1.41L15.89,8.11z" />',
    '</g >', '</g >', '</svg >'].join('\n');

var stopSVG = ['<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">',
    '<g transform="translate(0 -1)">', '<g>', '<g>', '<polygon points="328.533,86.333 328.533,137.533 354.133,137.533 354.133,94.867 354.133,86.333" />', '<polygon points="285.867,94.867 285.867,137.533 311.467,137.533 311.467,86.333 285.867,86.333" />',
    '</g >', '</g>', '</g>', '<g>', '<g>', '<path d="M405.333,25.6H234.667c-5.12,0-8.533,3.413-8.533,8.533v51.2H192V25.6C192,11.093,180.907,0,166.4,0c-14.507,0-25.6,11.093-25.6,25.6v435.2c-23.893,0-42.667,18.773-42.667,42.667c0,5.12,3.413,8.533,8.533,8.533h119.467c5.12,0,8.533-3.413,8.533-8.533c0-23.893-18.773-42.667-42.667-42.667V256h34.133v51.2c0,5.12,3.413,8.533,8.533,8.533h170.667c5.12,0,8.533-3.413,8.533-8.533V34.133C413.867,29.013,410.453,25.6,405.333,25.6z M226.133,238.933H192V102.4h34.133V238.933zM268.8,145.067v-51.2V76.8c0-5.12,3.413-8.533,8.533-8.533h85.333c5.12,0,8.533,3.413,8.533,8.533v17.067v51.2V179.2c0,5.12-3.413,8.533-8.533,8.533s-8.533-3.413-8.533-8.533v-25.6h-68.267v25.6c0,5.12-3.413,8.533-8.533,8.533c-5.12,0-8.533-3.413-8.533-8.533V145.067z M362.667,213.333c0,5.12-3.413,8.533-8.533,8.533h-68.267c-5.12,0-8.533-3.413-8.533-8.533c0-5.12,3.413-8.533,8.533-8.533h68.267C359.253,204.8,362.667,208.213,362.667,213.333zM371.2,264.533H268.8c-5.12,0-8.533-3.413-8.533-8.533s3.413-8.533,8.533-8.533h102.4c5.12,0,8.533,3.413,8.533,8.533S376.32,26.533,371.2,264.533z" />',
    '</g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>', '<g>', '</g>',
    '</svg>'].join('\n');

const dashedLineSymbol = { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 };

export {
    initMode, tripType, vehStatus, simArea, windowType, vehicleIDletter, windowOptions, colors, initCoords, fixedStopLoopsDC, 
    fixedStopLoopsLA, randTrip, depotSVG, dropoffSVG, pickupSVG, stopSVG, dashedLineSymbol, initEventEntry, APIColumns, APIURL,
    APIFunctions, dstatsTableHeader, liveNotification, SimulationNotification, eventSeverity, warningColors, defaultZonePath
};

