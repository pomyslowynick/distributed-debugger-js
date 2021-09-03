function startRaft(portNum, nodeID){
    const debug = require('diagnostics')('raft')
        , argv = require('argh').argv
        , Log = require('liferaft-patched/log')
        , LifeRaft = require('liferaft-patched')
        , axios = require('axios');
    let msg;

    if (argv.queue) msg = require(argv.queue);
    else msg = require('axon');

//
// We're going to create own custom Raft instance which is powered by axon for
// communication purposes. But you can also use things like HTTP, OMQ etc.
//
    class MsgRaft extends LifeRaft {

        /**
         * Initialized, start connecting all the things.
         *
         * @param {Object} options Options.
         * @api private
         */
        initialize(options) {
            debug('initializing reply socket on port %s', this.address);

            const socket = this.socket = msg.socket('rep');

            socket.bind(this.address);
            socket.on('message', (data, fn) => {
                this.emit('data', data, fn);
            });

            socket.on('error', () => {
                debug('failed to initialize on port: ', this.address);
            });
        }

        /**
         * The message to write.
         *
         * @param {Object} packet The packet to write to the connection.
         * @param {Function} fn Completion callback.
         * @api private
         */
        write(packet, fn) {
            if (!this.socket) {
                this.socket = msg.socket('req');

                this.socket.connect(this.address);
                this.socket.on('error', function err() {
                    console.error('failed to write to: ', this.address);
                });
            }

            debug('writing packet to socket on port %s', this.address);
            this.socket.send(packet, (data) => {
                fn(undefined, data);
            });
        }
    }

//
// We're going to start with a static list of servers. A minimum cluster size is
// 4 as that only requires majority of 3 servers to have a new leader to be
// assigned. This allows the failure of one single server.
//
    const ports = [
        10001, 10002, 10003,
        10004, 10005, 10006, 10007,
    ];

//
// The port number of this Node process.
//
    var port =  portNum;


//
// Now that we have all our variables we can safely start up our server with our
// assigned port number.
//
    const raft = new MsgRaft('tcp://127.0.0.1:' + port, {
        'election min': 2000,
        'election max': 5000,
        'heartbeat': 1000
    });

    raft.log = new Log(raft, {
        adapter: require('memdown')
    })


    raft.on('heartbeat timeout', function () {
        console.log('heart beat timeout, starting election');
    });

    raft.on('term change', function (to, from) {
        console.log('were now running on term %s -- was %s', to, from);
    }).on('leader change', function (to, from) {
        console.log('we have a new leader to: %s -- was %s', to, from);
    }).on('state change', function (to, from) {
        console.log('we have a state to: %s -- was %s', to, from);
    });

    raft.on('leader', function () {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
        console.log('I am elected as leader');
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
        axios.post('http://localhost:8080/select-leader', {nodeID: nodeID})
    });

    raft.on('candidate', function () {
        console.log('----------------------------------');
        console.log('I am starting as candidate');
        console.log('----------------------------------');
    });

//
// Join in other nodes so they start searching for each other.
//
    ports.forEach((nr) => {
        if (!nr || port === nr) return;

        raft.join('tcp://127.0.0.1:' + nr);
    });

}

module.exports = startRaft