import { fullParse, getMapCenter, trimStreetNames, getClockStartTime, getLiveVehiclesFromJSON, updateLiveVehiclesFromJSON, getZonesFromJSON, getLiveTripsFromJSON } from './parseInput.js';
import { INIT_MODE, API_COLUMNS_TRIPS, API_COLUMNS_AVL, APIURL, API_FUNCTIONS, INIT_EVENT_TYPE, API_COLUMNS_ZONES, API_COLUMNS_LIVE_TRIPS } from './constants.js';
import { initSimulation, stopSimulation, currMode } from './main.js';
import { initEvent } from './log.js';

var zoneCache, vehicleCache, tripListCache;
let tripListObjTrimed, startTime, newCenter;

let liveVehiclePosInterval;

async function initAPI(date = '12/1/2021') {
    await fetch(APIURL + API_FUNCTIONS.getFutureTrips + date)
        .then(response => response.json())
        .then(data => {
            if (data.triplist.length == 0) {
                initEvent(INIT_EVENT_TYPE.APIempty);
                throw new Error('DASHBOARD-API Initialization Error: No Data');
            }

            tripListObjTrimed = trimStreetNames(data.triplist, API_COLUMNS_TRIPS);
            startTime         = getClockStartTime(tripListObjTrimed, API_COLUMNS_TRIPS);
            newCenter         = getMapCenter(tripListObjTrimed, API_COLUMNS_TRIPS);

            stopSimulation();
            fullParse(tripListObjTrimed, API_COLUMNS);
            initSimulation(INIT_MODE.API, startTime, newCenter); 
        });
}

async function initLive() {
    await fetch(APIURL + API_FUNCTIONS.getZones)
        .then(response => response.json())
        .then(data => {
            if (data.zones.length == 0) {
                initEvent(INIT_EVENT_TYPE.AVLempty);
                throw new Error('DASHBOARD-API Initialization Error: No Zone Data');
            }

            stopSimulation();

            zoneCache = data.zones;
            getZonesFromJSON(data.zones, API_COLUMNS_ZONES);

            fetch(APIURL + API_FUNCTIONS.getAVL)
                .then(response => response.json())
                .then(data => {
                    if (data.avl.length == 0) {
                        initEvent(INIT_EVENT_TYPE.AVLempty);
                        throw new Error('DASHBOARD-API Initialization Error: No Vehicle Data');
                    }

                    vehicleCache = data.avl;
                    getLiveVehiclesFromJSON(data.avl, API_COLUMNS_AVL);

                    fetch(APIURL + API_FUNCTIONS.getTodayTrips)
                        .then(response => response.json())
                        .then(data => {
                            if (data.triplist.length == 0) {
                                initEvent(INIT_EVENT_TYPE.APIempty);
                                throw new Error('DASHBOARD-API Initialization Error: No Trip Data');
                            }

                            tripListCache = trimStreetNames(data.triplist, API_COLUMNS_LIVE_TRIPS);
                            
                            getLiveTripsFromJSON(tripListCache, API_COLUMNS_LIVE_TRIPS);
                            initSimulation(INIT_MODE.live);
                            autoUpdateVehiclePositions();
                        });
                });
        });
}

function autoUpdateVehiclePositions() {
    if (liveVehiclePosInterval) return;

    liveVehiclePosInterval = setInterval(async () => {
        if(currMode != INIT_MODE.live) {
            vehiclePosInterval = clearInterval(liveVehiclePosInterval);
            return;
        }

        await fetch(APIURL + API_FUNCTIONS.getAVL)
            .then(response => response.json())
            .then(data => {
                if (data.avl.length == 0) {
                    console.warn('No trip data received on update.');
                    return;
                }

                vehicleCache = data.avl;
                updateLiveVehiclesFromJSON(data.avl, API_COLUMNS_AVL);
            });
    }, 30000);
}

export { initAPI, initLive };