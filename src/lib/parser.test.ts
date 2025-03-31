import { test, expect, vi } from 'vitest';
import { createCanvas } from 'canvas';

import {
  AnimationData,
  Color,
  Easing,
  parseKeyframes,
  RGBAtoNumber,
} from './parser';

const EXAMPLE_EASING: Easing = [0.165, 0.84, 0.44, 1];

const EXAMPLE_PADDING_KEYFRAMES = [
  {
    key: 0,
    value: 0,
    unit: 'px',
    easing: EXAMPLE_EASING,
  },
  {
    key: 20,
    value: 50,
    unit: 'px',
    easing: EXAMPLE_EASING,
  },
  {
    key: 100,
    value: 0,
    unit: 'px',
    easing: EXAMPLE_EASING,
  },
];

const expectedResult: AnimationData = {
  name: 'example',
  transform: {
    translateX: {
      name: 'translateX',
      keyframes: [
        {
          key: 0,
          value: 50,
          unit: 'px',
          easing: EXAMPLE_EASING,
        },
        {
          key: 40,
          value: 0,
          unit: '',
          easing: [0, 0, 1, 1],
        },
        {
          key: 60,
          value: 0,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 80,
          value: 0,
          unit: 'px',
          easing: EXAMPLE_EASING,
        },
        {
          key: 100,
          value: 50,
          unit: 'px',
          easing: EXAMPLE_EASING,
        },
      ],
    },
    skew: {
      name: 'skew',
      keyframes: [
        {
          key: 0,
          value: 0,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 40,
          value: 25,
          unit: 'deg',
          easing: [0, 0, 1, 1],
        },
        {
          key: 60,
          value: -25,
          unit: 'deg',
          easing: EXAMPLE_EASING,
        },
        {
          key: 80,
          value: 0,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 100,
          value: 0,
          unit: '',
          easing: EXAMPLE_EASING,
        },
      ],
    },
    scale: {
      name: 'scale',
      keyframes: [
        {
          key: 0,
          value: 1,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 40,
          value: 1,
          unit: '',
          easing: [0, 0, 1, 1],
        },
        {
          key: 60,
          value: 1,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 80,
          value: 2,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 100,
          value: 1,
          unit: '',
          easing: EXAMPLE_EASING,
        },
      ],
    },
  },
  filter: {
    invert: {
      name: 'invert',
      keyframes: [
        {
          key: 0,
          value: 0,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 60,
          value: 1,
          unit: '',
          easing: EXAMPLE_EASING,
        },
        {
          key: 100,
          value: 0,
          unit: '',
          easing: EXAMPLE_EASING,
        },
      ],
    },
  },
  colors: {
    color: {
      name: 'color',
      keyframes: [
        {
          key: 0,
          rgba: { r: 85, g: 102, b: 255, a: 0.7 },
          easing: EXAMPLE_EASING,
          value: 0,
          unit: '',
        },
        {
          key: 80,
          rgba: { r: 255, g: 165, b: 0, a: 1 },
          easing: EXAMPLE_EASING,
          value: 0,
          unit: '',
        },
        {
          key: 100,
          rgba: { r: 85, g: 102, b: 255, a: 0.7 },
          easing: EXAMPLE_EASING,
          value: 0,
          unit: '',
        },
      ],
    },
    backgroundColor: {
      name: 'backgroundColor',
      keyframes: [
        {
          key: 0,
          rgba: { r: 0, g: 0, b: 0, a: 0 },
          easing: EXAMPLE_EASING,
          value: 0,
          unit: '',
        },
        {
          key: 60,
          rgba: { r: 255, g: 255, b: 0, a: 1 },
          easing: EXAMPLE_EASING,
          value: 0,
          unit: '',
        },
        {
          key: 100,
          rgba: { r: 0, g: 0, b: 0, a: 0 },
          easing: EXAMPLE_EASING,
          value: 0,
          unit: '',
        },
      ],
    },
  },
  numeric: {
    paddingLeft: {
      name: 'paddingLeft',
      keyframes: EXAMPLE_PADDING_KEYFRAMES,
    },
    paddingBottom: {
      name: 'paddingBottom',
      keyframes: EXAMPLE_PADDING_KEYFRAMES,
    },
    paddingRight: {
      name: 'paddingRight',
      keyframes: EXAMPLE_PADDING_KEYFRAMES,
    },
    paddingTop: {
      name: 'paddingTop',
      keyframes: EXAMPLE_PADDING_KEYFRAMES,
    },
  },
};

