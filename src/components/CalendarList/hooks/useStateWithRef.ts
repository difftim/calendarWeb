import { useRef, useState } from 'react';

export const useStateWithRef = <T extends unknown>(initialState: T | (() => T)) => {
  const [state, _setState] = useState(initialState);
  const ref = useRef(state);
  const getState = () => ref.current;
  const setState = (newState: T) => {
    if (typeof newState === 'function') {
      ref.current = newState(ref.current);
    } else {
      ref.current = newState;
    }
    _setState(newState);
  };

  return [state, setState, getState] as [T, typeof _setState, typeof getState];
};
