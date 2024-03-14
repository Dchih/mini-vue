1, 为什么 newIndexToOldIndexMap 赋值的下标用 newKeyIndex ?
newIndexToOldIndexMap 是 c1 中 i - e1 之间节点的位置在 c2 中 i - e2 之间的一个映射

c1: a b e d c f g
c2: a b c d e f g

e d c 在 c1 的位置为 2 3 4
所以 newIndexToOldIndexMap 的值为 4 3 2

而 newKeyIndex 是 c1 中 i - e1 之间节点在 c2 中 i - e2 之间 存在，则 newKeyIndex 为 i - e2 之间的一个下标，即 i 值, 即全局 3 个指针中的 i

要知道, newIndexToIndexMap 是用作 getSequence(arr) 的参数，调用这个函数会得到一个递增的非严格子序列, 而这个子序列可以作为一个稳定的锚，可以不移动，减少 insertBefore 调用， 从而提升性能
