import { useCallback, useEffect } from 'react';
import { webrtcService, RemoteInputEvent } from '../services/webrtc';

// Hook to manage remote input (mouse, keyboard, scroll)
export function useRemoteInput(isControlling: boolean = false) {
  // Send mouse movement
  const sendMouseMove = useCallback((x: number, y: number) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'mouse-move',
      payload: { x, y }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

  // Send mouse click
  const sendMouseClick = useCallback((x: number, y: number, button: number = 0) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'mouse-click',
      payload: { x, y, button }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

  // Send key press
  const sendKeyPress = useCallback((key: string, code: string, modifiers: {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
  } = {}) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'key-press',
      payload: {
        key,
        code,
        ...modifiers
      }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

  // Send key release
  const sendKeyRelease = useCallback((key: string, code: string) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'key-release',
      payload: { key, code }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

  // Send scroll
  const sendScroll = useCallback((deltaX: number, deltaY: number) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'scroll',
      payload: { deltaX, deltaY }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

  return {
    sendMouseMove,
    sendMouseClick,
    sendKeyPress,
    sendKeyRelease,
    sendScroll
  };
}

// Hook to handle received remote input
export function useRemoteInputHandler(onRemoteInput?: (input: RemoteInputEvent) => void) {
  useEffect(() => {
    if (!onRemoteInput) return;

    // Subscribe to data channel messages
    webrtcService.onDataChannelMessage(onRemoteInput);

    return () => {
      // Cleanup if needed
    };
  }, [onRemoteInput]);
}