Object.keys(expectedResult.colors).forEach((key) => {
  expectedResult.colors[key].keyframes.forEach((frame) => {
    if (frame.rgba) {
      frame.value = RGBAtoNumber(frame.rgba);
    }
  });
});

const input: ComputedKeyframe[] = [
  {
    composite: 'auto',
    easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    offset: 0,
    computedOffset: 0,
    color: 'rgba(85, 102, 255, 0.7)',
    filter: 'none',
    transform: 'translateX(50px)',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingTop: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  {
    composite: 'auto',
    easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    offset: 0.20000000298023224,
    computedOffset: 0.20000000298023224,
    paddingLeft: '50px',
    paddingBottom: '50px',
    paddingRight: '50px',
    paddingTop: '50px',
  },
  {
    composite: 'auto',
    easing: 'linear',
    offset: 0.4000000059604645,
    computedOffset: 0.4000000059604645,
    transform: 'skew(25deg)',
  },
  {
    composite: 'auto',
    easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    offset: 0.6000000238418579,
    computedOffset: 0.6000000238418579,
    filter: 'invert(1)',
    backgroundColor: 'yellow',
    transform: 'skew(-25deg)',
  },
  {
    composite: 'auto',
    easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    offset: 0.800000011920929,
    computedOffset: 0.800000011920929,
    transform: 'translateX(0px) scale(2)',
    color: 'orange',
  },
  {
    composite: 'auto',
    easing: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
    offset: 1,
    computedOffset: 1,
    color: 'rgba(85, 102, 255, 0.7)',
    filter: 'none',
    transform: 'translateX(50px)',
    paddingBottom: '0px',
    paddingLeft: '0px',
    paddingRight: '0px',
    paddingTop: '0px',
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
];

// Global mock setup
vi.stubGlobal('document', {
  createElement: () => {
    const canvas = createCanvas(1, 1);

    return {
      width: 1,
      height: 1,
      getContext: () => canvas.getContext('2d'),
    };
  },
});

test('parser', () => {
  const createElementSpy = vi
    .spyOn(document, 'createElement')
    .mockImplementation(() => {
      const canvas = createCanvas(1, 1);
      return canvas as unknown as HTMLCanvasElement;
    });

  const keyframes = parseKeyframes(input);
  const result = {
    name: 'example',
    ...keyframes,
  };

  expect(createElementSpy).toHaveBeenCalledWith('canvas');

  expect(result.transform).toEqual(expectedResult.transform);

  expect(result.filter).toEqual(expectedResult.filter);

  expect(result.numeric).toEqual(expectedResult.numeric);

  Object.keys(result.colors).forEach((key) => {
    result.colors[key].keyframes.forEach((frame, index) => {
      const expectedFrame = expectedResult.colors[key].keyframes[index];

      expect(frame.key).toEqual(expectedFrame.key);
      expect(frame.easing).toEqual(expectedFrame.easing);
      expect(Math.abs(frame.value - expectedFrame.value)).toBeLessThanOrEqual(
        1
      );

      const rgba1 = frame.rgba as Color;
      const rgba2 = expectedFrame.rgba as Color;

      expect(Math.abs(rgba1.r - rgba2.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(rgba1.g - rgba2.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(rgba1.b - rgba2.b)).toBeLessThanOrEqual(1);
      expect(Math.abs(rgba1.a - rgba2.a)).toBeLessThanOrEqual(1);
    });
  });
});
