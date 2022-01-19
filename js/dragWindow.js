import { liveVehicles } from "./vehicleList.js";
import { Trip } from "./trip.js";

const DRAG_WINDOW_TEMPLATE =
    '<h5 class="no-padding">{{name}} ' +
    '<a href="tel:+1-{{phone}}" class="cyan-text text-darken-1 drag-phone">{{phone}}</a>' +
    '<i class="material-icons right drag-close">close</i></h5>' +
    '<div class="divider"></div>' +
    '<p><b>Trip ID:</b> {{confirmation}}</p>' +
    '<p><b>Trip Status:</b> {{status}}</p>' +
    '<p><b>Assigned Vehicle:</b> #{{vehicle}} ({{type}})</p>' +
    '<p><b>Passengers:</b> {{passengers}}</p>' +
    '<p><b>PU Address:</b> {{pu}}</p>' +
    '<p><b>DO Address:</b> {{do}}</p>' +
    '<div class="divider"></div>' +
    '<p class="drag-table-header-pu"><b>Pick Times:</b></p>' +
    '<table class="no-padding"><tr><th>Requested</th><th>Scheduled</th><th>Forecasted</th></tr>' + 
    '<tr><td>{{r_pu_time}}</td><td>{{s_pu_time}}</td><td>{{f_pu_time}}</td></tr></table>' +
    '<p class="drag-table-header-do"><b>Drop Times:</b></p>' +
    '<table class="no-padding"><tr><th>Appointment</th><th>Scheduled</th><th>Forecasted</th></tr>' +
    '<tr><td>{{a_do_time}}</td><td>{{s_do_time}}</td><td>{{f_do_time}}</td></tr></table>';

//id by trip confirmation
let dragWindows = new Map();

function addDragWindow(trip, callback=null) {
    if (!(trip instanceof Trip)) {
        console.error('Non-trip object passed to drag window');
        return;
    }

    if(!dragWindows.has(trip.confirmation))
        dragWindows.set(trip.confirmation, new DragWindow(trip));
    else
        dragWindows.get(trip.confirmation).update(trip);

    if (callback) callback();
}

class DragWindow {
    #handleDrag = this.#elementDrag.bind(this);
    #handleMouseUp = this.#closeDragElement.bind(this);

    constructor(trip) {
        this.id = trip.confirmation;
        this.trip = trip;

        this.pos1 = 0, this.pos2 = 0, this.pos3 = 0, this.pos4 = 0;
        this.eventManager = new AbortController();

        this.#constructElement();
    }

    destroy() {
        dragWindows.delete(this.id);

        this.elem.remove();
        this.eventManager.abort();
    }

    #constructElement() {
        this.elem = document.createElement('div');
        this.elem.setAttribute('class', 'draggable z-depth-2');
        this.elem.innerHTML = this.#formatTemplate();

        this.elem.addEventListener(
            'mousedown', 
            this.#dragMouseDown.bind(this), 
            { signal: this.eventManager.signal }
        );

        this.elem.getElementsByTagName('i')[0].addEventListener(
            'click',
            this.destroy.bind(this),
            { signal: this.eventManager.signal }
        );

        document.getElementById('centercol').appendChild(this.elem);
    }

    update() {
        this.elem.innerHTML = this.#formatTemplate();

        this.elem.getElementsByTagName('i')[0].addEventListener(
            'click',
            this.destroy.bind(this),
            { signal: this.eventManager.signal }
        );
    }

    #formatTemplate() {
        return DRAG_WINDOW_TEMPLATE
            .replace('{{name}}', this.trip.name)
            .replaceAll('{{phone}}', this.trip.phoneNum)
            .replace('{{confirmation}}', this.trip.confirmation)
            .replace('{{status}}', this.trip.status)
            .replace('{{vehicle}}', liveVehicles.get(this.trip.vehicle).name)
            .replace('{{type}}', liveVehicles.get(this.trip.vehicle).type.name)
            .replace('{{passengers}}', this.trip.passengers)
            .replace('{{pu}}', this.trip.PUadr)
            .replace('{{do}}', this.trip.DOadr)
            .replace('{{r_pu_time}}', this.trip.requestedTime)
            .replace('{{s_pu_time}}', this.trip.schPUTime)
            .replace('{{f_pu_time}}', this.trip.forcastedPUTime)
            .replace('{{a_do_time}}', this.trip.appointmentTime)
            .replace('{{s_do_time}}', this.trip.schDOTime)
            .replace('{{f_do_time}}', this.trip.forcastedDOTime);
    }

    #dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        this.pos3 = e.clientX;
        this.pos4 = e.clientY;

        this.elem.addEventListener(
            'mouseup',
            this.#handleMouseUp,
            { signal: this.eventManager.signal }
        );

        this.elem.addEventListener(
            'mousemove',
            this.#handleDrag,
            { signal: this.eventManager.signal }
        );
    }

    #elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        this.pos1 = this.pos3 - e.clientX;
        this.pos2 = this.pos4 - e.clientY;
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;

        this.elem.style.top = (this.elem.offsetTop - this.pos2) + "px";
        this.elem.style.left = (this.elem.offsetLeft - this.pos1) + "px";
        }

    #closeDragElement() {
        this.elem.removeEventListener(
            'mouseup',
            this.#handleMouseUp,
            { signal: this.eventManager.signal }
        );

        this.elem.removeEventListener(
            'mousemove',
            this.#handleDrag,
            { signal: this.eventManager.signal }
        );
    }
}

export { addDragWindow };