import { LOG_ENTRY_TYPES } from './constants.js';

document.getElementById('clearlog').addEventListener('click', clearEvents);
document.getElementById('poplog').addEventListener('click', popLog);

var logWin = document;
var liveLogEntries = [];

const LOG_LIST = logWin.getElementById('logbox');

const WARNING_COLORS = {
    none: { hex: '#ffffff', class: 'white' },
    low:  { hex: '#fff9c4', class: 'yellow lighten-4' },
    med:  { hex: '#ffe0b2', class: 'orange lighten-4' },
    high: { hex: '#ef9a9a', class: 'red lighten-4' }
};

function addEvent(event, optionalMsg=null) {
    let tempEvent;

    if (optionalMsg)
        tempEvent = new LogEntry(optionalMsg, null, new Date(), null, event.id, event.icon);
    else
        tempEvent = new LogEntry(event.msg, null, new Date(), null, event.id, event.icon);

    LOG_LIST.appendChild(tempEvent.elem);
    autoScroll();
}

function addAPIEvent(message, details, dateTime, affiliateID, type, icon) {
    let tempEvent = new LogEntry(message, details, dateTime, affiliateID, type, icon);

    liveLogEntries.push(tempEvent);
    LOG_LIST.appendChild(tempEvent.elem);
    autoScroll();
}

function addStatusEvent(type, message=null) {
    let tempEvent = new StatusEntry(type, message);

    liveLogEntries.push(tempEvent);
    LOG_LIST.appendChild(tempEvent.elem);
    autoScroll();
}

function clearEvents() {
    while (LOG_LIST.firstChild) {
        LOG_LIST.removeChild(LOG_LIST.firstChild);
    }
}

function autoScroll() {
    if (logWin == document)
        LOG_LIST.scrollTop = (LOG_LIST.scrollTop + 300 >= LOG_LIST.scrollHeight) ? LOG_LIST.scrollHeight : LOG_LIST.scrollTop;
    else {
        LOG_LIST.scrollTop = (LOG_LIST.scrollTop + logWin.defaultView.outerHeight >= LOG_LIST.scrollHeight) ? LOG_LIST.scrollHeight : LOG_LIST.scrollTop;
    }
}

function popLog() {
    if (!isLogPoped()) {
    }
}

function dockLog() {
    if (isLogPoped()) {
    }
}

function isLogPoped() {
    return logWin != document;
}

class LogEntry {
    constructor(message, details, dateTime, affiliateID, type, icon) {
        this.message = message ?? null;
        this.details = details ?? null;
        this.affiliateID = affiliateID ?? null;

        this.type = type ?? this.#determineType();
        this.icon = icon ?? this.#determineIcon();
        this.color = this.#determineColor();
        this.fromAPI = (!type) ? true : false;

        this.eventTime = (dateTime.length > 8) ? new Date(dateTime.replace('GMT', 'EST')) : dateTime;
        this.fullyInit = false;

        this.createLogEntry();
    }

    createLogEntry() {
        this.innerElems = [];

        this.elem = logWin.createElement('div');
        this.elem.setAttribute('class', 'z-depth-1 slide ' + this.color.class + ((logWin == document) ? ' logentry' : ' logpanelentry'));

        if(this.icon) {
            let entryIcon = logWin.createElement('i');
            entryIcon.setAttribute('class', 'material-icons grey-text left');
            entryIcon.innerText = this.icon;
            this.innerElems.push(entryIcon);
        }

        if(this.message) {
            let entryText = logWin.createElement('p');
            entryText.innerHTML = (this.fromAPI) ? this.#formatMessage() : this.message;
            this.innerElems.push(entryText);
        }

        if(this.details) {
            let detailsText = logWin.createElement('p');
            detailsText.innerText = this.details;
            this.innerElems.push(detailsText);
        }

        if(this.eventTime) {
            let entryTime = logWin.createElement('a');
            entryTime.setAttribute('class', 'right cyan-text text-darken-1');
            entryTime.innerText = (this.eventTime instanceof Date) ?
                this.eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) :
                this.eventTime;
            this.innerElems.push(entryTime);
        }

        if (this.innerElems.length > 0)
            this.innerElems.forEach(elem => {
                this.elem.appendChild(elem);
            });

        this.fullyInit = true;
    }

    #determineType() {
        if (!this.message) return LOG_ENTRY_TYPES.none.id;

        if (this.message.includes('NO SHOW')) return LOG_ENTRY_TYPES.APInoShow.id;

        if (this.message.includes('Emergency')) return LOG_ENTRY_TYPES.APIemergency.id;

        return LOG_ENTRY_TYPES.none;
    }

    #determineColor() {
        switch(this.type) {
            case(LOG_ENTRY_TYPES.APInoShow.id):
                return WARNING_COLORS.med;
            case(LOG_ENTRY_TYPES.APIemergency.id):
                return WARNING_COLORS.high;
            default:
                return WARNING_COLORS.none;
        }
    }

    #determineIcon() {
        switch (this.type) {
            case (LOG_ENTRY_TYPES.APInoShow.id):
                return 'group_remove';
            case (LOG_ENTRY_TYPES.APIemergency.id):
                return 'warning_amber';
            default:
                return 'info_outline';
        }
    }

    //fill later
    #formatMessage() {
        let tokens = [];

        switch(this.type) {
            case (LOG_ENTRY_TYPES.APInoShow.id):
                const findVehicle = /Veh#:\s*(-?\d+(?:\.\d+)?)/;
                const findPerson = /Person:\s*(-?\w+(?:\s?\w+)?)/;
                const findServiceID = /ServiceID:\s*(-?\w+)/;

                tokens.push(findVehicle.exec(this.message));
                tokens.push(findPerson.exec(this.message));
                tokens.push(findServiceID.exec(this.message));

                return ('Vehicle #' + tokens[0][1] + ' has reported a no-show for ' + tokens[1][1] + ' [Service ID: ' + tokens[2][1] + ']');
            default:
                return this.message;
        }
    }
}

export { addEvent, addAPIEvent};