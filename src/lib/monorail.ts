import BezierEasing from './bezier-easing';

import {
  AnimationData,
  Easing,
  parse,
  PropertyKeyframes,
  Color,
} from './parser';
import { getScales } from './utils';

export type Vector = { x: number; y: number };

type Segment = {
  start: number;
  end: number;
  easing: Easing;
  // CSS property details
  name: string;
  startValue: number;
  endValue: number;
  rgbaStartValue?: Color;
  rgbaEndValue?: Color;
  unit?: string;
  scale: number;
  curve: Vector[];
};

type Properties = {
  name: string;
  color: string;
  // SVG path details
  line: string;
  fill: string;
  segments: Segment[];
}[];

export type MinMax = { min: number; max: number };

type Options = {
  height?: number;
  colors?: string[];
  playbackSpeed?: number;
};

const getCurve = (
  start: number,
  end: number,
  startValue: number,
  endValue: number,
  easing: Easing = [0.42, 0, 0.58, 1]
) => {
  const duration = end - start;
  const valueSpan = endValue - startValue;

  return [
    { x: start, y: startValue },
    {
      x: start + duration * easing[0],
      y: startValue + valueSpan * easing[1],
    },
    {
      x: start + duration * easing[2],
      y: startValue + valueSpan * easing[3],
    },
    { x: end, y: endValue },
  ];
};

const DEFAULT_COLORS = [
  'var(--monorail-green)',
  'var(--monorail-blue)',
  'var(--monorail-purple)',
  'var(--monorail-yellow)',
  'var(--monorail-orange)',
  'var(--monorail-red)',
];

// TODO handle opacity and filter-opacity

