const WorkerPool = require('./worker_pool');
const path = require('path');
const os = require('os');
const koa = require('koa');

const pool = new WorkerPool(os.cpus().length, path.resolve(__dirname, 'worker.js'));

console.log('Kernels: ', os.cpus().length);

const app = new koa();

app.use(async context => {
    const {value} = context.query;
    const result = await new Promise((resolve, reject) => {
        pool.runTask({value}, (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        })
    });
    context.body = result;
    context.status = 200;
})

app.listen(3000);
