import { windowOptions, windowType } from './constants.js';
import { dockStats } from './statisticsList.js'
import { dockQueue } from './tripQueue.js';;
import { dockLog } from './log.js';


class PopWindow {
    constructor(type = windowType.unknown, title = 'unknown') {
        this.type = type;

        this.win = window.open("", type, windowOptions + "dependent=yes, top=" + (screen.height / 2 - 400) + ",left=" + (screen.width / 2 - screen.width / 3));

        this.win.document.writeln(
            '<html><head><title>' + title + '</title><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">' +
            '<link href="css/materialize.css" type="text/css" rel = "stylesheet" media = "screen,projection" >' +
            '<link href="css/styles.css" type="text/css" rel="stylesheet" media="screen,projection"></head><body onLoad="self.focus()"><div class="preloader"></div>' +
            '<script type="text/javascript" src="js/materialize.js"></script><script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>' +
            '<script>$(\'.preloader\').fadeOut(\'slow\'); window.setTimeout(() => {M.AutoInit();}, 200);</script></body ></html >'
        );

        switch (this.type) {
            case (windowType.statistics):
                this.win.addEventListener('beforeunload', dockStats);
                break;
            case (windowType.log):
                this.win.addEventListener('beforeunload', dockLog);
                break;
            case (windowType.queue):
                this.win.addEventListener('beforeunload', dockQueue);
                break;
            default:
                break;
        }
    }
}

export { PopWindow };