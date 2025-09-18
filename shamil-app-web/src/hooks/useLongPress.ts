import { useCallback, useRef } from 'react';

// The target can be any EventTarget, but we'll often work with HTMLElements
type Target = EventTarget | null;

const useLongPress = (
  onLongPress: (target: Target) => void,
  onClick: (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => void,
  { delay = 500 } = {}
) => {
  const timeout = useRef<NodeJS.Timeout>();
  const targetRef = useRef<Target>(null);
  const longPressTriggered = useRef(false);

  const start = useCallback(
    (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      targetRef.current = event.currentTarget;
      longPressTriggered.current = false;
      timeout.current = setTimeout(() => {
        longPressTriggered.current = true;
        onLongPress(targetRef.current);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(() => {
    timeout.current && clearTimeout(timeout.current);
  }, []);

  const end = useCallback(() => {
    clear();
  }, [clear]);

  const handleClick = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    if (longPressTriggered.current) {
      return;
    }
    onClick(e);
  };

  // We must prevent the default context menu from showing on long press
  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
  };

  return {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => start(e),
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => start(e),
    onMouseUp: end,
    onTouchEnd: end,
    onClick: handleClick,
    onContextMenu: handleContextMenu, // Prevent right-click menu
  };
};

export default useLongPress;