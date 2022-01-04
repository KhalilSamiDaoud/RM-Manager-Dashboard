import {TEST_ID_LETTERS, COLORS, VEHICLE_TYPE, TEST_STOPS} from './constants.js';
import { updateVehicleTripLists } from './liveQueue.js';
import { LiveVehicle } from './liveVehicle.js';
import { Vehicle } from './vehicle.js';
import { Trip } from './trip.js';

var vehicles = [];
var liveVehicles = new Map();

//for testing only 
function populateRandVehicles(fleetSize) {
    let names = [];
    clearVehicles();

    while (names.length < fleetSize) {
        let newName = (Math.floor(Math.random() * 3) + 1) +TEST_ID_LETTERS[Math.floor(Math.random() *TEST_ID_LETTERS.length)];

        if (!names.includes(newName))
            names.push(newName);
    }

    for (var i = 0; i < fleetSize; i++) {
        let capacity = Math.floor(Math.random() * (15 - 8)) + 8;

        vehicles.push(new Vehicle(names[i], capacity, COLORS[i], 5, convertToTrips(TEST_STOPS[i])));
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

function createVehicle(vehID, vehCap, startTime) {
    vehicles.push(new Vehicle(vehID, vehCap, COLORS[vehicles.length], startTime));
}

//get vehicle type eventually
function createLiveVehicle(vehID, vehCap, vehLoad, startPos=null, zone=null, heading=null, color=null) {
    if (liveVehicles.has(vehID)) return;

    liveVehicles.set(vehID, new LiveVehicle(vehID, VEHICLE_TYPE.sedan, vehCap, vehLoad, startPos, zone, heading, color));
}

function clearVehicles() {
    vehicles.forEach( vehicle => {
        vehicle?.clearIntervals();
    });
    vehicles = [];
}

function clearLiveVehicles() {
    liveVehicles.forEach(vehicle => {
        vehicle.destroy();
    });

    liveVehicles.clear();
}

function sortVehicleList() {
    vehicles.sort(vehicleStartTimeCompare);
}

function updateVehicleInformation() {
    updateVehicleTripLists();
    
    liveVehicles.forEach( vehicle => {
        vehicle.updateInfoBox();
        vehicle.updateMarkers();
        vehicle.updateVehiclePath();
    });
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

export { populateRandVehicles, createVehicle, createLiveVehicle, clearVehicles, clearLiveVehicles, 
    sortVehicleList, isAllDepot, updateVehicleInformation, vehicles, liveVehicles };