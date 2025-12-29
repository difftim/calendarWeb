export const getLeftTime = (time: number) => {
  const now = Date.now();
  return Math.ceil(now / time) * time - now;
};

type LoopCall = (
  timer: number,
  option?: Partial<{ immediate: boolean; type: 'normal' | 'next' }>
) => (fn: () => Promise<boolean | void>) => void;

export const loopCall: LoopCall =
  (time, option = {}) =>
  async callbackFn => {
    const { immediate = false, type = 'normal' } = option;
    let timerId: any;

    const next = async (immediate = false) => {
      const leftTime = immediate ? 0 : type === 'next' ? getLeftTime(time) : time;
      timerId = setTimeout(async () => {
        const shouldStop = await callbackFn();
        console.log('next call', shouldStop);
        if (shouldStop) {
          clearTimeout(timerId);
          timerId = undefined;
          return;
        }

        next();
      }, leftTime);
    };

    next(immediate);
  };
