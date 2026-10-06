// Mulberry32 PRNG
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let seed = 123456789;
let random = mulberry32(seed);

export function setSeed(newSeed: number) {
  seed = newSeed;
  random = mulberry32(seed);
}

export function getSeed() {
  return seed;
}

export function nextRandom() {
  return random();
}

/**
 * Returns a random integer between min and max (inclusive)
 */
export function nextInt(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}
