e1201 — expanded symbolic benchmark SOURCE bundle

Outcome: 8 authored new workloads, 12 symbolic workloads total. Preserve the
original16 workloads/32 Linux+Node-WASM rows exactly. Extended inventory is24
workloads/48 target rows:5core+7linalg+12symbolic, each on Linux native and Node
WASM32. No timings, runtime qualifications, or peer passes were produced.

NEW WORKLOADS
- diff-polynomial-16: first derivative of (x + 1)^16 + x^9 + 3*x.
- mixed-partial-6x5: d/dy(d/dx(x^6*y^5 + 3*x^4*y^3 + x*y)).
- diff-rational: quotient rule for (x^2 + 1)/(x + 2), real x != -2.
- diff-transcendental: product/chain rules for exp(x)*sin(x) + cos(x^2).
- substitute-polynomial-12: structural x -> x+1, degree12 polynomial.
- substitute-transcendental: structural x -> z+1 inside exp/sin/cos expressions.
- collect-polynomial-24: full expansion and like-term collection, degree24.
  VKF's existing collect literally delegates to expand. Peers explicitly expand;
  this is not advertised as general factorization or variable-grouped collection.
- shared-dag-derivative-24: shared h=x^2+1, sum h^k, k=1..24; one cached
  derivative, output degree47. Physical sharing differs by engine. This bounded
  stress shape has24 powers, not a claimed exponential or million-node workload.

See fixtures/cases.json and individual fixtures for exact inputs, mathematical
expected expressions, domains, sizes, coefficient bounds and work complexity.
Small/medium/bounded-large refer to source shapes, not measured costs. No new
product API was added. Unsupported candidates and source caveats are in
CAPABILITY-SOURCE-AUDIT.json. All new VKF files require fresh qualification.

ORACLE AND SEMANTICS
The independent Python helper imports no CAS. It implements bounded rational
arithmetic over Q-polynomials and formal sin/cos/exp atoms with exact polynomial
arguments. Rational identities use cross multiplication plus a denominator
factor check that rejects new singularities beyond x=-2. It does not equate
arbitrary printed strings, numerically sample a function, simplify logarithmic
branches, or promise universal CAS equivalence.

For polynomial VKF outputs, expand AFTER both operation clocks, then serialize
the full coefficient box plus term count. Exact count must equal the number of
nonzero serialized coefficients, preventing hidden extra terms beyond the box.
Variable order follows the current polynomial catalog: x, then y for the mixed
case; other polynomial cases are univariate. A mismatched catalog fails the
future correctness check. All input/output coefficients and selected degrees
fit exact binary64 integers; there is no tolerance-based integer acceptance.
Packed polynomial katex is not used: source inspection found _symbolic_as_dag
falls back to0 for packed polynomial kinds, so treating that as a valid symbolic
serialization would lose correctness information.

SymEngine uses Basic::diff(cache=true)/subs and expand; SymPy uses diff,
one-map simultaneous substitution and expand; Symbolics uses Differential plus
expand_derivatives(..., false), one-map substitute, and expand. Installed7.31.0
source requires positional simplify=false; latest docs alone would not suffice.
No peer performs a timed full simplify/cancel absent from the VKF operation.
All variables are real. SymEngine unassumed symbols suffice conservatively for
these polynomial/rational and entire transcendental identities; no positivity,
complex-branch, logarithm or square-root rewrite is assumed.

TIMING AND COUNTS
120 job definitions =48 preflight+24 cross-target parity+48 measure.
All48 exact row preflights and24 parity checks precede every measure job.
Each row has VKF+3 peers, hence48 VKF cells+144 peer cells, not192 target rows.
10 required observations per cell =1920 planned warmed operation observations.
The16 new rows additionally plan640 separately verified first-operation samples.
First-call, warm-call, full process, guest invocation, compiler owner cold,
compile and adapter build durations remain separate. They are not pooled.
Compile observations are setup metrics, not another benchmark workload/grid.
No aggregate compile count is asserted for the differing existing suite rules.

Input construction and replacement maps precede both operation clocks.
Each new adapter clocks its first operation separately, then a second identical
operation as the warmed sample. Retain both outputs and independently validate
each. Python/Julia collect and disable GC across these two calls; no cache-flush
is invented. SymEngine uses reference counting; VKF keeps its existing runtime.
The first Julia call may include JIT; first-call caching differs by engine.
Node first-operation is per guest invocation in the row-owned guest instance,
not a cold OS process. This inherits C1142's extra-suite instance lifecycle and
never rewinds its heap. Native and peer samples use fresh processes. Full
process durations include setup, both operations, serialization and host launch;
they are not startup-only measurements. Node's full_program metric covers guest
invocation. Compile and compiler-owner cold remain outside operation timers.
Original32 protocols, sources, oracles, source IDs, historical data and timing
records stay byte-for-byte unchanged. The existing driver groups observations
by engine rather than rotating all four engines across every round; this SOURCE
extension does not claim process-order balance or measured performance fairness.
A future performance reviewer must disclose this inherited ordering, especially
for short kernels. All raw samples are retained; none may be discarded/censored.

