
/**
 * Timer Worker to handle countdown ticks accurately in the background.
 * Mobile OSs often throttle main-thread intervals. Workers are more resilient.
 */

let timerId = null;

self.onmessage = (e) => {
  const { command, interval } = e.data;

  if (command === 'start') {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      self.postMessage({ type: 'tick' });
    }, interval || 1000);
  } else if (command === 'stop') {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }
};
