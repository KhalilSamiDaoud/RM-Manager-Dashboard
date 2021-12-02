import { vehicles, liveVehicles, createVehicle, createLiveVehicle, clearVehicles, sortVehicleList } from './vehicleList.js';
import { calcWaitTime } from './simMath.js';
import { createZone } from './zoneList.js';
import { TRIP_TYPE } from './constants.js';
import { Trip } from './trip.js';

const timer = ms => new Promise(res => setTimeout(res, ms));

function findColIndex(tripListObj) {
    return {
        estDistanceIndex: tripListObj[0].indexOf('EstTravelDistance'),
        requestTimeIndex: tripListObj[0].indexOf('Requested Time'),
        scheduleTimeIndex: tripListObj[0].indexOf('Schedule Time'),
        splTrpIndex: tripListObj[0].indexOf('SpecialTripTypeID'),
        passengerIndex: tripListObj[0].indexOf('PassengerCount'),
        estTimeIndex: tripListObj[0].indexOf('EstTravelTime'),
        vehNumIndex: tripListObj[0].indexOf('Vehicle#'),
        typeIndex: tripListObj[0].indexOf('Node Type'),
        adrIndex: tripListObj[0].indexOf('Address'),
        nameIndex: tripListObj[0].indexOf('Name'),
        longIndex: tripListObj[0].indexOf('Long'),
        latIndex: tripListObj[0].indexOf('Lat')
    }
}

function findVehicleIndex(records, fileColumns) {
    let vehIndxs = {}
    let currVeh = '';

    for (let i = 0; i < records.length; i++) {
        if (records[i]?.[fileColumns.vehNumIndex] && records[i][fileColumns.vehNumIndex] != currVeh) {
            vehIndxs[records[i][fileColumns.vehNumIndex]] = i;
            currVeh = records[i][fileColumns.vehNumIndex];
        }
    }

    return vehIndxs;
}

function trimStreetNames(tripListObj, fileColumns) {
    tripListObj.forEach(record => {
        if (record[fileColumns.adrIndex] != null && record[fileColumns.adrIndex] != undefined && record[fileColumns.adrIndex].includes(','))
            record[fileColumns.adrIndex] = record[fileColumns.adrIndex].substr(0, record[fileColumns.adrIndex].indexOf(','));
    });

    return tripListObj;
}

