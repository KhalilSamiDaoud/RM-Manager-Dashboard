import { vehicles, liveVehicles, createVehicle, createLiveVehicle, clearVehicles, sortVehicleList, updateVehicleInformation, sortLiveVehicleTrips } from './vehicleList.js';
import { updateLiveQueueEntries } from './liveQueue.js';
import { TRIP_TYPE, VEHICLE_TYPE } from './constants.js';
import { calcWaitTime } from './simMath.js';
import { createZone } from './zoneList.js';
import { addAPIEvent } from './liveLog.js';
import { parseTime } from './utils.js';
import { Trip } from './trip.js';

const CURR_DATE = new Date();
const CURR_DATE_STRING = new Date().toLocaleDateString();

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
    let tempParams;

    records.forEach(record => {
        tempParams = {
            id: record[fileColumns.vehID],
            name: record[fileColumns.vehName],
            maxCapacity: record[fileColumns.vehCapacity],
            currCapacity: record[fileColumns.vehLoad],
            zoneID: record[fileColumns.vehZone],
            heading: record[fileColumns.vehHeading],
            color: record[fileColumns.vehColor],
            type: VEHICLE_TYPE.sedan,
            currPos: { 
                lat: record[fileColumns.vehLat], 
                lng: record[fileColumns.vehLng] 
            }
        };

        createLiveVehicle(tempParams);
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

        if (liveVehicles.has(records[i][fileColumns.vehID]))
            if (new Date(records[i][fileColumns.scheduledPUTime]).toLocaleDateString() === CURR_DATE_STRING)
                liveVehicles.get(records[i][fileColumns.vehID]).addTrip(new Trip({liveRecord: records[i]}));
    }

    sortLiveVehicleTrips();
}

function getLiveAlertsFromJSON(records, fileColumns) {
    records.forEach(record => {
        addAPIEvent(record[fileColumns.message], record[fileColumns.details], record[fileColumns.dateTime], record[fileColumns.affiliateID], null, null);
    });
}

function updateLiveTripsFromJSON(records, fileColumns) {
    liveVehicles.forEach(vehicle => {
        vehicle.clearTrips();
    });

    for (let i = 0; i < records.length; i++) {
        if (records[i][fileColumns.vehID] == -1 || records[i][fileColumns.vehID] == 0)
            continue;

        if (liveVehicles.has(records[i][fileColumns.vehID])) {
            if(new Date(records[i][fileColumns.scheduledPUTime]).toLocaleDateString() === CURR_DATE_STRING) {
                liveVehicles.get(records[i][fileColumns.vehID]).addTrip(new Trip({ liveRecord: records[i] }));
            }
        }
    }

    updateVehicleInformation();
}

async function updateLiveVehiclesFromJSON(records, fileColumns) {
    let vehicleRef;
    let tempParams;

    for (let i = 0; i < records.length; i++) {
        if (liveVehicles.has(records[i][fileColumns.vehID])) {
            vehicleRef = liveVehicles.get(records[i][fileColumns.vehID]);
            vehicleRef.updateLoad(records[i][fileColumns.vehLoad]);
            vehicleRef.updateMarker(
                { lat: records[i][fileColumns.vehLat], lng: records[i][fileColumns.vehLng] }, 
                records[i][fileColumns.vehHeading]
            );
        }
        else {
            tempParams = {
                id: records[i][fileColumns.vehID],
                name: records[i][fileColumns.vehName],
                maxCapacity: records[i][fileColumns.vehCapacity],
                currCapacity: records[i][fileColumns.vehLoad],
                zoneID: records[i][fileColumns.vehZone],
                heading: records[i][fileColumns.vehHeading],
                color: records[i][fileColumns.vehColor],
                type: VEHICLE_TYPE.sedan,
                currPos: {
                    lat: records[i][fileColumns.vehLat],
                    lng: records[i][fileColumns.vehLng]
                }
            };

            createLiveVehicle(tempParams);
            updateLiveQueueEntries(liveVehicles.get(tempParams.id));
        }
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

export {
    findColIndex, getMapCenter, fullParse, parseTime, trimStreetNames, findVehicleIndex, getClockStartTime, getLiveAlertsFromJSON,
    getLiveVehiclesFromJSON, updateLiveVehiclesFromJSON, getZonesFromJSON, getLiveTripsFromJSON, updateLiveTripsFromJSON }