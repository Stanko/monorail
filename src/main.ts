import { Monorail } from './lib/monorail';
// import { Monorail } from '@stanko/monorail';
// import '@stanko/monorail/dist/monorail.css';

const animationDiv = document.querySelector('.animation') as HTMLDivElement;
let animation: CSSAnimation = animationDiv.getAnimations()[0] as CSSAnimation;

const monorail = new Monorail(animation, {
  playbackSpeed: 0.3,
});

const monorailWrapper = document.querySelector(
  '.monorail-wrapper'
) as HTMLDivElement;
monorailWrapper.appendChild(monorail.element);

const rangeInput = document.querySelector(
  '.playback-speed-input'
) as HTMLInputElement;
const rangeValue = document.querySelector(
  '.playback-speed-value'
) as HTMLSpanElement;

rangeInput.value = monorail.playbackSpeed.toString();
rangeValue.textContent = rangeInput.value + 'x';

rangeInput.addEventListener('input', () => {
  monorail.playbackSpeed = parseFloat(rangeInput.value);
  rangeValue.textContent = rangeInput.value + 'x';
});
