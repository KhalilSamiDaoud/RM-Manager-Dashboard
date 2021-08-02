import { assignNewQueue, updateTripTab, progressBar, setCurrTripIdle, clearCurrTrip } from './tripQueue.js';
import { drawTripPath, drawNextNIcons, drawNextIcon, map } from './map.js';
import { vehStatus, tripType, colors } from './constants.js';
import { simSpeedFactor, clockCurrTime } from './clock.js';
import { calcAll } from './statisticsList.js';
import { drawMaterial } from './chart.js';
import { vehicleEvent } from './log.js';

class Vehicle {
    constructor(name = 'N/A', maxCapacity = 0, color = colors[colors.length - 1], startTime = 0, stops = [], queue = []) {
        this.name = name;
        this.maxCapacity = maxCapacity;
        this.startTime = startTime;
        this.color = color;
        this.stops = stops;
        this.queue = queue;

        this.status = vehStatus.depot;
        this.idling = false;
        this.pos = 0;
        this.offset = '0%';
        this.MTpassengers = 0;
        this.FSpassengers = 0;
        this.markers = [];
        this.drawnTo;
        this.symbol;
        this.path;

        this.mapInterval = undefined;
        this.progInterval = undefined;
        this.dispatcher = undefined;
    }

    updateStatus() {
        if (this.stops.length == 0 && this.queue.length == 0)
            this.status = vehStatus.depot;
        else
            this.status = vehStatus.route;

        updateTripTab(this);
    }

    updateQueue(newQueue = this.queue) {
        this.queue = newQueue;

        if (this.queue.length == 0) {
            this.queue = this.stops;
            assignNewQueue(this);
        }
        else
            assignNewQueue(this);
    }

    updatePassengers(trip) {
        switch (trip.type) {
            case tripType.fixedstop:
                this.addRandPassengers();
                this.removeRandPassengers();
                break;
            case tripType.pickup:
                this.MTpassengers += trip.passengers;
                break;
            case tripType.dropoff:
                this.MTpassengers -= trip.passengers;
                break;
            default:
                break;
        }
    }

    totalPassengers() {
        return this.FSpassengers + this.MTpassengers;
    }

    addRandPassengers() {
        if (this.totalPassengers() < (this.maxCapacity * .7))
            this.FSpassengers += (Math.floor(Math.random() * (this.maxCapacity * .3)) + 2);
        else
            this.FSpassengers += (Math.floor(Math.random() * (this.maxCapacity * .1)));
    }

    removeRandPassengers() {
        if (this.totalPassengers() > (this.maxCapacity * .7))
            this.FSpassengers -= (Math.floor(Math.random() * (this.maxCapacity * .3)) + 2);
        else
            this.FSpassengers -= (Math.floor(Math.random() * (this.maxCapacity * .1)));
    }

    getFixedStopCoordList() {
        let routeCoords = []

        if (this.stops.length != 0) {
            this.stops.forEach(stop => {
                routeCoords.push(stop.PUcoords);
            });

            routeCoords.push(this.stops[0].PUcoords);
        }

        return routeCoords;
    }

    clearPath() {
        if (typeof this.path !== 'undefined')
            this.path.setMap(null);
    }

    tripIsDepot(index) {
        return this.queue[index].type == tripType.depot;
    }

    tripIsFixedStop(index) {
        return this.queue[index].type == tripType.fixedstop;
    }

    tripIsPickup(index) {
        return this.queue[index].type == tripType.pickup;
    }

    tripIsDropoff(index) {
        return this.queue[index].type == tripType.dropoff;
    }

    animate() {
        drawTripPath(this);
        this.path.setMap(map);

        if (this.markers.length == 0)
            drawNextNIcons(this, 3);

        let count = (parseFloat(this.offset) * this.queue[this.pos].speed) * simSpeedFactor;
        progressBar(this);

        this.mapInterval = window.setInterval(() => {
            count = (++count);
            let offset = count / (this.queue[this.pos].speed * simSpeedFactor);
            let icons = this.path.get("icons");

            icons[1].offset = (offset > 99) ? '100%' : offset + '%';
            this.path.set("icons", icons);
            this.offset = icons[1].offset;

            if (offset > 99) {
                this.mapInterval = window.clearInterval(this.mapInterval);

                drawNextIcon(this, 3);

                if (this.queue[this.pos].idleTime != 0 && !this.idling) {
                    setCurrTripIdle(this);
                    this.idling = true;
                }

                if (typeof this.mapInterval === 'undefined') {
                    this.mapInterval = setTimeout(() => {
                        this.mapInterval = window.clearInterval(this.mapInterval);
                        this.offset = '0%';
                        this.clearPath();
                        this.idling = false;

                        clearCurrTrip(this);

                        this.updatePassengers(this.queue[this.pos]);
                        //!event
                        vehicleEvent(this, this.pos);

                        if (this.tripIsPickup(this.pos))
                            calcAll(this.queue[this.pos]);

                        drawMaterial();

                        if (this.pos == (this.queue.length - 1) && this.stops.length != 0) {
                            this.updateQueue([]);
                            this.updateStatus();
                            this.pos = 0;

                            this.animate();
                        }
                        else if (this.pos == (this.queue.length - 1) && this.stops.length == 0) {
                            this.updateQueue([]);
                            this.updateStatus();
                            this.progInterval = window.clearInterval(this.progInterval);
                        }
                        else {
                            ++this.pos;
                            this.animate();
                        }
                    }, 1000 * (simSpeedFactor * this.queue[this.pos].idleTime));
                }
            }
        }, 10);
    }

    autoDispatch() {
        if (typeof this.dispatcher === 'undefined') {
            this.dispatcher = window.setInterval(() => {
                if (this.queue.length != 0 && this.startTime <= (clockCurrTime + 1) && this.status == vehStatus.depot) {
                    this.dispatcher = window.clearInterval(this.dispatcher);
                    this.updateStatus();
                    this.animate();
                    progressBar(this);
                }
            }, (1000 * simSpeedFactor));
        }
    }

    forceDispatch() {
        if (this.status != vehStatus.depot) {
            this.animate();
            progressBar(this);
        }
    }

    stopDispatch() {
        this.dispatcher = undefined;
    }

    clearIntervals() {
        this.mapInterval = window.clearInterval(this.mapInterval);
        this.progInterval = window.clearInterval(this.progInterval);
        this.dispatcher = window.clearInterval(this.dispatcher);
    }
}

export { Vehicle };