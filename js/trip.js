class Trip {
    constructor(name = 'N/A', type = tripType.unknown, PUcoords = { lat: 0.0, lng: 0.0 }, DOcoords = { lat: 0.0, lng: 0.0 },
        PUadr = 'N/A', DOadr = 'N/A', speed = 0, idleTime = 0, waitTime = 0, passengers = 0, distance = 0) {

        this.name = name;
        this.type = type;
        this.PUcoords = PUcoords;
        this.DOcoords = DOcoords;
        this.PUadr = PUadr;
        this.DOadr = DOadr;
        this.speed = speed;
        this.idleTime = idleTime;
        this.waitTime = waitTime;
        this.passengers = passengers;
        this.distance = distance;
    }
}

export { Trip };