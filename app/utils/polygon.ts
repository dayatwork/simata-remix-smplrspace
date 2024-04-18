// Function to check if a point is inside a polygon using ray casting algorithm
type Point = {
  x: number;
  y: number;
};

type Polygon = Point[];

// =================================================================
// ============= Generate Random Point withing Polygon =============
// =================================================================

function isPointInsidePolygon(point: Point, polygon: Polygon) {
  let inside = false;
  const x = point.x,
    y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

// Function to generate a random point within a bounding box
function randomPointInBoundingBox(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
) {
  const x = Math.random() * (maxX - minX) + minX;
  const y = Math.random() * (maxY - minY) + minY;
  return { x, y };
}

// Generate a random point inside the polygon
export function randomPointInsidePolygon(polygon: Polygon) {
  // Calculate bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  polygon.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  // Generate random points until one is inside the polygon
  let point;
  do {
    point = randomPointInBoundingBox(minX, minY, maxX, maxY);
  } while (!isPointInsidePolygon(point, polygon));

  return point;
}

// =================================================================
// ================ Validate Polygon Corner Points  ================
// =================================================================
// Function to calculate the cross product of two vectors
function crossProduct(p1: Point, p2: Point, p3: Point) {
  const vector1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const vector2 = { x: p3.x - p2.x, y: p3.y - p2.y };
  return vector1.x * vector2.y - vector1.y * vector2.x;
}

// Function to check if the polygon is convex
function isConvex(polygon: Polygon) {
  const n = polygon.length;
  if (n < 3) return false;

  let sign = 0;
  for (let i = 0; i < n; i++) {
    const cp = crossProduct(
      polygon[i],
      polygon[(i + 1) % n],
      polygon[(i + 2) % n]
    );
    if (cp !== 0) {
      if (sign === 0) sign = cp > 0 ? 1 : -1;
      else if (sign !== (cp > 0 ? 1 : -1)) return false;
    }
  }

  return true;
}

// Function to check if any edges of the polygon intersect
function hasEdgeIntersections(polygon: Polygon) {
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const edge1Start = polygon[i];
    const edge1End = polygon[(i + 1) % n];

    for (let j = i + 2; j < n + i - 1; j++) {
      const edge2Start = polygon[j % n];
      const edge2End = polygon[(j + 1) % n];

      const cp1 = crossProduct(edge1Start, edge1End, edge2Start);
      const cp2 = crossProduct(edge1Start, edge1End, edge2End);

      if (cp1 * cp2 < 0) return true; // Edge intersection detected
    }
  }

  return false;
}

export function checkIsValidPolygon(polygon: Polygon) {
  const convex = isConvex(polygon);
  const edgeIntersected = hasEdgeIntersections(polygon);

  let invalidCause = "";
  if (!convex && edgeIntersected) {
    invalidCause = "Not convex and there are intersecting edges";
  } else if (convex && edgeIntersected) {
    invalidCause = "There are intersecting edges";
  } else if (!convex && !edgeIntersected) {
    invalidCause = "Not convex";
  }

  return {
    valid: convex && !edgeIntersected,
    invalidCause,
  };
}
