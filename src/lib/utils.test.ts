import { test, expect } from 'vitest';
import { roundToNiceValue, getScales } from './utils';

test('get scales', () => {
  const scales = getScales(100, {
    a: { min: -8, max: 8 },
    b: { min: -100, max: 50 },
    c: { min: 0, max: 90 },
    d: { min: -230, max: 230 },
  });

  const expected: Record<string, number> = {
    a: 10,
    b: 1,
    c: 10 / 9,
    d: 1 / 3,
  };

  expect(scales).toMatchObject(expected);
});

test('get scales 2', () => {
  const scales = getScales(30, {
    a: { min: -40, max: 0 },
  });

  const expected: Record<string, number> = {
    a: 0.75,
  };

  expect(scales).toMatchObject(expected);
});

test('nice value', () => {
  expect(roundToNiceValue(0)).toEqual(0);
  expect(roundToNiceValue(0.00001)).toEqual(0.5);
  expect(roundToNiceValue(0.1)).toEqual(0.5);
  expect(roundToNiceValue(0.2)).toEqual(0.5);
  expect(roundToNiceValue(0.3)).toEqual(0.5);
  expect(roundToNiceValue(0.4)).toEqual(0.5);
  expect(roundToNiceValue(0.45)).toEqual(0.5);
  expect(roundToNiceValue(0.5)).toEqual(0.5);
  expect(roundToNiceValue(0.6)).toEqual(1);
  expect(roundToNiceValue(0.7)).toEqual(1);
  expect(roundToNiceValue(0.8)).toEqual(1);
  expect(roundToNiceValue(0.9)).toEqual(1);
  expect(roundToNiceValue(0.95)).toEqual(1);
  expect(roundToNiceValue(1)).toEqual(1);
  expect(roundToNiceValue(3)).toEqual(5);
  expect(roundToNiceValue(4)).toEqual(5);
  expect(roundToNiceValue(5)).toEqual(5);
  expect(roundToNiceValue(7)).toEqual(10);
  expect(roundToNiceValue(9)).toEqual(10);

  expect(roundToNiceValue(10)).toEqual(10);
  expect(roundToNiceValue(15)).toEqual(20);
  expect(roundToNiceValue(20)).toEqual(20);
  expect(roundToNiceValue(25)).toEqual(30);
  expect(roundToNiceValue(30)).toEqual(30);
  expect(roundToNiceValue(35)).toEqual(40);
  expect(roundToNiceValue(40)).toEqual(40);
  expect(roundToNiceValue(45)).toEqual(50);
  expect(roundToNiceValue(50)).toEqual(50);
  expect(roundToNiceValue(55)).toEqual(60);
  expect(roundToNiceValue(60)).toEqual(60);
  expect(roundToNiceValue(65)).toEqual(70);
  expect(roundToNiceValue(70)).toEqual(70);
  expect(roundToNiceValue(75)).toEqual(80);
  expect(roundToNiceValue(80)).toEqual(80);
  expect(roundToNiceValue(85)).toEqual(90);
  expect(roundToNiceValue(90)).toEqual(90);
  expect(roundToNiceValue(95)).toEqual(100);
  expect(roundToNiceValue(100)).toEqual(100);

  expect(roundToNiceValue(100)).toEqual(100);
  expect(roundToNiceValue(150)).toEqual(200);
  expect(roundToNiceValue(200)).toEqual(200);
  expect(roundToNiceValue(250)).toEqual(300);
  expect(roundToNiceValue(300)).toEqual(300);
  expect(roundToNiceValue(350)).toEqual(400);
  expect(roundToNiceValue(400)).toEqual(400);
  expect(roundToNiceValue(450)).toEqual(500);
  expect(roundToNiceValue(500)).toEqual(500);
  expect(roundToNiceValue(550)).toEqual(600);
  expect(roundToNiceValue(600)).toEqual(600);
  expect(roundToNiceValue(650)).toEqual(700);
  expect(roundToNiceValue(700)).toEqual(700);
  expect(roundToNiceValue(750)).toEqual(800);
  expect(roundToNiceValue(800)).toEqual(800);
  expect(roundToNiceValue(850)).toEqual(900);
  expect(roundToNiceValue(900)).toEqual(900);
  expect(roundToNiceValue(950)).toEqual(1000);
  expect(roundToNiceValue(1000)).toEqual(1000);

  expect(roundToNiceValue(1000)).toEqual(1000);
  expect(roundToNiceValue(1500)).toEqual(2000);
  expect(roundToNiceValue(2000)).toEqual(2000);
  expect(roundToNiceValue(2500)).toEqual(3000);
  expect(roundToNiceValue(3000)).toEqual(3000);
  expect(roundToNiceValue(3500)).toEqual(4000);
  expect(roundToNiceValue(4000)).toEqual(4000);
  expect(roundToNiceValue(4500)).toEqual(5000);
  expect(roundToNiceValue(5000)).toEqual(5000);
  expect(roundToNiceValue(5500)).toEqual(6000);
  expect(roundToNiceValue(6000)).toEqual(6000);
  expect(roundToNiceValue(6500)).toEqual(7000);
  expect(roundToNiceValue(7000)).toEqual(7000);
  expect(roundToNiceValue(7500)).toEqual(8000);
  expect(roundToNiceValue(8000)).toEqual(8000);
  expect(roundToNiceValue(8500)).toEqual(9000);
  expect(roundToNiceValue(9000)).toEqual(9000);
  expect(roundToNiceValue(9500)).toEqual(10000);
  expect(roundToNiceValue(10000)).toEqual(10000);
});
