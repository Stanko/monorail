export type Color = { r: number; g: number; b: number; a: number };

export type Easing = [number, number, number, number];

export type PropertyKeyframe = {
  key: number;
  value: number;
  unit: string;
  easing: Easing;
  rgba?: Color;
};

export type PropertyKeyframes = {
  name: string;
  keyframes: PropertyKeyframe[];
};

export type KeyframesData = {
  transform: Record<string, PropertyKeyframes>;
  filter: Record<string, PropertyKeyframes>;
  colors: Record<string, PropertyKeyframes>;
  numeric: Record<string, PropertyKeyframes>;
};

export type AnimationData = KeyframesData & {
  name: string;
};

// ----- CONSTANTS ----- //

export const EASINGS: Record<string, Easing> = {
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  linear: [0, 0, 1, 1],
};

const DEFAULT_VALUES: Record<string, number> = {
  // Transform
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  skew: 0,
  skewX: 0,
  skewY: 0,
  // Filter
  blur: 0,
  brightness: 0,
  contrast: 0,
  grayscale: 0,
  'hue-rotate': 0,
  invert: 0,
  opacity: 1,
  saturate: 0,
  sepia: 0,
};

// Parsers for filter and transform properties
// because they can have multiple values and require special parsing

const SUPPORTED_TRANSFORMS = [
  'rotate',
  'rotateX',
  'rotateY',
  'rotateZ',
  'translateX',
  'translateY',
  'translateZ',
  'scale',
  'scaleX',
  'scaleY',
  'scaleZ',
  'skew',
  'skewX',
  'skewY',
].join('|');

const SUPPORTED_COLORS = [
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'columnRuleColor',
  'outlineColor',
  'textDecorationColor',
  'textEmphasisColor',
  'textFillColor',
  'textStrokeColor',
  'fill',
  'stroke',
];

const TRANSFORM_REGEXP = new RegExp(
  [
    `(?<name>${SUPPORTED_TRANSFORMS})`,
    `\\(`,
    `(?<value>\-?\\d*(?:\\.\\d*)?)`, // value
    `(?<unit>\\w*?)`, // unit if any
    `\\)`,
  ].join(''),
  'g'
);

const SUPPORTED_FILTERS = [
  'blur',
  'brightness',
  'contrast',
  'grayscale',
  'hue-rotate',
  'invert',
  'opacity',
  'saturate',
  'sepia',
].join('|');

const FILTER_REGEXP = new RegExp(
  [
    `(?<name>${SUPPORTED_FILTERS})`,
    `\\(`,
    `(?<value>\-?\\d*(?:\\.\\d*)?)`, // value
    `(?<unit>\\w*?)`, // unit if any
    `\\)`,
  ].join(''),
  'g'
);

type ParsedFilterOrTransform = {
  value: number;
  unit: string;
  name: string;
};

// Parses the value of filter or transform properties
const parseComplexProperties = (
  value: string,
  regex: RegExp
): Record<string, ParsedFilterOrTransform> => {
  const matches = [...value.matchAll(regex)];
  const result: Record<string, ParsedFilterOrTransform> = {};

  matches.forEach((match) => {
    // TypeScript needs a type assertion here to recognize named capture groups
    if (!match.groups) {
      return;
    }

    const { name, value, unit } = match.groups;

    result[name] = {
      name,
      value: parseFloat(value),
      unit,
    };
  });

  return result;
};

// Map of parsers
const cssPropertyParsers: Record<
  string,
  (value: string) => Record<string, ParsedFilterOrTransform>
> = {
  transform: (value: string) => parseComplexProperties(value, TRANSFORM_REGEXP),
  filter: (value: string) => parseComplexProperties(value, FILTER_REGEXP),
};

// Extract unit from CSS value (e.g. '10px' -> 'px')
// Very naive implementation, which just extracts the first word it finds
const extractUnitFromCSSValue = (value: string): string => {
  const match = value.toLowerCase().match(/[a-z]+/);

  return match ? match[0] : '';
};

const getRGBA = (color: string, ctx: CanvasRenderingContext2D): Color => {
  ctx.fillStyle = color;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b, a: parseFloat((a / 255).toFixed(3)) };
};

