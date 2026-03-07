

let sequentialCounter = 1000; // starting point for sequential IDs

function generateOrderId({ type = 'random', size = 6 } = {}) {
  if (![4, 6].includes(size)) {
    throw new Error('Size must be 4 or 6');
  }

  if (type === 'sequential') {
    sequentialCounter++;
    // Pad with leading zeros to match size
    return String(sequentialCounter).padStart(size, '0');
  }

  if (type === 'random') {
    const max = size === 4 ? 9999 : 999999;
    const min = size === 4 ? 1000 : 100000;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  throw new Error('Invalid type. Must be "sequential" or "random".');
}

module.exports = generateOrderId;