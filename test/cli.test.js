import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const run = (...args) => spawnSync(process.execPath, ['dist/cli.js', ...args], { encoding: 'utf8' });

test('D300 rpm1500 gives 23.5619 m/s', () => {
  const r = run('--diameter', '300', '--rpm', '1500');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Peripheral speed: 23\.5619 m\/s/);
  assert.equal(r.stderr, '');
});
test('D400 speed35 gives 1671.1269 rpm', () => {
  const r = run('--diameter', '400', '--speed', '35');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /1671\.1269 rpm/);
});
test('D300 rpm1500 work-speed20 gives ratio 70.6858', () => {
  const r = run('--diameter', '300', '--rpm', '1500', '--work-speed', '20');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Speed ratio q: 70\.6858/);
});
test('overspeed prints results and warning, exits 2', () => {
  const r = run('--diameter', '500', '--rpm', '1500', '--max-speed', '35', '--json');
  assert.equal(r.status, 2);
  assert.equal(JSON.parse(r.stdout).speedMps, 39.2699);
  assert.equal(JSON.parse(r.stdout).status, 'OVERSPEED');
  assert.match(r.stderr, /WARNING: OVERSPEED/);
});
test('D250 rpm2850 max40 gives OK and margin 2.6936', () => {
  const r = run('--diameter', '250', '--rpm', '2850', '--max-speed', '40');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /37\.3064 m\/s/);
  assert.match(r.stdout, /OK:.*margin 2\.6936 m\/s/);
  assert.equal(r.stderr, '');
});
for (const args of [
  ['--diameter', '0', '--rpm', '1500'],
  ['--diameter', '300', '--rpm', '1500', '--speed', '30'],
  ['--diameter', '300'],
  ['--diameter', '300', '--rpm', 'abc'],
  ['--diameter', '300', '--rpm', '1500', '--decimals', '9'],
  ['--rpm', '1500'],
  ['--diameter', '-1', '--rpm', '1500'],
  ['--diameter', '300', '--rpm', '0'],
  ['--diameter', '300', '--speed', 'Infinity'],
  ['--diameter', '300', '--speed', 'NaN'],
  ['--diameter', '300', '--speed', '20', '--max-speed', '-1'],
  ['--diameter', '300', '--speed', '20', '--work-speed', '0'],
  ['--diameter', '300', '--speed', '20', '--decimals', '1.5'],
  ['--diameter', '300', '--rpm'],
  ['--diameter', '300', '--rpm', '1500', '--unknown'],
  ['--diameter', '300', '--rpm', '1500', '--rpm', '2000']
]) test(`rejects invalid arguments: ${args.join(' ')}`, () => {
  const r = run(...args);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Error:/);
  assert.equal(r.stdout, '');
});
test('help works without required arguments', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage:/);
});
test('JSON supports optional ratio and precision', () => {
  const r = run('--diameter', '300', '--rpm', '1500', '--work-speed', '20', '--json');
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).speedRatio, 70.6858);
  const text = run('--diameter', '300', '--rpm', '1500', '--decimals', '0');
  assert.match(text.stdout, /Peripheral speed: 24 m\/s/);
});
test('equal rated speed is OK and comparison uses unrounded speed', () => {
  const r = run('--diameter', '300', '--speed', '35', '--max-speed', '35', '--json');
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).marginMps, 0);
  const over = run('--diameter', '300', '--speed', '35.00001', '--max-speed', '35');
  assert.equal(over.status, 2);
});
