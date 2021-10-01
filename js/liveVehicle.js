import { colors, defaultZonePath } from './constants.js';
import { map } from './map.js';

class LiveVehicle {
    constructor(name = 'N/A', maxCapacity = 0, color = colors[colors.length - 1], startTime = 0, stops = [], queue = [], zone=null) {
        this.name = name;
        this.maxCapacity = maxCapacity;
        this.startTime = startTime;
        this.color = color;
        this.stops = stops;
        this.queue = queue;
        this.zone = zone;

        this.symbol;
        this.infoBox;

        this.infoContent = '<div class="zone-info"><b>Vehicle: ' + this.name + '</b>' +
            '<div class="divider"></div>' +
            '<p>Performing Trip: ' + 'N/A' + '</p>' +
            '<p>On time: ' + '<span class="green-text">Yes (+0min)</span>' + '</p>' +
            '<div class="divider"></div>' +
            '<p>Load: ' + '0/0' + '</p>' +
            '<p>Trips Completed: ' + '0' + '</p>' +
            '<p>Trips Remaining: ' + '0' + '</p></div>';

        this.createLiveVehicle();
    }

    createLiveVehicle() {
        this.symbol = new google.maps.Marker({
            position: map.getCenter(),
            zIndex: 1000,
            icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                strokeColor: this.color.hex,
                fillColor: this.color.hex,
                scale: 3.5,
                strokeWeight: 8,
                strokeOpacity: 1,
                anchor: new google.maps.Point(0, 0),
                labelOrigin: new google.maps.Point(0, 0),
                fixedRotation: false
            },
            label: {
                text: this.name,
                color: '#ffffff',
                zIndex: -1,
                className: 'live-vehicle-label'
            },
            map: map
        });

        this.infoBox = new google.maps.InfoWindow({
            content: this.infoContent,
            position: this.symbol.getPosition()
        });

        this.symbol.addListener('click', () => {
            this.infoBox.open(map);
        });

        window.setInterval( () => {
            this.updateMarker(defaultZonePath[Math.floor(Math.random() * 4)]);
        }, 5000);
        this.updateMarker();
    }

    updateMarker(coords=map.getCenter()) {
        let tempIcon = this.symbol.getIcon();

        tempIcon.rotation = this.calcRotation(
            this.symbol.getPosition(), 
            new google.maps.LatLng(coords.lat, coords.lng)
            );
        this.symbol.setIcon(tempIcon);

        this.symbol.setPosition(coords);
        this.infoBox.setPosition(coords);
    }

    calcRotation(startPos, endPos) {
        if (startPos && endPos)
            return google.maps.geometry.spherical.computeHeading(startPos, endPos);
    }
}

export { LiveVehicle }