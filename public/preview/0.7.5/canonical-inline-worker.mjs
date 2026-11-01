// Reject stale or direct worker requests without importing a compiler.
self.onmessage = ({data}) => {
  self.postMessage({id: data?.id, status: 'error', message: 'Run is disabled before release; the latest compiler is required.'});
};
