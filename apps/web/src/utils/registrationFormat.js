export const buildExampleFromFormat = (format) => {
  if (!format || !Array.isArray(format.digit_groups) || format.digit_groups.length === 0) {
    return '';
  }
  let counter = 1;
  const segments = format.digit_groups.map((size) => {
    const numericSize = Number(size) || 0;
    if (numericSize <= 0) {
      return ''.padStart(Math.max(0, numericSize), 'X');
    }
    let segment = '';
    for (let index = 0; index < numericSize; index += 1) {
      segment += ((counter + index) % 10).toString();
    }
    counter += numericSize;
    return segment;
  });
  return segments
    .map((segment, index) => {
      if (index === 0) {
        return segment;
      }
      const separator = format.separators?.[index - 1] ?? '';
      return `${separator}${segment}`;
    })
    .join('');
};

export const buildPatternFromFormat = (format) => {
  if (!format || !Array.isArray(format.digit_groups) || format.digit_groups.length === 0) {
    return '';
  }
  let pattern = '^';
  format.digit_groups.forEach((size, index) => {
    const digits = Math.max(0, Number(size) || 0);
    pattern += `\\d{${digits}}`;
    if (index < (format.separators?.length || 0)) {
      const separator = format.separators[index] ?? '';
      pattern += separator.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    }
  });
  pattern += '$';
  return pattern;
};

export const computeFormattedLength = (format) => {
  if (!format || !Array.isArray(format.digit_groups)) {
    return 0;
  }
  const digits = format.digit_groups.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const separators = Array.isArray(format.separators) ? format.separators.length : 0;
  return digits + separators;
};

export const computeDigitTotal = (format) => {
  if (!format || !Array.isArray(format.digit_groups)) {
    return 0;
  }
  return format.digit_groups.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
};
