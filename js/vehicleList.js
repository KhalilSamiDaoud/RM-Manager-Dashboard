import { vehicleIDletter, initCoords, colors, fixedStopLoopsDC} from './constants.js';
import { mapCenter } from './map.js';
import { Vehicle } from './vehicle.js';
import { Trip } from './trip.js';

var vehicles = [];

//for testing only 
function populateRandVehicles(fleetSize) {
    let names = [];
    clearVehicles();

    while (names.length < fleetSize) {
        let newName = (Math.floor(Math.random() * 3) + 1) + vehicleIDletter[Math.floor(Math.random() * vehicleIDletter.length)];

        if (!names.includes(newName))
            names.push(newName);
    }

    for (var i = 0; i < fleetSize; i++) {

        let capacity = Math.floor(Math.random() * (15 - 8)) + 8;
        let veh;

        if (JSON.stringify(mapCenter) == JSON.stringify(initCoords[0]))
            veh = new Vehicle(names[i], capacity, colors[i], 5, convertToTrips(fixedStopLoopsDC[i]));
        else
            veh = new Vehicle(names[i], capacity, colors[i], 10, convertToTrips(fixedStopLoopLA[i]));

        vehicles.push(veh);
    }
}

//for testing only 
function convertToTrips(jsonList) {
    let tripList = [];

    if (jsonList != undefined) {
        jsonList.forEach(entry => {
            tripList.push(new Trip(entry.name, entry.type, entry.PUcoords, entry.DOcoords, entry.PUadr, entry.DOadr, entry.speed, entry.idleTime));
        });
    }

    return tripList
}

function createVehicle(VehID, VehCap, startTime) {
    let veh = new Vehicle(VehID, VehCap, colors[vehicles.length], startTime);
    vehicles.push(veh);
}

function clearVehicles() {
    vehicles.forEach( vehicle => {
        vehicle.clearIntervals();
    });
    vehicles = [];
}

function sortVehicleList() {
    vehicles.sort(vehicleStartTimeCompare);
}

function vehicleStartTimeCompare(a, b) {
    if (a.startTime < b.startTime)
        return -1;
    else if (a.startTime > b.startTime)
        return 1;
    else
        return 0;
}

function isAllDepot() {
    for (let i=0; i < vehicles.length; i++) {
        if(!vehicles[i].hasFinished())
            return false;
    }
    return true;
}

export { populateRandVehicles, createVehicle, clearVehicles, sortVehicleList, isAllDepot, vehicles };