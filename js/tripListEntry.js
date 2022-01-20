import { PU_STATUS, queueWin } from './liveQueue.js';
import { addDragWindow } from './dragWindow.js';
import { Trip } from './trip.js';

//Only accepets Instances of 'Trip' Object! (see trip.js)
class TripListEntry {
    constructor(parent = null, tripObj = null) {
        if (!(tripObj instanceof Trip)) this.#_throw('No Trip Specified.');

        this.trip = tripObj;
        this.parent = parent;

        this.fullyInit = false;
        this.active = true;
        this.pickedUpStatus = PU_STATUS.none;

        this.constructElement();
    }

    constructElement() {
        if (!this.parent.tripsElem) return;

        this.elem = queueWin.createElement('li');
        this.elem.setAttribute('class', 'live-triplist-item card-panel collection-item avatar waves-effect pointer-cursor');
        this.elem.addEventListener('click', this.#focusMarker.bind(this));

        this.elem.tripIcon = queueWin.createElement('i');
        this.elem.tripIcon.setAttribute('class', 'trip-icon material-icons circle');
        this.elem.tripIcon.innerText = this.#determineIcon(this.trip.status);

        this.elem.tripTitleBar = queueWin.createElement('div');
        this.elem.tripTitleBar.setAttribute('class', 'trip-title-bar');

        this.elem.tripTitle = queueWin.createElement('span');
        this.elem.tripTitle.setAttribute('class', 'trip-title truncate link-text');
        this.elem.tripTitle.innerText = this.trip.name;
        this.elem.tripTitle.addEventListener('click', this.handlePersonSelect.bind(this));

        this.elem.tripAdr = queueWin.createElement('p');
        this.elem.tripAdr.setAttribute('class', 'trip-adr truncate');
        this.elem.tripAdr.innerHTML = this.trip.PUadr + ' <i class="material-icons">arrow_forward</i> ' + this.trip.DOadr;
        this.elem.tripAdr.title = this.trip.PUadr + ' -> ' + this.trip.DOadr;

        this.elem.tripTitleBar.appendChild(this.elem.tripTitle);
        this.elem.appendChild(this.elem.tripIcon);
        this.elem.appendChild(this.elem.tripTitleBar);
        this.elem.appendChild(this.elem.tripAdr);

        this.fullyInit = true;
        this.parent.tripsElem.appendChild(this.elem);
    }

    setActive() {
        if (!this.elem) return;

        this.elem.tripETA = queueWin.createElement('span');
        this.elem.tripETA.setAttribute('class', 'trip-eta cyan-text text-darken-1');
        if(this.trip.status === 'PICKEDUP')
            this.elem.tripETA.innerText = 'DO Eta. ' + this.trip.forcastedDOTime;
        else
            this.elem.tripETA.innerText = 'PU Eta. ' + this.trip.forcastedPUTime;

        this.elem.tripProg = queueWin.createElement('div');
        this.elem.tripProg.setAttribute('class', 'trip-prog');

        this.elem.tripProgBar = queueWin.createElement('div');
        this.elem.tripProgBar.setAttribute('class', 'trip-prog-bar progress');
        this.elem.tripProgBar.innerHTML = ('<div></div>');
        this.elem.tripProgBar.firstChild.classList.add('determinate');
        this.elem.tripProgBar.firstChild.style.width = this.#calcTripProg() + '%';

        this.elem.tripProgStatus = queueWin.createElement('span');
        this.elem.tripProgStatus.setAttribute('class', 'trip-prog-status');

        if (this.trip.timeStatus === 'On-time') {
            this.elem.tripProgStatus.classList.add('green-text');
            this.elem.tripProgStatus.innerHTML = '<i class="material-icons tiny">task_alt</i> on-time';
            this.pickedUpStatus = PU_STATUS.onTime;
        }
        else {
            this.elem.tripProgStatus.classList.add('red-text');
            this.elem.tripProgStatus.innerHTML = '<i class="material-icons tiny">error</i> late';
            this.pickedUpStatus = PU_STATUS.late;
        }

        this.elem.tripTitleBar.appendChild(this.elem.tripETA);
        this.elem.tripProg.appendChild(this.elem.tripProgBar);
        this.elem.tripProg.appendChild(this.elem.tripProgStatus);
        this.elem.appendChild(this.elem.tripProg);
    }

    destroy() {
        this.trip = null;
        this.parent = null;

        this?.elem.remove();
    }

    reStyle() {
        switch (this.trip.status) {
            case ('CANCELLED'):
            case ('NOSHOWREQ'):
            case ('NOSHOW'):
                this.elem.classList.add('red', 'lighten-4', 'semi-transparent');
                this.elem.classList.remove('pointer-cursor');
                this.pickedUpStatus = PU_STATUS.none;
                this.active = false;

                this.elem.remove();
                this.parent.tripsElem.appendChild(this.elem);
                return;
            case ('NONE'):
                this.elem.classList.add('semi-transparent');
                this.elem.classList.remove('pointer-cursor');
                this.pickedUpStatus = PU_STATUS.none;
                this.active = false;

                this.elem.remove();
                this.parent.tripsElem.appendChild(this.elem);
                return;
            default:
                return;
        }
    }

    handlePersonSelect(e) {
        addDragWindow(this.trip),
        e.stopPropagation();
    }

    #focusMarker() {
        if (this.trip.status !== 'PICKEDUP' && this.trip.status !== 'IRTPU' && this.trip.status !== 'ACCEPTED')
            return;

        this.parent.vehicle.focusTripMarker(this.trip.confirmation);
    }

    #determineIcon(tripType) {
        switch (tripType) {
            case ('BIDOFFERED'):
            case ('ASSIGNED'):
            case ('DISPATCHED'):
                return 'assignment';
            case ('ATLOCATION'):
            case ('ACCEPTED'):
            case ('IRTPU'):
                return 'hail';
            case ('PICKEDUP'):
                return 'follow_the_signs';
            case ('CANCELLED'):
            case ('NOSHOWREQ'):
            case ('NOSHOW'):
                return 'cancel';
            case ('NONE'):
            default:
                return 'help_outline';
        }
    }

    #calcTripProg() {
        const mk1 = this.parent.vehicle.currPos;
        const mk2 = (this.trip.status === 'PICKEDUP') ? this.trip.DOcoords : this.trip.PUcoords;
        const radian = (Math.PI / 180);
        const R = 3958.8;

        let rlat1 = mk1.lat * radian;
        let rlat2 = mk2.lat * radian;
        let difflat = rlat2 - rlat1;
        let difflng = (mk2.lng - mk1.lng) * radian;

        let currDist = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflng / 2) * Math.sin(difflng / 2)));
        let result = (1 - (currDist / this.trip.distance)) * 100;

        return (result > 0) ? (result > 99) ? 100 : Math.floor(result) : 0;
    }

    #_throw(msg) {
        throw new Error(msg);
    }
}

export { TripListEntry };