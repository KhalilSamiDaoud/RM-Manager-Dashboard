import { TRIP_TYPE, API_COLUMNS_TRIPS, API_COLUMNS_LIVE_TRIPS } from "./constants.js";

// /!\ PASS JSON PARAMETERS TO THIS OBJECT /!\
// define {liveRecord: [...arr], ...} for quick build from API input
// define {simRecord: [...arr], ...} for quick build from API input
class Trip {
    constructor(params = null) {
        if (!params) this._throw('Invalid JSON parameter list.');

        if(params?.liveRecord) {
            this.constructLiveTrip(params.liveRecord);
            return;
        }

        if (params?.simRecord) {
            this.constructSimTrip(params.simRecord);
            return;
        }

        this.vehicle = (params?.vehicle) ? params.vehicle : 'N/A';
        this.name = (params?.name) ? params.name : 'N/A';
        this.type = (params?.type) ? params.type : TRIP_TYPE.generic;
        this.PUcoords = (params?.PUcoords) ? params.PUcoords : { lat: 0.0, lng: 0.0 };
        this.DOcoords = (params?.DOcoords) ? params.DOcoords : { lat: 0.0, lng: 0.0 };
        this.PUadr = (params?.PUadr) ? params.PUadr : 'N/A';
        this.DOadr = (params?.DOadr) ? params.DOadr : 'N/A';
        this.phoneNum = (params?.phoneNum) ? params.phoneNum : 'N/A';
        this.travelTime = (params?.travelTime) ? params.travelTime : 0;
        this.idleTime = (params?.idleTime) ? params.travelTime : 0;
        this.waitTime = (params?.waitTime) ? params.waitTime : 0;
        this.passengers = (params?.passengers) ? params.passengers : 0;
        this.distance = (params?.distance) ? params.distance : 0;
        this.schTime = (params?.schTime) ? params.schTime : 0;
        this.confirmation = (params?.confirmation) ? params.confirmation : 0;
    }

    constructLiveTrip(trip) {
        try {
            this.type = TRIP_TYPE.generic;

            this.PUcoords = {
                lat: trip[API_COLUMNS_LIVE_TRIPS.PUlat],
                lng: trip[API_COLUMNS_LIVE_TRIPS.PUlng]
            };

            this.DOcoords = {
                lat: trip[API_COLUMNS_LIVE_TRIPS.DOlat],
                lng: trip[API_COLUMNS_LIVE_TRIPS.DOlng]
            };

            this.vehicle = trip[API_COLUMNS_LIVE_TRIPS.vehNum];
            this.name = trip[API_COLUMNS_LIVE_TRIPS.name];
            this.PUadr = trip[API_COLUMNS_LIVE_TRIPS.PUadr];
            this.DOadr = trip[API_COLUMNS_LIVE_TRIPS.DOadr];
            this.phoneNum = trip[API_COLUMNS_LIVE_TRIPS.phoneNum];
            this.travelTime = trip[API_COLUMNS_LIVE_TRIPS.estTime];
            this.passengers = trip[API_COLUMNS_LIVE_TRIPS.passengers];
            this.distance = trip[API_COLUMNS_LIVE_TRIPS.estDistance];
            this.schTime = trip[API_COLUMNS_LIVE_TRIPS.scheduleTime];
            this.confirmation = trip[API_COLUMNS_LIVE_TRIPS.confirmationNum];
        }
        catch(err) {
            this._throw('Invalid Live record: ' + err);
        }
    }

    constructSimTrip(trip) {

    }

    _throw(err) { throw new Error(err); }
}

export { Trip };