#!/usr/bin/env node

const help = `Grinding wheel peripheral speed calculator (砂轮线速度计算与安全校核)

Usage: grinding-wheel-speed-calc --diameter <mm> (--rpm <n> | --speed <m/s>) [options]

  --diameter <mm>       Wheel diameter, greater than zero (required)
  --rpm <n>             Wheel revolutions per minute, greater than zero
  --speed <m/s>         Wheel peripheral speed, greater than zero
  --max-speed <m/s>     Wheel's rated maximum peripheral speed
  --work-speed <m/min>  Workpiece speed; also calculate speed ratio q
  --decimals <d>        Decimal places, integer 0–6 (default 4)
  --json                Print results as JSON
  --help                Show this help

v = pi * D * n / 60000; n = v * 60000 / (pi * D)
q = v * 60 / work-speed
Exit codes: 0 success, 1 invalid input, 2 OVERSPEED.
`;

function main(args: string[]): number {
  const values = new Map<string, number>();
  const numericFlags = new Set(['--diameter', '--rpm', '--speed', '--max-speed', '--work-speed', '--decimals']);
  const seen = new Set<string>();
  let json = false;
  let showHelp = false;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (seen.has(flag)) throw new Error(`Duplicate option: ${flag}`);
    seen.add(flag);
    if (flag === '--json') { json = true; continue; }
    if (flag === '--help') { showHelp = true; continue; }
    if (!numericFlags.has(flag)) throw new Error(`Unknown option: ${flag}`);
    const raw = args[++i];
    if (raw === undefined || raw.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`${flag} must be a finite number`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) throw new Error(`${flag} must be a finite number`);
    if (flag === '--decimals') {
      if (!Number.isInteger(value) || value < 0 || value > 6) throw new Error('--decimals must be an integer from 0 to 6');
    } else if (value <= 0) throw new Error(`${flag} must be greater than zero`);
    values.set(flag, value);
  }
  if (showHelp) { console.log(help); return 0; }
  const diameter = values.get('--diameter');
  if (diameter === undefined) throw new Error('--diameter is required');
  if (values.has('--rpm') === values.has('--speed')) throw new Error('Provide exactly one of --rpm or --speed');
  const decimals = values.get('--decimals') ?? 4;
  const speed = values.get('--speed') ?? (Math.PI * diameter / 60000) * values.get('--rpm')!;
  const rpm = values.get('--rpm') ?? (speed / Math.PI / diameter) * 60000;
  const maxSpeed = values.get('--max-speed');
  const workSpeed = values.get('--work-speed');
  const ratio = workSpeed === undefined ? undefined : speed * 60 / workSpeed;
  const margin = maxSpeed === undefined ? undefined : maxSpeed - speed;
  for (const value of [speed, rpm, ratio]) {
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) throw new Error('Calculated result is outside the supported numeric range');
  }
  const overspeed = maxSpeed !== undefined && speed > maxSpeed;
  const fixed = (n: number): string => n.toFixed(decimals);
  const rounded = (n: number): number => Number(fixed(n));
  if (json) {
    console.log(JSON.stringify({
      diameterMm: rounded(diameter), rpm: rounded(rpm), speedMps: rounded(speed),
      ...(workSpeed === undefined ? {} : { workSpeedMpm: rounded(workSpeed), speedRatio: rounded(ratio!) }),
      ...(maxSpeed === undefined ? {} : { maxSpeedMps: rounded(maxSpeed), marginMps: rounded(margin!), status: overspeed ? 'OVERSPEED' : 'OK' })
    }, null, 2));
  } else {
    console.log(`Diameter: ${fixed(diameter)} mm\nWheel speed: ${fixed(rpm)} rpm\nPeripheral speed: ${fixed(speed)} m/s`);
    if (workSpeed !== undefined) console.log(`Workpiece speed: ${fixed(workSpeed)} m/min\nSpeed ratio q: ${fixed(ratio!)}`);
    if (maxSpeed !== undefined) console.log(`${overspeed ? 'OVERSPEED' : 'OK'}: rated maximum ${fixed(maxSpeed)} m/s; margin ${fixed(margin!)} m/s`);
  }
  if (overspeed) {
    console.error(`WARNING: OVERSPEED — peripheral speed ${fixed(speed)} m/s exceeds the wheel's rated maximum ${fixed(maxSpeed!)} m/s. Do not operate at this speed.`);
    return 2;
  }
  return 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
