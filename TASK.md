# grinding-wheel-speed-calc

Build a small TypeScript Node CLI (Node 18+, no runtime deps; devDeps typescript + @types/node only; tests with node:test) for grinding wheel peripheral speed (砂轮线速度计算与安全校核).

Inputs: --diameter <mm> (wheel diameter, required, > 0), exactly one of --rpm <n> (> 0) or --speed <m/s> (> 0), optional --max-speed <m/s> (wheel's rated max speed, > 0), optional --work-speed <m/min> (workpiece speed, > 0), --decimals <d> (0-6, default 4), --json, --help.
- v (m/s) = pi * D * n / 60000; n (rpm) = v * 60000 / (pi * D).
- If --work-speed given: speed ratio q = v * 60 / work-speed.
- If --max-speed given and v > max-speed: print a clear OVERSPEED warning to stderr and exit 2 (still print results). If v <= max-speed print "OK" margin (max - v).
- Validate: diameter <= 0, rpm and speed both or neither, non-positive or non-numeric values, decimals out of 0-6 → error to stderr, exit 1.
- Readable text output by default, README with examples (explain checking a bench/surface grinder wheel against its rated speed), MIT LICENSE (author shanguoao2026-web), .gitignore with node_modules/ dist/ *.log .npm-cache/.
- package.json "bin" must point to the built CLI. npm test must build and pass. No secrets, no personal info.

Check values (must be in tests, 4 decimals):
- D300 rpm1500 → v 23.5619
- D400 speed35 → n 1671.1269
- D300 rpm1500 work-speed20 → q 70.6858
- D500 rpm1500 max-speed35 → v 39.2699, exit 2
- D250 rpm2850 max-speed40 → v 37.3064, exit 0, margin 2.6936
- diameter0, rpm+speed, neither, rpm abc, decimals9 → exit 1