New rows retain strict VKF/peer ratio<1.0, computed as ratio of arithmetic means,
with10 positive warmed samples per peer. First-operation samples have their own
vectors and do not contribute to that gate. Failing ratios retain raw evidence
and fail qualification. Historical passes or timings are never imported.
The CAS peers remain LOCAL Linux-native processes for both VKF target rows,
exactly as in C1142; no SymPy/SymEngine/Symbolics WASM implementation is claimed.
Windows/macOS/Safari remain dash. No GPU measurement is part of this corpus.

CONSUMING THE EXISTING OPERATIONAL DRIVER
The private overlay preserves existing C1142 filenames, including actual-peer32.py;
it now derives32/48 rows and80/120 jobs from the pinned corpus. Do not edit or
apply this patch to the closed e1142 bundle. CANDIDATE.patch is relative to a NEW
private copy of its overlay; add this bundle's config/fixtures/programs. Running
the external overlay in place is simpler and preserves its pinned absolute paths.

A future owner supplies a source/config/ABI/artifact-qualified final component
selection in the existing vkf-e1139-component-selection-v1 format. The supplied
baseline-selection.extended.json is a historical selection template, not a claim
that its artifacts are the new qualified release. It adds the pinned symbolic
adapter recipe and source driver dependencies. Actual owner must reconcile and
pin final compiler/library provenance, preserve every original source identity,
and prove all required fresh product checks; no old432 pass carries to changed
artifacts or changed example source.

Future entry, ONLY INSIDE THE EXISTING ADMITTED ACTUAL OWNER:
  /usr/bin/python3 -B <this bundle>/overlay/scripts/local-overnight/source/actual-peer32.py \
    FINAL_COMPONENT_SELECTION.json \
    <this bundle>/config/peer48-corpus.json \
    <this bundle>/config/peer48-jobs.prepared.json \
    ORIGINAL_CURRENT_ACTUAL_OWNER_CHAT.json FRESH_RUN_DIRECTORY

No new controller/daemon/framework or nested flock. Inherit the already held
native-heavy.lock FD, inode8915659; existing guardian retains uninterrupted
custody through reporting, seals, helper waits and closure. Entry checks its
original CHAT.started_monotonic+3600, inherited FD and admitted cgroup. Source
owner e1201 cannot bind or execute. No expired owner/controller relaunch or
clock reset. No hosted Actions/build/test/benchmark credits. Do not wait/relaunch
an expired owner: save this source checkpoint and let coordinator assign useful
work under the established authority.

The SymEngine recipe reuses the existing pinned0.15.0 static library at commit
0c183629a35dd9d8123fafcc47b0e0283bbae80d and Boost1.86 headers. It builds only this
new small adapter under actual admission, records compiler -MMD dependencies,
and rejects any non-system include absent from its15,974 input pins. It neither
rebuilds the library nor installs software. C++/Julia/VKF were not compiled or
executed here. Actual C++ compilation, linker/ABI qualification and Julia source
execution remain required. SymPy1.14.0 and Julia1.12.6/Symbolics7.31.0 require
fresh admitted library-version probes before the new adapters are callable.
Missing tools, package/version receipts or capabilities report UNRUN/dash.
No unavailable peer is silently omitted, approximated or credited PASS.

VALIDATION AND CLOSURE
9 focused source arithmetic/structure control groups, including polynomial and
quotient-rule contracts, coefficient completeness, wrong-input/result/version,
KaTeX grammar, new-pole rejection, original-row preservation, job DAG, operation
boundaries and strict ratio aggregation. Python source syntax was parsed.
These are SOURCE controls and fabricated oracle inputs;0 product/peer passes.
No C++ typecheck/build, Node process, browser, native, GPU, CAS, deployment or
remote mutation occurred. No helper agents/controllers were created. See RESULT,
SOURCE-PINS, REPORT-SEAL, FINAL-SEAL, METADATA-SEAL, ALL-HELPER-JOINS and
SOURCE-RESOURCE-CLOSE. Coordinator must observe the actual chat/tool terminal
before archiving; the worker cannot truthfully self-observe its final message.
