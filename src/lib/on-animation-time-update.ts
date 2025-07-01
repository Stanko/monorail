export const onAnimationTimeUpdate = (
  element: HTMLElement,
  duration: number,
  callback: (time?: number, progress?: number) => void
) => {
  let startTime: number;
  let isRunning = false;

  const requestAnimationUpdate = () => {
    if (!isRunning) {
      return;
    }

    const currentTime = performance.now();
    const elapsedTime = currentTime - startTime;
    const progress = (elapsedTime / duration) % 1;

    callback(elapsedTime, progress);

    requestAnimationFrame(requestAnimationUpdate);
  };

  const handleAnimationStart = () => {
    startTime = performance.now();
    isRunning = true;
    requestAnimationUpdate();
  };

  const handleAnimationEnd = () => {
    isRunning = false;
  };

  element.addEventListener('animationstart', handleAnimationStart);
  element.addEventListener('animationend', handleAnimationEnd);

  return () => {
    element.removeEventListener('animationstart', handleAnimationStart);
    element.removeEventListener('animationend', handleAnimationEnd);
    isRunning = false;
  };
};