export class Monorail {
  animation: CSSAnimation;
  animationData: AnimationData;
  height: number;
  heightNegative: number;
  totalHeight: number;
  scales: Record<string, number>;
  properties: Properties;
  playbackSpeed: number;
  isPlaying: boolean = false;
  isDragging: boolean = false;
  colors: string[];
  colorIndex: number = 0;
  // DOM
  svg: SVGElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  );
  playPauseButton: HTMLButtonElement = document.createElement('button');
  tooltip: HTMLDivElement = document.createElement('div');
  element: HTMLDivElement = document.createElement('div');
  valuesDivs: Record<string, HTMLDivElement> = {};

  constructor(animation: CSSAnimation, options: Options = {}) {
    const { height = 30, colors = DEFAULT_COLORS, playbackSpeed = 1 } = options;

    this.colors = colors;
    this.height = height;
    this.playbackSpeed = playbackSpeed;

    this.animation = animation;
    this.animation = this.animation;
    this.animationData = parse(this.animation);

    const minMax = this.getMinMaxValues();

    this.scales = getScales(height, minMax);

    // scale * min
    let globalMinimum = 0;

    for (const key in this.scales) {
      if (minMax[key].min * this.scales[key] < globalMinimum) {
        globalMinimum = minMax[key].min * this.scales[key];
      }
    }

    this.heightNegative = Math.abs(globalMinimum) + 2;
    this.totalHeight = height + this.heightNegative;

    this.svg.setAttribute('viewBox', `0 0 100 ${this.totalHeight}`);
    this.svg.setAttribute('fill', 'none');

    this.properties = [
      ...this.prepareAnimation(this.animationData.transform),
      ...this.prepareAnimation(this.animationData.filter),
      ...this.prepareAnimation(this.animationData.numeric),
      ...this.prepareAnimation(this.animationData.colors),
    ];

    this.playPauseButton.innerHTML = [
      '<span class="monorail-play">⏵ Play</span>',
      '<span class="monorail-pause">⏸ Pause</span>',
    ].join('\n');
    this.playPauseButton.classList.add('monorail-play-pause-button');

    this.buildTooltip();
    this.renderGraph();

    const timeline = document.createElement('div');
    timeline.classList.add('monorail-timeline');
    timeline.innerHTML = [
      '<div><span>0</span></div>',
      '<div><span>50</span></div>',
      '<div><span>100</span></div>',
    ].join('\n');

    this.element.classList.add('monorail');
    this.element.replaceChildren(
      this.svg,
      timeline,
      this.playPauseButton,
      this.tooltip
    );
  }

  getMinMaxValues = () => {
    const { transform, numeric, filter, colors } = this.animationData;
    const properties = [
      ...Object.keys(transform).map((key) => transform[key]),
      ...Object.keys(numeric).map((key) => numeric[key]),
      ...Object.keys(filter).map((key) => filter[key]),
      ...Object.keys(colors).map((key) => colors[key]),
    ];
    const minMax: Record<string, MinMax> = {};

    properties.forEach(({ name, keyframes }) => {
      keyframes.forEach((frame) => {
        minMax[name] = minMax[name] || { min: frame.value, max: frame.value };
        minMax[name].min = Math.min(minMax[name].min, frame.value);
        minMax[name].max = Math.max(minMax[name].max, frame.value);
      });
    });

    return minMax;
  };

  prepareAnimation = (data: Record<string, PropertyKeyframes>): Properties => {
    return Object.keys(data).map((key) => {
      const property = data[key];

      const segments: Segment[] = [];

      for (let i = 0; i < property.keyframes.length - 1; i++) {
        const frame = property.keyframes[i];
        const nextFrame = property.keyframes[i + 1];

        const curve = getCurve(
          frame.key,
          nextFrame.key,
          frame.value,
          nextFrame.value,
          frame.easing
        );

        segments.push({
          start: frame.key,
          end: nextFrame.key,
          easing: frame.easing,
          name: property.name,
          startValue: frame.value,
          endValue: nextFrame.value,
          rgbaStartValue: 'rgba' in frame ? frame.rgba : undefined,
          rgbaEndValue: 'rgba' in nextFrame ? nextFrame.rgba : undefined,
          unit: 'unit' in frame ? frame.unit || nextFrame.unit : '',
          scale: this.scales[property.name],
          curve,
        });
      }

      const { height } = this;

      const scale = this.scales[property.name];
      const start = {
        x: segments[0].curve[0].x.toFixed(1),
        y: (height - segments[0].curve[0].y * scale).toFixed(1),
      };
      const color = this.colors[this.colorIndex++ % this.colors.length];

      const d =
        `M ${start.x} ${start.y} ` +
        segments
          .map((segment) => {
            const scaledPoints = segment.curve.slice(1).map((point) => ({
              x: point.x.toFixed(1),
              y: (height - point.y * scale).toFixed(1),
            }));
            const [c1, c2, p2] = scaledPoints;

            return `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
          })
          .join(' ');

      const line = `<path vector-effect="non-scaling-stroke" stroke="${color}" d="${d}" />`;
      const fill = `<path fill="${color}" d="${d} V ${height} H ${start.x} Z" />`;

      return {
        name: property.name,
        line,
        fill,
        color,
        segments,
      };
    });
  };

  getPoint = (p: Vector, scale: number, color: string) => {
    const { height } = this;
    const y = (height - p.y * scale).toFixed(1);
    const x = p.x.toFixed(1);
    return `<path stroke="${color}" d="M ${x} ${y} h 0.01" vector-effect="non-scaling-stroke"/>`;
  };

  renderGraph = () => {
    const { svg, height: h, totalHeight: th, properties } = this;

    this.tooltip.classList.add('monorail-tooltip');

    const pointsHTML: string[] = [];
    const linesHTML: string[] = [];
    const fillHTML: string[] = [];

    // Curves and points

    properties.forEach((property) => {
      const { line, fill } = property;
      linesHTML.push(line);
      fillHTML.push(fill);

      property.segments.forEach((segment, i) => {
        const { color } = property;
        const { curve, scale } = segment;

        if (i === 0) {
          pointsHTML.push(this.getPoint(curve[0], scale, color));
        }

        pointsHTML.push(this.getPoint(curve[curve.length - 1], scale, color));
      });
    });

    const currentTimeAxis = [
      `<g class="monorail-current-time">`,
      `  <polyline class="monorail-current-time-line"  vector-effect="non-scaling-stroke" points="0,0 0,${th}" />`,
      `  <path     class="monorail-current-time-point" vector-effect="non-scaling-stroke" d="M 0 0 h 0.01"/>`,
      `  <path     class="monorail-current-time-point" vector-effect="non-scaling-stroke" d="M 0 ${th} h 0.01"/>`,
      `</g>`,
    ].join('\n');

    // Zero line
    const zeroLine = `<polyline class="monorail-zero-line" vector-effect="non-scaling-stroke" points="0,${h} 100,${h}" />`;

    const notches = [0, 25, 50, 75, 100]
      .map((x) => {
        return `<polyline class="monorail-notch" vector-effect="non-scaling-stroke" points="${x},${th} ${x},${h}" />`;
      })
      .join('\n');

    // Invisible area for better hover
    const hoverHelper = `<rect x="-10" y="0" width="120" height="${th}" />`;

    svg.innerHTML += hoverHelper;
    svg.innerHTML += `<g class="monorail-fills">${fillHTML.join('\n')}</g>`;
    svg.innerHTML += `<g class="monorail-notches">${notches}</g>`;
    svg.innerHTML += zeroLine;
    svg.innerHTML += `<g class="monorail-lines">${linesHTML.join('\n')}</g>`;
    svg.innerHTML += `<g class="monorail-points">${pointsHTML.join('\n')}</g>`;
    svg.innerHTML += currentTimeAxis;

    const axis = svg.querySelector('.monorail-current-time') as SVGGElement;

    this.addEvents(axis);
  };

  buildTooltip = () => {
    const { properties, tooltip } = this;
    let longestColorName = 0;
    let longestPropName = 0;

    const html = properties.map((property) => {
      if (property.name.length > longestPropName) {
        longestPropName = property.name.length;
      }
      if (property.segments[0].rgbaStartValue) {
        if (property.name.length > longestColorName) {
          longestColorName = property.name.length;
        }
      }

      return [
        `<div style="color: ${property.color}">`,
        `<div>${property.name}</div>`,
        `<div class="monorail-tooltip-value-${property.name}"></div>`,
        `</div>`,
      ].join('\n');
    });

    // Manually selected minimum width to fit the color name and value
    // Value looks like this: rgb(255 255 255 / 0.99) [swatch]
    if (longestColorName > 0) {
      this.tooltip.style.setProperty(
        '--monorail-tooltip-min-width',
        `${longestColorName + 29}ch`
      );
    } else {
      this.tooltip.style.setProperty(
        '--monorail-tooltip-min-width',
        `${longestColorName + 12}ch`
      );
    }

    tooltip.innerHTML =
      '<div class="monorail-tooltip-value-percentage">0.0%</div>' +
      html.join('');

    this.valuesDivs = {
      percentage: tooltip.querySelector(
        '.monorail-tooltip-value-percentage'
      ) as HTMLDivElement,
    };

    properties.forEach((property) => {
      this.valuesDivs[property.name] = tooltip.querySelector(
        `.monorail-tooltip-value-${property.name}`
      ) as HTMLDivElement;
    });

    this.updateTooltip(0, 0);
  };

  updateTooltip = (offsetX: number, xPercentage: number) => {
    this.properties.forEach((property) => {
      for (const segment of property.segments) {
        const isInSegment =
          xPercentage >= segment.start && xPercentage < segment.end;
        const isAtEnd = xPercentage === 100 && xPercentage === segment.end;

        if (isInSegment || isAtEnd) {
          const e = BezierEasing(...segment.easing);

          if (segment.rgbaStartValue && segment.rgbaEndValue) {
            const { start, end, rgbaStartValue, rgbaEndValue } = segment;
            const t = (xPercentage - start) / (end - start);
            const easing = e(t);

            const { r: r1, g: g1, b: b1, a: a1 } = rgbaStartValue;
            const { r: r2, g: g2, b: b2, a: a2 } = rgbaEndValue;

            // If the animation is going to transparent
            // Only opacity should be interpolated
            const toTransparent = a2 === 0;

            const r = toTransparent ? r1 : Math.round(r1 + (r2 - r1) * easing);
            const g = toTransparent ? g1 : Math.round(g1 + (g2 - g1) * easing);
            const b = toTransparent ? b1 : Math.round(b1 + (b2 - b1) * easing);
            const a = Number((a1 + (a2 - a1) * easing).toFixed(2));

            const cssColor = `rgb(${r} ${g} ${b} / ${a})`;
            const swatch = `<span style="background-color: ${cssColor};" class="monorail-color-swatch"></span>`;

            this.valuesDivs[property.name].innerHTML = `${cssColor}${swatch}`;
            return;
          } else {
            const { start, end, startValue, endValue, unit } = segment;

            const t = (xPercentage - start) / (end - start);
            const value = startValue + (endValue - startValue) * e(t);

            const valueString = +value.toFixed(2);

            this.valuesDivs[property.name].innerHTML = `${valueString}${unit}`;
            return;
          }
        }
      }
    });

    this.valuesDivs.percentage.innerHTML = `${xPercentage.toFixed(1)}%`;
    this.tooltip.style.setProperty(
      '--monorail-tooltip-x',
      `${offsetX.toFixed(1)}px`
    );
    this.tooltip.style.setProperty(
      '--monorail-tooltip-margin',
      `-${xPercentage.toFixed(1)}%`
    );
  };

  update = (axis: SVGGElement, offsetX: number, moveAnimation = true) => {
    const { svg, animation } = this;

    if (offsetX < 0) {
      offsetX = 0;
    } else if (offsetX > svg.clientWidth) {
      offsetX = svg.clientWidth;
    }

    const progress = offsetX / svg.clientWidth;
    let xPercentage = progress * 100;
    // Round to 0.1
    xPercentage = Math.round(xPercentage / 0.1) * 0.1;

    axis.setAttribute('transform', `translate(${xPercentage.toFixed(1)} 0)`);

    const duration = (animation.effect as KeyframeEffect).getTiming()
      .duration as number;

    if (moveAnimation) {
      animation.currentTime = duration * progress;
      animation.pause();
    }

    this.updateTooltip(offsetX, xPercentage);
  };

  play = (axis: SVGGElement) => {
    this.isPlaying = true;
    this.element.classList.add('monorail-playing');

    const { svg, animation, playbackSpeed } = this;
    const duration = (animation.effect as KeyframeEffect).getTiming()
      .duration as number;

    let start = performance.now();

    const update = () => {
      const currentTime = performance.now();
      const elapsed = (currentTime - start) * playbackSpeed;
      const progress = elapsed / duration;

      this.update(axis, progress * svg.clientWidth, true);

      if (progress >= 1 || !this.isPlaying) {
        this.pause();
        return;
      }

      requestAnimationFrame(() => {
        update();
      });
    };

    update();
  };

  pause = () => {
    this.isPlaying = false;
    this.animation.pause();
    this.element.classList.remove('monorail-playing');
  };

  addEvents = (axis: SVGGElement) => {
    const { svg, playPauseButton } = this;

    // Play pause

    playPauseButton.addEventListener('click', () => {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play(axis);
      }
    });

    // Mouse events

    svg.addEventListener('mousedown', (e) => {
      this.pause();
      const offsetX = e.offsetX;
      this.update(axis, offsetX);
      this.isDragging = true;
    });

    svg.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const offsetX = e.offsetX;
        this.update(axis, offsetX);
      }
    });

    document.addEventListener('mouseup', this.handleMouseUp);

    // Touch events

    let touchStart: Vector;

    svg.addEventListener('touchstart', (e) => {
      this.pause();
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    });

    svg.addEventListener('touchmove', (e) => {
      const current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      const deltaX = Math.abs(current.x - touchStart.x);
      const deltaY = Math.abs(current.y - touchStart.y);

      if (deltaX > deltaY && deltaX > 5) {
        e.preventDefault();
        const offsetX = e.touches[0].clientX - svg.getBoundingClientRect().left;
        this.update(axis, offsetX);
      }
    });
  };

  handleMouseUp = () => {
    this.isDragging = false;
  };

  destroy = () => {
    // Destroying all references
    // This will also clean up the event listeners
    this.element.innerHTML = '';
    this.element.remove();
    this.svg = null as any;
    this.playPauseButton = null as any;
    this.tooltip = null as any;
    this.element = null as any;
    this.valuesDivs = {};

    document.removeEventListener('mouseup', this.handleMouseUp);
  };
}
