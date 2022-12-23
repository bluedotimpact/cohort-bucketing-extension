import { cluster } from "./clustering"

describe("clustering", () => {
  test("can create sensisble clusters (1D)", () => {
    const res = cluster({
      clusterSize: 4,
      elements: [
        { id: "a", values: { "x": 10 } },
        { id: "b", values: { "x": 11 } },
        { id: "c", values: { "x": 36 } },
        { id: "d", values: { "x": 9 } },
        { id: "e", values: { "x": 29 } },
        { id: "f", values: { "x": 32 } },
        { id: "g", values: { "x": 7 } },
        { id: "h", values: { "x": 24 } },
      ],
      keys: ["x"],
    })

    expect(res.assignments).toContainEqual({ id: "a", cluster: 1 })
    expect(res.assignments).toContainEqual({ id: "b", cluster: 1 })
    expect(res.assignments).toContainEqual({ id: "c", cluster: 0 })
    expect(res.assignments).toContainEqual({ id: "d", cluster: 1 })
    expect(res.assignments).toContainEqual({ id: "e", cluster: 0 })
    expect(res.assignments).toContainEqual({ id: "f", cluster: 0 })
    expect(res.assignments).toContainEqual({ id: "g", cluster: 1 })
    expect(res.assignments).toContainEqual({ id: "h", cluster: 0 })
    expect(res.count).toEqual(2)
  })

  test("can create sensisble clusters (2D)", () => {
    const res = cluster({
      clusterSize: 2,
      elements: [
        // The y term should dominate
        { id: "a", values: { "x": 30, y: 10 } },
        { id: "b", values: { "x": 20, y: 200 } },
        { id: "c", values: { "x": 11, y: 20 } },
        { id: "d", values: { "x": 30, y: 199 } },
      ],
      keys: ["x", "y"],
    })

    expect(res.assignments).toContainEqual({ id: "a", cluster: 0 })
    expect(res.assignments).toContainEqual({ id: "b", cluster: 1 })
    expect(res.assignments).toContainEqual({ id: "c", cluster: 0 })
    expect(res.assignments).toContainEqual({ id: "d", cluster: 1 })
    expect(res.count).toEqual(2)
  })

  test("handles an empty array", () => {
    const res = cluster({
      clusterSize: 1,
      elements: [],
      keys: [],
    })

    expect(res.assignments).toEqual([])
    expect(res.count).toEqual(0)
  })
})