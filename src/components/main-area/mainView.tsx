import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { debounce } from 'es-toolkit';
import { store, useAppDispatch } from '../../store';
import {
  updateIsActiveChatPanel,
  updateIsActiveParticipantsPanel,
  updateIsEnabledExtendedVerticalCamView,
} from '../../store/slices/bottomIconsActivitySlice';

import { useMainAreaState } from './hooks/useMainAreaState';
import { useMainAreaCustomCSS } from './hooks/useMainAreaCustomCSS';
import { doRefreshWhiteboard } from '../../store/slices/whiteboard';

import ActiveSpeakers from '../active-speakers';
import MainView from './mainView';
import PollsComponent from '../polls';
import ChatComponent from '../chat';
import ParticipantsComponent from '../participants';

const MainArea = () => {
  const dispatch = useAppDispatch();
  const [isMuted, setIsMuted] = useState(false); // ✅ added local mute state

  const { isRecorder, roomFeatures } = useMemo(() => {
    const session = store.getState().session;
    return {
      isRecorder: !!session.currentUser?.isRecorder,
      roomFeatures: session.currentRoom.metadata?.roomFeatures,
    };
  }, []);

  const {
    isActiveParticipantsPanel,
    isActiveScreenSharingView,
    hasScreenShareSubscribers,
    isActiveWebcamsView,
    hasVideoSubscribers,
    isActiveWhiteboard,
    isActiveExternalMediaPlayer,
    isActiveDisplayExternalLink,
    isActiveChatPanel,
    isActivePollsPanel,
    screenHeight,
  } = useMainAreaState();

  useEffect(() => {
    if (!roomFeatures?.chatFeatures?.allowChat) {
      dispatch(updateIsActiveChatPanel(false));
    }

    if (!isRecorder) {
      dispatch(updateIsActiveParticipantsPanel(true));
    }

    if (isRecorder) {
      dispatch(updateIsEnabledExtendedVerticalCamView(true));
    }

    if (
      !isRecorder &&
      'Notification' in window &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission().then();
    }
  }, [dispatch, isRecorder, roomFeatures]);

  const customCSS = useMainAreaCustomCSS({
    isActiveChatPanel,
    isActiveParticipantsPanel,
    isActivePollsPanel,
    isActiveScreenSharingView,
    hasScreenShareSubscribers,
    isActiveWhiteboard,
    isActiveExternalMediaPlayer,
    isActiveDisplayExternalLink,
    isRecorder,
  });

  const renderMainComponentElms = useMemo(() => {
    return (
      <MainView
        isRecorder={isRecorder}
        isActiveWhiteboard={isActiveWhiteboard}
        isActiveExternalMediaPlayer={isActiveExternalMediaPlayer ?? false}
        isActiveDisplayExternalLink={isActiveDisplayExternalLink ?? false}
        isActiveScreenSharingView={isActiveScreenSharingView}
        hasScreenShareSubscribers={hasScreenShareSubscribers}
        isActiveWebcamsView={isActiveWebcamsView}
        hasVideoSubscribers={hasVideoSubscribers}
        // ✅ pass mute state down so user tile can show muted icon
        isMuted={isMuted}
      />
    );
  }, [
    isRecorder,
    isActiveScreenSharingView,
    hasScreenShareSubscribers,
    isActiveWebcamsView,
    hasVideoSubscribers,
    isActiveDisplayExternalLink,
    isActiveExternalMediaPlayer,
    isActiveWhiteboard,
    isMuted,
  ]);

  const debouncedRefresh = useMemo(
    () =>
      debounce(() => {
        dispatch(doRefreshWhiteboard());
      }, 500),
    [dispatch],
  );

  const handleSidePanelToggled = useCallback(() => {
    if (isActiveWhiteboard) debouncedRefresh();
  }, [debouncedRefresh, isActiveWhiteboard]);

  return (
    <div
      id="main-area"
      className={`relative flex flex-col w-full h-full overflow-hidden bg-Gray-25 ${customCSS}`}
      style={{ height: `${screenHeight}px` }}
    >
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-3 bg-purple-600 text-white shadow-md">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-8 rounded-full bg-white"
          />
          <h2 className="text-lg font-semibold">Study Session</h2>
        </div>
        <div className="flex items-center gap-3 text-sm opacity-90">
          <span>My Test Room</span>
          <span>Physics - Momentum</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden bg-gradient-to-b from-purple-50 to-white">
        {/* Grid view */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-auto">
          <ActiveSpeakers />
          {renderMainComponentElms}
        </div>

        {/* Right panel */}
        <div
          className={`relative transition-all duration-300 ease-in-out ${
            isActiveParticipantsPanel || isActiveChatPanel || isActivePollsPanel
              ? 'w-[320px]'
              : 'w-0'
          } border-l border-gray-200 bg-white overflow-hidden`}
        >
          {isActiveParticipantsPanel && (
            <ParticipantsComponent onToggle={handleSidePanelToggled} />
          )}
          {isActiveChatPanel && roomFeatures?.chatFeatures?.allowChat && (
            <ChatComponent />
          )}
          {isActivePollsPanel && roomFeatures?.pollsFeatures?.isAllow && (
            <PollsComponent />
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <footer className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6 bg-white shadow-md px-8 py-4 rounded-full">
        {/* 🎙️ Mic button */}
        <button
          onClick={() => setIsMuted((prev) => !prev)}
          className={`p-3 rounded-full text-lg transition-all ${
            isMuted
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'hover:bg-gray-100'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? '🔇' : '🎙️'}
        </button>

        {/* 📷 Camera button */}
        <button className="p-3 rounded-full hover:bg-gray-100 text-lg">📷</button>

        {/* 🖥️ Screen share */}
        <button className="p-3 rounded-full hover:bg-gray-100 text-lg">🖥️</button>

        {/* 👥 Participants */}
        <button
          className={`p-3 rounded-full hover:bg-gray-100 text-lg ${
            isActiveParticipantsPanel ? 'bg-purple-100' : ''
          }`}
          onClick={() =>
            dispatch(updateIsActiveParticipantsPanel(!isActiveParticipantsPanel))
          }
        >
          👥
        </button>

        {/* 💬 Chat */}
        <button
          className={`p-3 rounded-full hover:bg-gray-100 text-lg ${
            isActiveChatPanel ? 'bg-purple-100' : ''
          }`}
          onClick={() => dispatch(updateIsActiveChatPanel(!isActiveChatPanel))}
        >
          💬
        </button>
      </footer>
    </div>
  );
};

export default MainArea;