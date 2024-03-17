1，如何更新 jest 快照？
npm run test -- -u, 其中 -- 的作用是告诉命令行，-u 这个参数不是给 npm，而是传递给 jest

2，transform plugins 反向执行是什么意思？
因 transform 函数互相之间会有影响，故调整 transform 的执行顺序。
3，如何加上 \_ctx. ?
\_ctx. 原本在 transformExpression 中加，因为 transform 的执行顺序使得 transformExpression 没有执行
