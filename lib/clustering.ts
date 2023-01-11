export type ClusterOptions<K extends string[]> = {
  elements: Element<K>[],
  keys: K,
  clusterSize: number,
}

export type Element<K extends string[]> =
  { id: string, values: Point<K> }

export type Point<K extends string[]> =
  { [k in K[number]]: number }

export interface ClusterResult {
  count: number,
  assignments: {
    id: string,
    cluster: number,
  }[],
}

// Implementation based on:
// https://jmonlong.github.io/Hippocamplus/2018/06/09/cluster-same-size/#iterative-nearest-neighbor
// We're using this instead of K-means because it guarantees us reliable cluster sizes,
// and based on visualising out the groupings on a scatter plot looks good enough.
// We tried K-means and K-means++ using the skmeans package, but while for some data
// it results in roughly equal groups, sometimes it results in very unequal clusters.
export const cluster = <K extends string[]>(opts: ClusterOptions<K>): ClusterResult => {
  const clusters: Element<K>[][] = []
  let unassigned: Element<K>[] = opts.elements.slice()

  // Choose a cluster size that is as close to the original size as possible,
  // which divides neatly to minimize the difference in cluster sizes
  const clusterSizes = calculateClusterSizes(opts.elements.length, opts.clusterSize)

  // For each cluster
  for (const clusterSize of clusterSizes) {
    // Select a starting point
    //   This is the 'slow' O(n^2) part inside the loop although
    //   in practice it usually runs in fractions of a second
    const avgDistances = unassigned.map(p1 =>
      unassigned
      .map(p2 => sqDist(p1.values, p2.values, opts.keys))
      .reduce((acc, cur) => acc + cur, 0)
    )
    const maxAvgDistIndex = avgDistances.indexOf(Math.max(...avgDistances))
    const [center] = unassigned.splice(maxAvgDistIndex, 1);

    // Find the (clusterSize - 1) nearest points
    const nearestDistances = unassigned
      .map((e, idx) => [idx, sqDist(e.values, center.values, opts.keys)])
      .sort((a, b) => a[1] - b[1])
      .slice(0, clusterSize - 1)

    // Form a cluster from these points
    clusters.push([
      center,
      ...nearestDistances.map(([idx]) => unassigned[idx])
    ])

    // Mark as assigned
    const nearestPointIndexes = nearestDistances.map(d => d[0])
    unassigned = unassigned.filter((_, i) => !nearestPointIndexes.includes(i))
  }

  return {
    count: clusters.length,
    assignments: clusters.flatMap((c, cIndex) => c.map(e => ({ id: e.id, cluster: cIndex })))
  }
}

/**
 * @returns The squared distance between points a and b based on the provided keys
 */
const sqDist = <K extends string[]>(a: Point<K>, b: Point<K>, keys: K) => {
  // for each key
  return keys
    // calculate (a[k] - b[k])^2
    .map((k: K[number]) => (a[k] - b[k]) ** 2)
    // sum the results
    .reduce((acc, cur) => acc + cur, 0)
}

const calculateClusterSizes = (elementCount: number, targetSize: number): number[] => {
  if (elementCount === 0) return [];

  const clusterCount = Math.max(Math.round(elementCount / targetSize), 1);
  const averageClusterSize = elementCount / clusterCount;

  const clusterSizeDown = Math.floor(averageClusterSize);
  const clusterSizeUp = Math.ceil(averageClusterSize);
  
  const upClusters = elementCount - (clusterCount * clusterSizeDown);
  return new Array(clusterCount)
    .fill(undefined)
    .map((_, i) => i < upClusters ? clusterSizeUp : clusterSizeDown);
}