export const RGBAtoNumber = (rgba: Color): number => {
  const { r, g, b, a } = rgba;
  return (r * 1000 + g * 100 + b * 10 + a * 255) / 10000;
};

const parseEasing = (easing: string): Easing => {
  if (EASINGS[easing]) {
    return EASINGS[easing];
  }

  // This string is always going to be in the format 'cubic-bezier(x, x, x, x)'
  return easing
    .replace('cubic-bezier(', '')
    .replace(')', '')
    .split(',')
    .map(parseFloat) as Easing;
};

export const getCanvasContext2D = (): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  return canvas.getContext('2d', {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
};

export const parseKeyframes = (input: ComputedKeyframe[]): KeyframesData => {
  const result: KeyframesData = {
    transform: {},
    filter: {},
    colors: {},
    numeric: {},
  };

  const ctx = getCanvasContext2D();

  // Generic property categorization and initialization
  const categorizeProperty = (propertyName: string, value: string) => {
    // Special parsing for transform and filter
    if (propertyName === 'transform' || propertyName === 'filter') {
      const parsedProperties = cssPropertyParsers[propertyName](value);

      Object.keys(parsedProperties).forEach((name) => {
        result[propertyName][name] = {
          name,
          keyframes: [],
        };
      });

      return;
    }

    // Color properties
    if (SUPPORTED_COLORS.includes(propertyName)) {
      result.colors[propertyName] = {
        name: propertyName,
        keyframes: [],
      };
      return;
    }

    // Numeric properties
    const parsedValue = parseFloat(value);

    if (!isNaN(parsedValue)) {
      result.numeric[propertyName] = {
        name: propertyName,
        keyframes: [],
      };
    }
  };

  // First pass: categorize and initialize properties
  input.forEach((frame) => {
    const { offset, computedOffset, composite, easing, ...keyframeProperties } =
      frame;

    Object.keys(keyframeProperties).forEach((propertyName) => {
      const value = keyframeProperties[propertyName];

      if (value) {
        categorizeProperty(propertyName, value.toString());
      }
    });
  });

  // Second pass: populate keyframes
  input.forEach((frame) => {
    const { offset, computedOffset, composite, easing, ...keyframeProperties } =
      frame;
    const key = parseFloat((computedOffset * 100).toFixed(3));

    // Process transforms and filters
    (['transform', 'filter'] as const).forEach((type) => {
      Object.keys(result[type]).forEach((currentProperty) => {
        const value = keyframeProperties[type];

        if (!value) {
          return;
        }

        const propertiesInThisFrame = cssPropertyParsers[type](
          value.toString()
        );

        // Default value if not found
        const item = {
          key,
          value: DEFAULT_VALUES[currentProperty],
          unit: '',
          easing: parseEasing(frame.easing),
        };

        const found = propertiesInThisFrame[currentProperty];

        // If found, use the parsed value
        if (found) {
          item.value = found.value;
          item.unit = found.unit;
        }

        result[type][currentProperty].keyframes.push(item);
      });
    });

    // Process color properties
    Object.keys(result.colors).forEach((currentProperty) => {
      const value = keyframeProperties[currentProperty];

      if (!value) {
        return;
      }

      const rgba = getRGBA(value.toString(), ctx);
      const item: PropertyKeyframe = {
        key,
        rgba,
        easing: parseEasing(frame.easing),
        value: RGBAtoNumber(rgba),
        unit: '',
      };

      result.colors[currentProperty].keyframes.push(item);
    });

    // Process numeric properties
    Object.keys(result.numeric).forEach((currentProperty) => {
      const value = keyframeProperties[currentProperty];

      if (typeof value === 'string') {
        const parsedValue = parseFloat(value);

        const item: PropertyKeyframe = {
          key,
          value: parsedValue,
          unit: extractUnitFromCSSValue(value),
          easing: parseEasing(frame.easing),
        };

        result.numeric[currentProperty].keyframes.push(item);
      }
    });
  });

  return result;
};

export const parse = (animation: CSSAnimation): AnimationData => {
  if (!(animation?.effect instanceof KeyframeEffect)) {
    throw new Error('Only animations with KeyframeEffect are supported.');
  }

  const keyframes = animation.effect.getKeyframes();

  return {
    name: animation.animationName,
    ...parseKeyframes(keyframes),
  };
};
