#!/usr/bin/env python3
"""Admitted namespace child: fresh packaged CLI spawn-to-exit clock only."""
import subprocess,sys,time,json,signal
class NormalCancellation(BaseException):pass
def cancel(sig,frame):
    # The owning execute signals this wrapper AND its captured descendants.
    # Enter communicate cleanup so available CLI diagnostics are not lost.
    signal.signal(signal.SIGTERM,signal.SIG_IGN)
    raise NormalCancellation('owned normal SIGTERM cancellation')
signal.signal(signal.SIGTERM,cancel)
start=time.perf_counter_ns()
p=subprocess.Popen(sys.argv[1:],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
try:out,err=p.communicate()
except BaseException as error:
    # The outer execute owns the complete namespace tree and its 40s normal
    # cleanup. This unreaped direct child cannot have a reused PID. Preserve
    # the original error and pipe ownership; never force-kill on interruption.
    if not isinstance(error,NormalCancellation) and p.poll() is None:p.terminate()
    try:
        out,err=p.communicate(timeout=40)
        sys.stdout.buffer.write(out);sys.stderr.buffer.write(err)
    except BaseException as cleanup_error:
        if isinstance(cleanup_error,subprocess.TimeoutExpired):
            sys.stdout.buffer.write(cleanup_error.output or b'')
            sys.stderr.buffer.write(cleanup_error.stderr or b'')
        error.add_note('CLI normal cleanup unresolved: '+repr(cleanup_error))
    raise
elapsed=(time.perf_counter_ns()-start)/1e6
sys.stderr.buffer.write(err)
print(json.dumps(dict(stdout=out.decode(),compile_ms=elapsed,argv=sys.argv[1:],pid=p.pid,exit=p.returncode,waited=True)))
raise SystemExit(p.returncode)
