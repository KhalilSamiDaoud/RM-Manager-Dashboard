import { calcVehiclePassengersServed, calcVehicleIdle, calcVehicleMileage, calcVehicleRevenue } from './simMath.js';
import { assignNewQueue, updateTripTab, progressBar, setCurrTripIdle, clearCurrTrip } from './tripQueue.js';
import { updateGeneralStats, updateVehicleStats } from './statisticsList.js';
import { drawTripPath, drawNextNIcons, drawNextIcon, map } from './map.js';
import { vehStatus, tripType, colors } from './constants.js';
import { simSpeedFactor, clockCurrTime } from './clock.js';
import { drawMaterial } from './barChart.js';
import { vehicleEvent } from './log.js';

class Vehicle {
    constructor(name = 'N/A', maxCapacity = 0, color = colors[colors.length - 1], startTime = 0, stops = [], queue = []) {
        this.name = name;
        this.maxCapacity = maxCapacity;
        this.startTime = startTime;
        this.color = color;
        this.stops = stops;
        this.queue = queue;

        this.status = vehStatus.starting;
        this.idling = false;
        this.pos = 0;
        this.mapOffset = 0;
        this.idleOffset = 0;
        this.MTpassengers = 0;
        this.FSpassengers = 0;
        this.markers = [];
        this.drawnTo;
        this.symbol;
        this.path;

        this.mapInterval = undefined;
        this.dispatcher = undefined;

        //vehicle stats 
        this.stats = {
            served: 0,
            idleTime: 0,
            mileage: 0,
            revenue: 0
        };

        this.formattedStats = {
            served: this.stats.served,
            idleTime: '0 min',
            mileage: '0 mi',
            revenue: '$ 0'
        }
    }

    updateStatus() {
        if (this.stops.length == 0 && this.queue.length == 0)
            this.status = vehStatus.depot;
        else if (this.queue.length <= this.stops.length)
            this.status = vehStatus.loop;
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

        let count = (this.mapOffset * this.queue[this.pos].speed) * simSpeedFactor;
        let icons = this.path.get("icons");

        this.mapInterval = window.setInterval(() => {
            if (!this.idling) {
                count = ++count;
                this.mapOffset = count / (this.queue[this.pos].speed * simSpeedFactor);
                icons[1].offset = (this.mapOffset > 99) ? '100%' : this.mapOffset + '%';
                this.path.set("icons", icons);
                progressBar(this, icons[1].offset);

                if (this.mapOffset > 99) {
                    this.mapInterval = window.clearInterval(this.mapInterval);
                    drawNextIcon(this, 3);

                    if (this.queue[this.pos].idleTime != 0) {
                        setCurrTripIdle(this);
                        this.idling = true;
                    }
                }
            }
            else {
                this.mapInterval = window.clearInterval(this.mapInterval);
            }
            if (typeof this.mapInterval === 'undefined') {
                count = (this.idling) ? (this.idleOffset * this.queue[this.pos].idleTime) * simSpeedFactor : 100;

                this.mapInterval = setInterval(() => {
                    if (this.idleOffset < 100) {
                        count = ++count;
                        this.idleOffset = count / (this.queue[this.pos].idleTime * simSpeedFactor);
                    }
                    else {
                        this.mapInterval = window.clearInterval(this.mapInterval);
                        this.progInterval = window.clearInterval(this.progInterval);
                        this.idling = false;
                        this.mapOffset = 0;
                        this.idleOffset = 0;
                        this.clearPath();

                        clearCurrTrip(this);

                        this.updatePassengers(this.queue[this.pos]);
                        //!event
                        vehicleEvent(this, this.pos);

                        if (this.tripIsPickup(this.pos))
                            updateGeneralStats(this.queue[this.pos]);

                        this.updateStats(this.queue[this.pos]);
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
                    }
                }, 10);
            }
        }, 10);
    }

    //task: move to shared mem buffer /w web worker doing all the costly math operations
    async updateStats(trip) {
        if (trip.type == tripType.pickup) {
            calcVehiclePassengersServed(this);
            calcVehicleRevenue(this);
        }
        calcVehicleIdle(this);
        calcVehicleMileage(this);

        updateVehicleStats(this);
    }

    autoDispatch() {
        if (typeof this.dispatcher === 'undefined') {
            this.dispatcher = window.setInterval(() => {
                if (this.queue.length != 0 && this.startTime <= (clockCurrTime + 1) && this.status == vehStatus.starting) {
                    this.dispatcher = window.clearInterval(this.dispatcher);
                    this.updateStatus();
                    this.animate();
                }
            }, (1000 * simSpeedFactor));
        }
    }

    forceDispatch() {
        if (this.status == vehStatus.route || this.status == vehStatus.loop) {
            this.animate();
        }
    }

    stopDispatch() {
        this.dispatcher = window.clearInterval(this.dispatcher);
    }

    clearIntervals() {
        this.mapInterval = window.clearInterval(this.mapInterval);
        this.dispatcher = window.clearInterval(this.dispatcher);
    }

    hasFinished() {
        return this.status == vehStatus.depot || this.status == vehStatus.loop;
    }
}

export { Vehicle };