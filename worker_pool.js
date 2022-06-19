const { Worker } = require('worker_threads');
const { AsyncResource } = require('async_hooks')
const { EventEmitter } = require('events');

// symbols are unique (not equal) even if their description is the same
// this makes them suitable as object keys
const taskInfo = Symbol('taskInfo');
const workerFreedEvent = Symbol('workerFreedEvent');

class WorkerPoolTask extends AsyncResource {
    constructor(callback) {
        super('WorkerPoolTask');
        this.callback = callback;
    }

    done(err, res) {
        this.runInAsyncScope(this.callback, null, err, res);
        this.emitDestroy();
    }
}


class WorkerPool extends EventEmitter {
    constructor(numThreads, workerFileAbsPath) {
        super();
        this.workerFileAbsPath = workerFileAbsPath;
        // to keep track of workers to close at the end 
        this.workers = [];
        this.freeWorkers = [];
        for (let i = 0; i < numThreads; i++) {
            this.addWorker();
        }
    }

    addWorker() {
        const worker = new Worker(this.workerFileAbsPath);
        worker.on('error', (err) => {
            if (worker[taskInfo]) {
                worker[taskInfo].done(err, null);
            } else {
                this.emit('error', err)
            }
            // delete the worker that failed from the workers array
            this.workers.splice(this.workers.indexOf(worker), 1);
            this.addWorker();
        });
        worker.on('message', (result) => {
            worker[taskInfo].done(null, result);
            worker[taskInfo] = null;
            this.freeWorkers.push(worker);
            this.emit(workerFreedEvent);
        });
        this.workers.push(worker);
        this.freeWorkers.push(worker);
        this.emit(workerFreedEvent);
    }

    runTask(task, callback) {
        if (this.freeWorkers.length === 0) {
            // wait for workerFreedEvent to be emitted, then run this function again
            this.once(workerFreedEvent, () => this.runTask(task, callback));
            return;
        }
        const worker = this.freeWorkers.pop();
        worker[taskInfo] = new WorkerPoolTask(callback);
        worker.postMessage(task);
    }

    close() {
        this.workers.forEach(worker => worker.terminate());
    }
}

module.exports = WorkerPool;
