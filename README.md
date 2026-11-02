# Grinding wheel speed calculator

TypeScript CLI for grinding wheel peripheral speed and rated-speed checks
(砂轮线速度计算与安全校核). Requires Node.js 18 or newer. No runtime dependencies.

```sh
npm install
npm run build
node dist/cli.js --help
npm test
```

The package's `grinding-wheel-speed-calc` command points to `dist/cli.js`.

## Examples

Check a bench or surface grinder wheel against the maximum peripheral speed
marked on the wheel. Enter its diameter in millimeters, the machine's wheel
spindle speed in rpm, and the wheel's rated maximum in m/s:

```sh
node dist/cli.js --diameter 250 --rpm 2850 --max-speed 40
# Peripheral speed: 37.3064 m/s
# OK: rated maximum 40.0000 m/s; margin 2.6936 m/s

node dist/cli.js --diameter 500 --rpm 1500 --max-speed 35
# Peripheral speed: 39.2699 m/s; OVERSPEED warning on stderr; exit 2
```

An OK result checks only the supplied peripheral speed against the supplied
rating. Follow the wheel and machine manufacturers' instructions for wheel
compatibility, mounting, inspection, and operating limits. Do not operate an
overspeed wheel.

Calculate rpm for a target peripheral speed, or the ratio of wheel speed to
workpiece speed:

```sh
node dist/cli.js --diameter 400 --speed 35
# Wheel speed: 1671.1269 rpm

node dist/cli.js --diameter 300 --rpm 1500 --work-speed 20
# Peripheral speed: 23.5619 m/s
# Speed ratio q: 70.6858

node dist/cli.js --diameter 250 --rpm 2850 --max-speed 40 --json
```

## Inputs and outputs

`--diameter <mm>` is required. Supply exactly one of `--rpm <n>` or
`--speed <m/s>`. Optional `--max-speed <m/s>` checks the wheel rating;
`--work-speed <m/min>` adds the dimensionless speed ratio. All quantities must
be finite numbers greater than zero. `--decimals <d>` selects an integer from
0 to 6 (default 4). `--help` prints usage.

The formulas are `v = π × D × n / 60000`, `n = v × 60000 / (π × D)`, and
`q = v × 60 / work-speed`. Margin is `max-speed − v`. Calculations and rating
comparisons use unrounded values; only displayed results are rounded.

Text output includes units. `--json` emits a JSON object with `diameterMm`,
`rpm`, and `speedMps`; optional fields are `workSpeedMpm`, `speedRatio`,
`maxSpeedMps`, `marginMps`, and `status` (`OK` or `OVERSPEED`). JSON numbers
are rounded to the chosen precision without guaranteed trailing zeros.
Warnings remain on stderr even in JSON mode.

Exit codes: **0** success (including a speed at the maximum), **1** invalid
input or an unrepresentable calculation, **2** overspeed. Results are still
printed for overspeed. Unknown, duplicate, and missing options are errors.

MIT licensed; see LICENSE.
