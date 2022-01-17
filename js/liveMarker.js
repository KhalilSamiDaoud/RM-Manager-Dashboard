import { dropoffSVG, pickupSVG, } from './constants.js';
import { Trip } from './trip.js';
import { map } from './map.js';

class LiveMarker {
    constructor(trip, ownerVehicle) {
        if (!(trip instanceof Trip)) this.#_throw('No Trip Specified.');

        this.trip = trip;

        this.name = trip.name;
        this.PUcoords = trip.PUcoords;
        this.DOcoords = trip.DOcoords;
        this.PUtime = trip.schPUDateTime;
        this.DOtime = trip.schDODateTime;
        this.id = trip.confirmation;

        this.ownerVehicle = ownerVehicle;
        this.drawPU = (trip.status != 'PICKEDUP');

        this.PUsymbol;
        this.DOsymbol;

        this.infoContent =
            '<div class="zone-info"><b>' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Vehicle: #' + this.ownerVehicle.name + ' (' + this.ownerVehicle.type.name + ')</p>' +
            '<p>PU Adr: ' + this.trip.PUadr + '</p>' +
            '<p>DO Adr: ' + this.trip.PUadr + '</p>' +
            '<div class="divider"></div>' +
            '<p>ETA: --- </p>' +
            '</div>';

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
                    text: this.name + ' [' + this.PUtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ']',
                    color: '#fff',
                    className: 'pickup-label'
                }
            });

            this.PUsymbol.addListener('click', this.handleMarkerClick.bind(this));
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
                    text: this.name + ' [' + this.DOtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ']',
                    color: '#ffffff',
                    className: 'dropoff-label',
                }
            });

            this.DOsymbol.addListener('click', this.#handleMarkerClick.bind(this));
        }

        this.infoBox = new google.maps.InfoWindow({
            content: this.infoContent,
            position: (this.drawPU) ? this.PUsymbol.getPosition() : this.DOsymbol.getPosition(),
            pixelOffset: new google.maps.Size(0, -25)
        });
    }

    #handleMarkerClick() {
        this.ownerVehicle.focusTripMarker(this.id);
    }

    destroy() {
        if (this.DOsymbol)
            this.DOsymbol.setMap(null);

        if (this.PUsymbol)
            this.PUsymbol.setMap(null);
    }

    updateToPickedUp() {
        if (this.PUsymbol) {
            this.PUsymbol.setMap(null);
            this.PUsymbol = null;
            this.drawPU = false;
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

    showMarkers() {
        this.showPUMarker();
        this.showDOMarker();
    }

    hideMarkers() {
        this.hidePUMarker();
        this.hideDOMarker();

        if (this.infoBox.getMap())
            this.infoBox.close();
    }

    #_throw(err) { throw new Error(err); }
}

export { LiveMarker }