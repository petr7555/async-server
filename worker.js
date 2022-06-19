const { threadId, parentPort } = require('worker_threads');

const slowFunction = (baseNumber) => {
    let result = 0;
    for (let i = Math.pow(baseNumber, 7); i >= 0; i--) {
        result += Math.atan(i) * Math.tan(i);
    }
    return result;
}

parentPort.on('message', task => {
    const { value } = task;
    console.log(`task runs on thread: ${threadId}`);
    const result = slowFunction(value);
    parentPort.postMessage(`Thread ${threadId} computed that result for ${value} is ${result}.`);
});
