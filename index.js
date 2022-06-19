const WorkerPool = require('./worker_pool');
const path = require('path');
const os = require('os');
const koa = require('koa');

const num_kernels = os.cpus().length;
console.log('Kernels: ', num_kernels);
const pool = new WorkerPool(num_kernels, path.resolve(__dirname, 'worker.js'));

const app = new koa();

app.use(async context => {
    const { value } = context.query;
    context.body = await new Promise((resolve, reject) => {
        pool.runTask({ value }, (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result);
        })
    });
    context.status = 200;
})

const port = 3000;
app.listen(port);
console.log(`Server is running on port ${port}`);
