const Sdk = require('@dynatrace/oneagent-sdk');
const Api = Sdk.createInstance();

const { Client } = require('pg')
const client = new Client({
    user: 'david',
    password: 'password',
})
client.connect()



function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function sleep(n) {
    msleep(n * 1000);
}

module.exports = function (job) {
    console.log(`Incoming: ${job.data.dtTag}`);
    const tracer = Api.traceIncomingRemoteCall({
        serviceEndpoint: "ChildProcess",
        serviceMethod: 'process',
        serviceName: "StringManipulator",
        dynatraceTag: job.data.dtTag, // extract and set the dynatrace tag
        protocolName: "Json" // optional
    });
    try {
        tracer.start(function downstream() {
            sleep(3);
            
            client.query('SELECT $1::text as message', ['Hello from Postgres!'], (err, res) => {
                console.log(err ? err.stack : res.rows[0].message) // Hello World!
              })
            console.log('Message processed!')
            return Promise.resolve();
        });
    } catch (e) {
        tracer.error(e);
        throw e;
    } finally {
        tracer.end();
    }
    
    

}