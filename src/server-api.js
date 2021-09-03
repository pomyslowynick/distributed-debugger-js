const restify = require('restify');
const axios = require('axios');

const serverApi = restify.createServer({
    name: 'Distributed-Debugger',
    version: '1.0.0'
});

const clusterState = {
    nodes: [],
    activeNodes: 0,
    partitionedNodes: 0,
    urlNum: 8001
}
const timer = ms => new Promise( res => setTimeout(res, ms));

serverApi.use(restify.plugins.acceptParser(serverApi.acceptable));
serverApi.use(restify.plugins.queryParser());
serverApi.use(restify.plugins.bodyParser());

serverApi.get('/get-cluster-state', getClusterState);
serverApi.post('/heartbeat', respondHeartbeat);
serverApi.post('/kill', sendKillCommand);
serverApi.post('/start-simulation', startSimulation);
serverApi.post('/restart', restartNode);
serverApi.post('/select-leader', selectLeader);

function getClusterState(req, res, next) {
    req.response = clusterState;
    req.body = clusterState;
    res.header("Access-Control-Allow-Origin", "*");
    res.send(req.response);
    return next();
}

function selectLeader(req, res, next) {
    const nodeID = req.body.nodeID;
    const nodeLookup = clusterState.nodes.find(o => o.nodeID === req.body.nodeID);
    nodeLookup.isLeader = true;
    clusterState.leader = nodeID;
    req.response = "Leader selected";
    res.send(req.response);
    return next();
}

function sendHeartbeat() {
    for (const node of clusterState.nodes) {
        axios.post(`http://localhost:${node.urlHandle}/respond-heartbeat`
        ).then(function (response) {
            console.log(`Heartbeat on ${node.nodeID}: ${response.data}`);
            node.nodeStatus = response.data;
        }).catch(function (error) {
            node.nodeStatus = "Failed";
            console.log(`Failed heartbeat on ${node.nodeID}`);
        });
    }
}

function restartNode(req, res, next) {
    clusterState.activeNodes += 1;
    const nodeID = req.body.nodeID;
    const nodeUrl = clusterState.nodes.find(o => o.nodeID === nodeID).urlHandle;
    axios.post(`http://localhost:${nodeUrl}/restart`
    ).then(function (response) {
        req.response = 'Successfully restarted node';
        res.send(req.response);
        return next();
    }).catch(function (error) {
        console.log('Failed to restart node');
        req.response = 'Failed to restart node';
        res.send(req.response);
        return next();
    });
}

function respondHeartbeat(req, res, next) {
    const nodeLookup = clusterState.nodes.find(o => o.nodeID === req.body.nodeID);
    if (nodeLookup !== undefined) {
        console.log("hey guys");
        nodeLookup.nodeStatus = req.body.status;
    } else {
        const newNode = {
            nodeID: req.body.nodeID,
            nodeStatus: req.body.status,
            ipAddress: req.body.ipAddress,
            isLeader: req.body.isLeader,
            urlHandle: clusterState.urlNum,
        }
        clusterState.nodes.push(newNode);
        req.response = {message: 'Successfully connected', urlHandle: newNode.urlHandle};
        res.send(req.response);
        clusterState.urlNum += 1
        clusterState.activeNodes += 1;
        return next();
    }
}

function sendKillCommand(req, res, next) {
    clusterState.activeNodes -= 1;
    const nodeID = req.body.nodeID;
    const nodeUrl = clusterState.nodes.find(o => o.nodeID === nodeID).urlHandle;
    axios.post(`http://localhost:${nodeUrl}/kill-me`
     ).then(function (response) {
        const nodeIndex = clusterState.nodes.findIndex(o => o.nodeID === nodeID);
        clusterState.nodes.splice(nodeIndex);
        req.response = 'Successfully killed node';
        res.send(req.response);
        return next();
    }).catch(function (error) {
        console.log('Failed to kill node');
        req.response = 'Failed to kill node';
        res.send(req.response);
        return next();
    });
}

function startSimulation(req, res, next) {
    req.response = 'Successfully started simulation';
    res.send(req.response);
    return next();
}

serverApi.listen(8080, async function () {
    console.log('%s listening at %s', serverApi.name, serverApi.url);
    while (true) {
        await sendHeartbeat();
        await timer(3000);
    }
});

