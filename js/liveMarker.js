import { dropoffSVG, pickupSVG } from './constants.js';
import { Trip } from './trip.js';
import { map } from './map.js';

class LiveMarker {
    constructor(trip, ownerVehicle, ownerList = null) {
        if (!(trip instanceof Trip)) this.#_throw('No Trip Specified.');

        this.trip = trip;
        this.ownerVehicle = ownerVehicle;
        this.ownerList = ownerList;

        this.name = trip.name;
        this.PUcoords = trip.PUcoords;
        this.DOcoords = trip.DOcoords;
        this.PUtime = trip.forcastedPUTime;
        this.DOtime = trip.forcastedDOTime;
        this.id = trip.confirmation;

        this.drawPU = (trip.status != 'PICKEDUP');
        this.eventManager = new AbortController();

        this.PUsymbol;
        this.DOsymbol;

        this.infoContent =
            '<div class="zone-info"><b>' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Vehicle: #' + this.ownerVehicle.name + ' (' + this.ownerVehicle.type.name + ')</p>' +
            '<p>PU Adr: ' + this.trip.PUadr + '</p>' +
            '<p>DO Adr: ' + this.trip.DOadr + '</p>' +
            '<div class="divider"></div>' +
            '<p>PU ETA: ' + this.trip.forcastedPUTime + '</p>' +
            '<p>DO ETA: ' + this.trip.forcastedDOTime + '</p>' +
            '</div>';

        this.path = new google.maps.Polyline({
            path: (this.drawPU) ? [this.PUcoords, this.DOcoords] : [this.ownerVehicle.currPos, this.DOcoords],
            strokeOpacity: 1,
            scale: 2
        });

        this.createPersonMarkers();
    }

    createPersonMarkers() {
        if (this.PUcoords && this.drawPU) {
            this.PUsymbol = new google.maps.Marker({
                position: this.PUcoords,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' +
                        encodeURIComponent(pickupSVG.replace('{{ color }}', '#66bb6a')),
                    scaledSize: new google.maps.Size(25, 25),
                    labelOrigin: new google.maps.Point(15, 0),
                    fixedRotation: false,
                },
                label: {
                    text: this.name + ' [' + this.PUtime + ']',
                    color: '#fff',
                    className: 'pickup-label'
                }
            });

            this.PUsymbol.addListener('click', this.#handleMarkerClick.bind(this), { signal: this.eventManager.signal });
        }

        if (this.DOcoords) {
            this.DOsymbol = new google.maps.Marker({
                position: this.DOcoords,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' +
                        encodeURIComponent(dropoffSVG.replace('{{ color }}', '#1e88e5')),
                    scaledSize: new google.maps.Size(25, 25),
                    labelOrigin: new google.maps.Point(15, 0),
                    fixedRotation: false
                },
                label: {
                    text: this.name + ' [' + this.DOtime + ']',
                    color: '#ffffff',
                    className: 'dropoff-label',
                }
            });

            this.DOsymbol.addListener('click', this.#handleMarkerClick.bind(this), { signal: this.eventManager.signal });
        }

        this.infoBox = new google.maps.InfoWindow({
            content: this.infoContent,
            position: (this.drawPU) ? this.PUsymbol.getPosition() : this.DOsymbol.getPosition(),
            pixelOffset: new google.maps.Size(0, -25)
        });
    }

    #handleMarkerClick() {
        if(!this.ownerList)
            this.ownerVehicle.focusTripMarker(this.id);
        else
            this.ownerList.focusTripMarker(this.id);

        this.infoBox.open(map);
    }

    destroy() {
        if (this.DOsymbol)
            this.DOsymbol.setMap(null);

        if (this.PUsymbol)
            this.PUsymbol.setMap(null);

        if (this.path)
            this.path.setMap(null);

        this.eventManager.abort();
    }

    updateToPickedUp() {
        if (this.PUsymbol) {
            this.PUsymbol.setMap(null);
            this.PUsymbol = null;
            this.drawPU = false;
        }
        if (this.path) {
            this.path.setMap(null);
            this.path = null;
        }
    }

    showPUMarker() {
        if (this.PUsymbol)
            this.PUsymbol.setMap(map);
    }

    hidePUMarker() {
        if (this.PUsymbol)
            this.PUsymbol.setMap(null);
    }

    showDOMarker() {
        if (this.DOsymbol)
            this.DOsymbol.setMap(map);
    }

    hideDOMarker() {
        if (this.DOsymbol)
            this.DOsymbol.setMap(null);
    }

    showPath() {
        if(this.path)
            this.path.setMap(map);
    }

    hidePath() {
        if(this.path)
            this.path.setMap(null);
    }

    hideInfoBox() {
        this.infoBox.close();
    }

    showMarkers() {
        this.showPUMarker();
        this.showDOMarker();

        if (this.ownerVehicle.isFocusingMarker && !this.ownerList)
            if (this.ownerVehicle.focusedMarker.trip.confirmation === this.trip.confirmation)
                this.path.setMap(map);
    }

    hideMarkers() {
        this.hidePUMarker();
        this.hideDOMarker();

        if (this.infoBox.getMap())
            this.infoBox.close();
        
        if (this.path)
            this.path.setMap(null);
    }

    setOpaque() {
        if (this.PUsymbol) {
            this.PUsymbol.setOpacity(0.4);
            this.PUsymbol.setZIndex(0);
        }
        if (this.DOsymbol) {
            this.DOsymbol.setOpacity(0.4);
            this.DOsymbol.setZIndex(0);
        }
        if (this.infoBox.getMap())
            this.infoBox.close();
    }

    setSolid() {
        if (this.PUsymbol) {
            this.PUsymbol.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
            this.PUsymbol.setOpacity(1);
        }
        if (this.DOsymbol) {
            this.DOsymbol.setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
            this.DOsymbol.setOpacity(1);
        }
    }

    #_throw(err) { throw new Error(err); }
}

export { LiveMarker }