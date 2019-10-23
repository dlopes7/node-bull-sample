const Sdk = require('@dynatrace/oneagent-sdk');
const Api = Sdk.createInstance();

var Queue = require('bull');
var queue = new Queue('prioli_queue');
const express = require('express')


const app = express()
const port = 3000

queue.process(10, `${__dirname}/processor.js`);
queue.on('completed', function (job, result) {
    console.log(`Completed Job: ${job.id}`)
})
queue.on('failed', function(job, err){
    console.log(`Failed Job: ${job.id}: ${err}`)
  })



app.get('/', (req, res) => {

    const tracer = Api.traceOutgoingRemoteCall({
        serviceEndpoint: "ChildProcess",
        serviceMethod: 'Bull.add', // the name of the remote method called
        serviceName: "StringManipulator",
        channelType: Sdk.ChannelType.NAMED_PIPE
    });

    try {
        tracer.start(function triggerTaggedRemoteCall() {
            const dtTag = tracer.getDynatraceStringTag();
            console.log(`Outgoing: ${dtTag}`);
            queue.add({
                'dtTag': dtTag
            });
            
        });
    } catch (e) {
        tracer.error(e);
        throw e;
    } finally {
        tracer.end();
    }
    res.send('Hello World!')
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))