// 'records' == tripListObj w/o col-header (-row 0) & trimmed street names
function fullParse(records, fileColumns) {
    getVehiclesFromJSON(records, fileColumns);
    getFixedStopsFromJSON(records, fileColumns);
    getQueueFromJSON(records, fileColumns);
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

function getTripType(record, fileColumns) {
    switch (record[fileColumns.typeIndex]) {
        case 'PU':
            return TRIP_TYPE.pickup;
        case 'DO':
            return TRIP_TYPE.dropoff;
        case 'StartDepot':
        case 'EndDepot':
            return TRIP_TYPE.depot;
        default:
            return TRIP_TYPE.unknown;
    }
}

function getClockStartTime(records, fileColumns) {
    let startTime = Number.MAX_VALUE;

    records.forEach(record => {
        if (record[fileColumns.scheduleTimeIndex] != undefined) {
            let requestTime = parseTime(record[fileColumns.scheduleTimeIndex]);
            startTime = (requestTime < startTime) ? requestTime : startTime;
        }
    });

    return Math.floor(startTime);
}

function getMapCenter(records, fileColumns) {
    if (records[0][fileColumns.typeIndex] == 'StartDepot')
        return { lat: records[0][fileColumns.latIndex], lng: records[0][fileColumns.longIndex] };
    else if (records[records.length - 1][fileColumns.typeIndex] == 'EndDepot')
        return { lat: records[records.length - 1][fileColumns.latIndex], lng: records[records.length - 1][fileColumns.longIndex] };
    else
        return { lat: records[0][fileColumns.latIndex], lng: records[0][fileColumns.longIndex] };
}

function getVehiclesFromJSON(records, fileColumns) {
    let uniqueVeh = [];
    clearVehicles();

    records.forEach(record => {
        if (!uniqueVeh.includes(record[fileColumns.vehNumIndex]) && record[fileColumns.vehNumIndex] != undefined) {
            let count = 0;

            for (var i = records.indexOf(record); i < records.length; i++) {
                if (records[i][fileColumns.vehNumIndex] == record[fileColumns.vehNumIndex]) {
                    count++;
                }
                else { break; }
            }
            uniqueVeh.push(record[fileColumns.vehNumIndex]);
            createVehicle(record[fileColumns.vehNumIndex], Math.floor((count / 8 + 5)), parseTime(record[fileColumns.scheduleTimeIndex]));
        }
    });

    sortVehicleList();
}

function getLiveVehiclesFromJSON(records, fileColumns) {
    records.forEach(record => {
        createLiveVehicle(record[fileColumns.vehID], 10, 0, { lat: record[fileColumns.vehLat], lng: record[fileColumns.vehLng] }, 
            record[fileColumns.vehZone], record[fileColumns.vehHeading], record[fileColumns.vehColor]);
    });
}

function getZonesFromJSON(records, fileColumns) {
    records.forEach(record => {
        createZone(record[fileColumns.zoneName], record[fileColumns.zoneColor]);
    });
}

function getLiveTripsFromJSON(records, fileColumns) {
    for (let i = 0; i < records.length; i++) {
        if (records[i][fileColumns.vehID] == -1 || records[i][fileColumns.vehID] == 0) 
            continue;

        if (liveVehicles.has(records[i][fileColumns.vehID])) {
            liveVehicles.get(records[i][fileColumns.vehID]).addTrip(new Trip({liveRecord: records[i]}));
        }
    }
}

//this function limits the amount of vehicle updates /w throttle timer
async function updateLiveVehiclesFromJSON(records, fileColumns) {
    // let throttleCap = (records.length > 10) ? Math.ceil(records.length / 4) : records.length;
    // let throttleCount = 0;

    for (let i = 0; i < records.length; i++) {
    //     ++throttleCount;
    //     if(throttleCount == throttleCap) {
    //         throttleCount = 0;
    //         await timer(3000);
    //     }
        if (liveVehicles.has(records[i][fileColumns.vehID]))
            liveVehicles.get(records[i][fileColumns.vehID]).updateMarker({ lat: records[i][fileColumns.vehLat], lng: records[i][fileColumns.vehLng] });
        else
            createLiveVehicle(records[i][fileColumns.vehID], 10, 0, { lat: records[i][fileColumns.vehLat], lng: records[i][fileColumns.vehLng] });
    }
}

function getFixedStopsFromJSON(records, fileColumns) {
    vehicles.forEach(vehicle => {
        let uniqueStops = [];

        records.forEach(record => {
            if (record[fileColumns.vehNumIndex] == vehicle.name)
                if (record[fileColumns.splTrpIndex] == 1)
                    if (!uniqueStops.includes(record[fileColumns.nameIndex])) {
                        uniqueStops.push(record[fileColumns.nameIndex]);

                        //arbitrary speed / idle / wait as the SIM should not do any geo-location loop-ups to determine fixed-stop loops (cannot be determined from ERSA routing). 
                        vehicle.stops.push(new Trip(record[fileColumns.nameIndex], TRIP_TYPE.fixedstop, { lat: record[fileColumns.latIndex], lng: record[fileColumns.longIndex] },
                            { lat: 0.0, lng: 0.0 }, record[fileColumns.adrIndex], 'N/A', 5.4, 12, 0, record[fileColumns.passengerIndex], record[fileColumns.estDistanceIndex]));
                    }
        });

        if (vehicle.stops.length == 1) {
            vehicle.stops = [];
            return;
        }

        for (var i = 0; i < vehicle.stops.length; i++) {
            if (i == (vehicle.stops.length - 1)) {
                vehicle.stops[vehicle.stops.length - 1].DOcoords = vehicle.stops[0].PUcoords;
                vehicle.stops[vehicle.stops.length - 1].DOadr = vehicle.stops[0].PUadr;
            }
            else {
                vehicle.stops[i].DOcoords = vehicle.stops[i + 1].PUcoords;
                vehicle.stops[i].DOadr = vehicle.stops[i + 1].PUadr;
            }
        }
    });
}

function getQueueFromJSON(records, fileColumns) {
    vehicles.forEach(vehicle => {
        let vehFound = false;
        let lastStop;

        for (var i = 0; i < records.length - 1; i++) {
            let next = i + 1;

            if (records[i][fileColumns.vehNumIndex] == vehicle.name && records[next][fileColumns.vehNumIndex] == vehicle.name) {
                vehFound = true;

                if (records[next][fileColumns.typeIndex] == 'IdleTime') {
                    vehicle.queue[vehicle.queue.length - 1].idleTime = records[next][fileColumns.estTimeIndex];
                    next++;
                }

                if (records[i][fileColumns.typeIndex] == 'IdleTime')
                    continue;
                else if (records[next][fileColumns.splTrpIndex] == 1) {
                    if (records[next][fileColumns.nameIndex] != lastStop) {
                        lastStop = records[next][fileColumns.nameIndex];

                        vehicle.queue.push(new Trip(records[next][fileColumns.nameIndex], TRIP_TYPE.fixedstop, { lat: records[i][fileColumns.latIndex], lng: records[i][fileColumns.longIndex] },
                            { lat: records[next][fileColumns.latIndex], lng: records[next][fileColumns.longIndex] }, records[i][fileColumns.adrIndex], records[next][fileColumns.adrIndex],
                            records[next][fileColumns.estTimeIndex], 0, 0, records[next][fileColumns.passengerIndex], records[next][fileColumns.estDistanceIndex]));
                    }
                    else {
                        lastStop = undefined;
                        continue;
                    }
                }
                else {
                    let tName = (getTripType(records[next], fileColumns) == TRIP_TYPE.depot) ? 'End Depot' : records[next][fileColumns.nameIndex];

                    vehicle.queue.push(new Trip(tName, getTripType(records[next], fileColumns), { lat: records[i][fileColumns.latIndex], lng: records[i][fileColumns.longIndex] },
                        { lat: records[next][fileColumns.latIndex], lng: records[next][fileColumns.longIndex] }, records[i][fileColumns.adrIndex], records[next][fileColumns.adrIndex],
                        records[next][fileColumns.estTimeIndex], 0, calcWaitTime(records[next], fileColumns), records[next][fileColumns.passengerIndex], records[next][fileColumns.estDistanceIndex]));
                }
            }
            else if (records[next][fileColumns.vehNumIndex] != vehicle.name && vehFound)
                break;
        }
    });
}

export { findColIndex, getMapCenter, fullParse, parseTime, trimStreetNames, findVehicleIndex, getClockStartTime, 
    getLiveVehiclesFromJSON, updateLiveVehiclesFromJSON, getZonesFromJSON, getLiveTripsFromJSON }