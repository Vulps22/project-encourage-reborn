import { spawnSync } from 'child_process';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

/**
 * env-loader runs at module load and can call process.exit, so each case is
 * exercised in a real child process rather than by requiring it in-band.
 *
 * The loader resolves the repo root as three levels above its own directory, so
 * copying it to <tmp>/a/b/c makes <tmp> the "repo root" and lets us control
 * whether an env file is present.
 */
const LOADER = resolve(__dirname, '../../database/scripts/env-loader.js');

function runLoader(
    args: string[],
    opts: { envFileContents?: string; env?: NodeJS.ProcessEnv } = {}
): { status: number; output: string } {
    const root = mkdtempSync(join(tmpdir(), 'env-loader-test-'));
    const scriptDir = join(root, 'a', 'b', 'c');
    mkdirSync(scriptDir, { recursive: true });
    copyFileSync(LOADER, join(scriptDir, 'env-loader.js'));

    if (opts.envFileContents !== undefined) {
        writeFileSync(join(root, '.env.development'), opts.envFileContents);
    }

    const probe = join(scriptDir, 'probe.js');
    writeFileSync(probe, "require('./env-loader.js');\nconsole.log('LOADED_DB_HOST=' + process.env.DB_HOST);\n");

    try {
        const r = spawnSync('node', [probe, ...args], {
            encoding: 'utf8',
            env: { ...process.env, DB_HOST: undefined, ...opts.env } as NodeJS.ProcessEnv,
        });
        // The loader warns on stderr, so both streams matter.
        return { status: r.status ?? -1, output: `${r.stdout ?? ''}${r.stderr ?? ''}` };
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

describe('env-loader', () => {
    it('loads values from the env file when one is present', () => {
        const { status, output } = runLoader(['--dev'], { envFileContents: 'DB_HOST=from-file\n' });

        expect(status).toBe(0);
        expect(output).toContain('LOADED_DB_HOST=from-file');
    });

    it('falls back to the ambient environment when the env file is missing', () => {
        // CI supplies DB_* as job env, and the Docker images ship no env file —
        // exiting here would break both.
        const { status, output } = runLoader(['--dev'], { env: { DB_HOST: 'from-ambient' } });

        expect(status).toBe(0);
        expect(output).toContain('using ambient environment');
        expect(output).toContain('LOADED_DB_HOST=from-ambient');
    });

    it('never overrides a variable already set in the environment', () => {
        const { status, output } = runLoader(['--dev'], {
            envFileContents: 'DB_HOST=from-file\n',
            env: { DB_HOST: 'from-ambient' },
        });

        expect(status).toBe(0);
        expect(output).toContain('LOADED_DB_HOST=from-ambient');
    });

    it('still refuses to run when no environment is selected', () => {
        // Choosing the target environment stays explicit — the fallback above
        // must not turn a missing flag into "whatever happens to be exported".
        const { status, output } = runLoader([]);

        expect(status).toBe(1);
        expect(output).toContain('No environment selected');
    });
});
