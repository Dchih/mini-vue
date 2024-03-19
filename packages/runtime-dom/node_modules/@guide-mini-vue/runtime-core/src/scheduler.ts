let queue: any = [];
let isFlushPending = false;
let activePreFlushJobs: any = [];

export function nextTick(fn?) {
  return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

export function queueJobs(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
}

function queueFlush() {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
}

export function queuePreFlush(job) {
  activePreFlushJobs.push(job);
  queueFlush();
}

function flushActivePreFlushJobs() {
  for (let index = 0; index < activePreFlushJobs.length; index++) {
    activePreFlushJobs[index]();
  }
}

function flushJobs() {
  isFlushPending = false;
  let job;
  flushActivePreFlushJobs();
  while ((job = queue.shift())) {
    job && job();
  }
}
