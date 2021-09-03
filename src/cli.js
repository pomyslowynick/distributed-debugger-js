const { Command } = require('commander');
const program = new Command();
const axios = require("axios");
const startVisualization = require("../visualizer/bin/www");
const port = 3000

program
    .version('1.0.1')

program
    .command('kill <node_id>')
    .description('kill a node with a given node_id')
    .action((node_id, env, options) => {
        let clusterNodes = {};
        axios.post('http://localhost:8080/kill', {nodeID: node_id}).then(function (response) {
            const responseStatus = response.status;
            if (responseStatus === 200) {
                console.log('Node id: %s has been successfully killed, status: %s.', node_id, responseStatus);
            } else {
                console.log('Kill operation failed: %s response', responseStatus);
            }
        }).catch(function (error) {
            console.log(error);
        });
    });

program
    .command('restart <node_id>')
    .description('restart a node with a given node_id')
    .action((node_id, env, options) => {
        let clusterNodes = {};
        axios.post('http://localhost:8080/restart', {nodeID: node_id}).then(function (response) {
            const responseStatus = response.status;
            if (responseStatus === 200) {
                console.log('Node id: %s has been successfully restarted, status: %s.', node_id, responseStatus);
            } else {
                console.log('Restart operation failed: %s response', responseStatus);
            }
        }).catch(function (error) {
            console.log(error);
        });
    });

program
    .command('show')
    .description('show the details of the cluster')
    .action((script, options) => {
        axios.get('http://localhost:8080/get-cluster-state').then(function (response) {
            const clusterState = response;
            console.log('The list of nodes registered with the cluster: ');
            console.log('------------------------------------------------');
            if (clusterState.data.activeNodes !== 0) {
                clusterState.data.nodes.forEach((node) => {
                    console.log("Node ID %s | status: %s | leader?: %s", node.nodeID, node.nodeStatus, node.isLeader);
                })
            } else {
                console.log("Cluster is empty");
            }
            console.log('------------------------------------------------');
        }).catch(function (error) {
            console.log(error);
        });
    });

program
    .command('visualize')
    .description('execute the given remote cmd')
    .option('-e, --exec_mode <mode>', 'Which exec mode to use', 'fast')
    .action((script, options) => {
        axios.get('http://localhost:8080/get-cluster-state').then(function (response) {
            const clusterState = response;
            // const visualizerServer = require("../visualizer/bin/www");
            startVisualization();
            console.log(`Cluster visualization started at http://localhost:${port}`)
        }).catch(function (error) {
            console.log(error);
        });
    })

program
    .command('start <protocol>')
    .description('start the raft simulation')
    .action((protocol, options) => {
        if (protocol === "raft") {
            console.log('Starting the simulation... ');
            console.log('------------------------------------------------');
            console.log('5 node cluster');
            console.log('Waiting for the leader election...');
        }
        // axios.get('http://localhost:8080/start-simulation').then(function (response) {
        // }).catch(function (error) {
        //     console.log(error);
        // });
    })

program.parse(process.argv);