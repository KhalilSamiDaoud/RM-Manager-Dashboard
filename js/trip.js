import { TRIP_TYPE, API_COLUMNS_LIVE_TRIPS } from "./constants.js";

// /!\ PASS JSON PARAMETERS TO THIS OBJECT /!\
// define {liveRecord: [...arr], ...} for quick build from API input
// define {simRecord: [...arr], ...} for quick build from API input
class Trip {
    constructor(params = null) {
        if (!params) this.#_throw('Invalid JSON parameter list.');

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
        this.schTime = (params?.schTime) ? new Date(params.schTime) : '';
        this.confirmation = (params?.confirmation) ? params.confirmation : 0;
    }

    constructLiveTrip(trip) {
        try {
            this.PUcoords = {
                lat: trip[API_COLUMNS_LIVE_TRIPS.PUlat],
                lng: trip[API_COLUMNS_LIVE_TRIPS.PUlng]
            };

            this.DOcoords = {
                lat: trip[API_COLUMNS_LIVE_TRIPS.DOlat],
                lng: trip[API_COLUMNS_LIVE_TRIPS.DOlng]
            };

            this.vehicle = trip[API_COLUMNS_LIVE_TRIPS.vehID];
            this.name = trip[API_COLUMNS_LIVE_TRIPS.name];
            this.PUadr = trip[API_COLUMNS_LIVE_TRIPS.PUadr];
            this.DOadr = trip[API_COLUMNS_LIVE_TRIPS.DOadr];
            this.phoneNum = trip[API_COLUMNS_LIVE_TRIPS.phoneNum];
            this.travelTime = trip[API_COLUMNS_LIVE_TRIPS.estTime];
            this.passengers = trip[API_COLUMNS_LIVE_TRIPS.passengers];
            this.wheelChairs = trip[API_COLUMNS_LIVE_TRIPS.wheelchairs];
            this.distance = trip[API_COLUMNS_LIVE_TRIPS.estDistance];
            this.confirmation = trip[API_COLUMNS_LIVE_TRIPS.confirmationNum];
            this.status = trip[API_COLUMNS_LIVE_TRIPS.status];
            this.timeStatus = trip[API_COLUMNS_LIVE_TRIPS.timeStatus];

            this.requestDateTime = new Date(trip[API_COLUMNS_LIVE_TRIPS.PUdate].replace('GMT', 'EST'));
            this.requestedTime = this.requestDateTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            this.appointmentDateime = (trip[API_COLUMNS_LIVE_TRIPS.DOapptTime]) ? new Date(trip[API_COLUMNS_LIVE_TRIPS.PUdate].replace('GMT', 'EST')) : null;
            this.appointmentTime = (this.appointmentDateime) ? this.appointmentDateime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            }) : 'N/A';

            this.schPUDateTime = new Date(trip[API_COLUMNS_LIVE_TRIPS.scheduledPUTime].replace('GMT', 'EST'));
            this.schPUTime = this.schPUDateTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit'
            });

            this.forcastedPUDateTime = new Date(trip[API_COLUMNS_LIVE_TRIPS.forcastedPUTime].replace('GMT', 'EST'));
            this.forcastedPUTime = this.forcastedPUDateTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            this.schDODateTime = new Date(trip[API_COLUMNS_LIVE_TRIPS.scheduledDOTime].replace('GMT', 'EST'));
            this.schDOTime = this.schDODateTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit'
            });

            this.forcastedDODateTime = new Date(trip[API_COLUMNS_LIVE_TRIPS.forcastedDOTime].replace('GMT', 'EST'));
            this.forcastedDOTime = this.forcastedDODateTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            this.active = this.#determineActive(this.status);
        }
        catch(err) {
            this.#_throw('Invalid Live record: ' + err);
        }
    }

    constructSimTrip(trip) {
        //fill
    }

    #determineActive(status) {
        switch (status) {
            case ('BIDOFFERED'):
            case ('ACCEPTED'):
            case ('ASSIGNED'):
            case ('IRTPU'):
            case ('PICKEDUP'):
                return true;
            case ('ATLOCATION'):
            case ('CANCELLED'):
            case ('NOSHOWREQ'):
            case ('NOSHOW'):
            case ('NONE'):
            default:
                return false;
        }
    }

    #_throw(err) { throw new Error(err); }
}

export { Trip };