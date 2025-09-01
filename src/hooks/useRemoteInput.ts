import { useCallback, useEffect } from 'react';
import { webrtcService, RemoteInputEvent } from '../services/webrtc';

export function useRemoteInput(isControlling: boolean = false) {
  const sendMouseMove = useCallback((x: number, y: number) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'mouse-move',
      payload: { x, y }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

  const sendMouseClick = useCallback((x: number, y: number, button: number = 0) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'mouse-click',
      payload: { x, y, button }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

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

  const sendKeyRelease = useCallback((key: string, code: string) => {
    if (!isControlling) return;
    
    const input: RemoteInputEvent = {
      type: 'key-release',
      payload: { key, code }
    };
    webrtcService.sendRemoteInput(input);
  }, [isControlling]);

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

export function useRemoteInputHandler(onRemoteInput?: (input: RemoteInputEvent) => void) {
  useEffect(() => {
    if (!onRemoteInput) return;

    webrtcService.onDataChannelMessage(onRemoteInput);

    return () => {
      // Cleanup si nécessaire
    };
  }, [onRemoteInput]);
}