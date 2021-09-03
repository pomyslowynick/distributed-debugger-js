const querystring = require('querystring');
const axios = require("axios");
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const restify = require('restify');
const startRaft = require('./raft-client')

const clientApi = restify.createServer({
    name: 'Worker-Client',
    version: '1.0.0'
});

clientApi.use(restify.plugins.acceptParser(clientApi.acceptable));
clientApi.use(restify.plugins.queryParser());
clientApi.use(restify.plugins.bodyParser());

clientApi.post('/kill-me', handleKillRequest);
clientApi.post('/start-raft', startRaftSimulation);
clientApi.post('/respond-heartbeat', respondToHeartbeat);

const timer = ms => new Promise( res => setTimeout(res, ms));

const nodeDetails = {
    nodeID: uuidv4(),
    status: "available"
}

function respondToHeartbeat(req, res, next) {
    req.response = nodeDetails.status;
    res.send(req.response);
    return next();
}
function handleKillRequest(req, res, next) {
    res.send(req.response);
    nodeDetails.status = "shutdown";
    return next();
}

function startRaftSimulation(req, res, next) {
    res.send(req.response);
    nodeDetails.status = "shutdown";
    return next();
}

axios.post('http://localhost:8080/heartbeat', {
    nodeID: nodeDetails.nodeID,
    status: nodeDetails.status,
    ipAddress: os.networkInterfaces()["Ethernet 3"],
    isLeader: false,
    }).then(async function (response) {
        console.log(response.data.message);
        await startServer(response.data.urlHandle);
    })
    .catch(function (error) {
        console.log(error);
    });

async function startServer(port) {
    clientApi.listen(port, function () {
        console.log('%s listening at %s', clientApi.name, clientApi.url);
    });
    startRaft(8081);
}
