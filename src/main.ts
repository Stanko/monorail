import { Monorail } from './lib/monorail';

const animationDiv = document.querySelector('.animation') as HTMLDivElement;
let animation: CSSAnimation = animationDiv.getAnimations()[0] as CSSAnimation;

const monorail = new Monorail(animation);

const main = document.querySelector('main') as HTMLDivElement;

main.appendChild(monorail.element);
