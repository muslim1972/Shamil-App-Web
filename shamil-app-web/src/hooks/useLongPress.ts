import { useCallback, useRef } from 'react';

// The target can be any EventTarget, but we'll often work with HTMLElements
type Target = EventTarget | null;

const useLongPress = (
  onLongPress: (target: Target) => void,
  { delay = 500 } = {}
) => {
  const timeout = useRef<NodeJS.Timeout>();
  const targetRef = useRef<Target>(null);
  const longPressTriggered = useRef(false);

  const start = useCallback(
    (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      console.log("start");
      // We store the event target, as the event object itself will be reused by React
      targetRef.current = event.currentTarget;
      longPressTriggered.current = false;
      timeout.current = setTimeout(() => {
        console.log("long press triggered");
        longPressTriggered.current = true;
        onLongPress(targetRef.current);
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(() => {
    console.log("clear");
    timeout.current && clearTimeout(timeout.current);
  }, []);

  const end = useCallback(() => {
    console.log("end");
    clear();
    // Only reset if long press wasn't triggered
    if (!longPressTriggered.current) {
      // We don't do anything here, just clear the timeout
    }
  }, [clear]);

  // We must prevent the default context menu from showing on long press
  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
  };

  return {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => start(e),
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => start(e),
    onMouseUp: end,
    onTouchEnd: end,
    onContextMenu: handleContextMenu, // Prevent right-click menu
  };
};

export default useLongPress;