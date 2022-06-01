const {threadId, parentPort} = require('worker_threads');

parentPort.on('message', task => {
    const {value} = task;
    console.log(`task runs on thread: ${threadId}`);
    parentPort.postMessage(`${value} runs on thread: ${threadId}`);
});