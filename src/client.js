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
let raftClient;

clientApi.use(restify.plugins.acceptParser(clientApi.acceptable));
clientApi.use(restify.plugins.queryParser());
clientApi.use(restify.plugins.bodyParser());

clientApi.post('/kill-me', handleKillRequest);
clientApi.post('/start-raft', startRaftSimulation);
clientApi.post('/respond-heartbeat', respondToHeartbeat);
clientApi.post('/restart', restartNode);

const timer = ms => new Promise( res => setTimeout(res, ms));

const ports = [
    10001, 10002, 10003,
    10004, 10005, 10006, 10007,
];


const nodeDetails = {
    nodeID: uuidv4(),
    status: "available",
    port: 0
}

function respondToHeartbeat(req, res, next) {
    if (nodeDetails.status === "shutdown") {
        console.log("Node in shutdown state.")
    }
    req.response = nodeDetails.status;
    res.send(req.response);
    return next();
}

function restartNode(req, res, next) {
    console.log(nodeDetails);
    ports.forEach((nr) => {
        if (!nr || nodeDetails.port === nr) return;

        raftClient.join('tcp://127.0.0.1:' + nr);
    });
    req.response = "Node successfully restarted.";
    res.send(req.response);
    return next();
}

function handleKillRequest(req, res, next) {
    res.send(req.response);
    nodeDetails.status = "shutdown";
    raftClient.leave(`tcp://127.0.0.1:${nodeDetails.port}`);
    console.log("Node killed");
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
        nodeDetails.port = response.data.urlHandle;
        await startServer(response.data.urlHandle);
    })
    .catch(function (error) {
        console.log(error);
    });

async function startServer(port) {
    clientApi.listen(port, function () {
        console.log('%s listening at %s', clientApi.name, clientApi.url);
    });
    console.log(port+2000);
    raftClient = startRaft(port+2000, nodeDetails.nodeID);
}
