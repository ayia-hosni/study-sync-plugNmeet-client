import React, { DragEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RoomUploadedFileType } from 'plugnmeet-protocol-js';

import TextBoxArea from './text-box';
import ChatTabs from './chatTabs';

import { store, useAppDispatch, useAppSelector } from '../../store';
import { publishFileAttachmentToChat } from './utils';
import { addUserNotification } from '../../store/slices/roomSettingsSlice';
import { uploadResumableFile } from '../../helpers/fileUpload';

const ChatComponent = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  // Values that are static for the session
  const { isRecorder, isAdmin, chatFeatures } = useMemo(() => {
    const session = store.getState().session;
    const currentUser = session.currentUser;
    return {
      isRecorder: !!currentUser?.isRecorder,
      isAdmin: !!currentUser?.metadata?.isAdmin,
      chatFeatures: session.currentRoom.metadata?.roomFeatures?.chatFeatures,
    };
  }, []);

  // Values that can change during the session (e.g., admin changes lock settings)
  const isChatLocked = useAppSelector(
    (state) => state.session.currentUser?.metadata?.lockSettings?.lockChat,
  );
  const isLockChatSendMessage = useAppSelector(
    (state) =>
      state.session.currentUser?.metadata?.lockSettings?.lockChatSendMessage,
  );
  const isLockChatFileShare = useAppSelector(
    (state) =>
      state.session.currentUser?.metadata?.lockSettings?.lockChatFileShare,
  );
  const defaultLockSettings = useAppSelector(
    (state) => state.session.currentRoom.metadata?.defaultLockSettings,
  );

  const canShowChatInput = useMemo(() => {
    // Recorders can never chat.
    if (isRecorder) {
      return false;
    }
    // Admins can always chat (unless they are a recorder, which is handled above).
    if (isAdmin) {
      return true;
    }

    // Determine the final lock status by respecting user-specific overrides.
    let finalChatLockStatus = defaultLockSettings?.lockChat;
    if (typeof isChatLocked !== 'undefined') {
      // User-specific setting takes precedence.
      finalChatLockStatus = isChatLocked;
    }

    let finalMsgSendLockStatus = defaultLockSettings?.lockChatSendMessage;
    if (typeof isLockChatSendMessage !== 'undefined') {
      // User-specific setting takes precedence.
      finalMsgSendLockStatus = isLockChatSendMessage;
    }

    // A non-admin can chat if neither the chat feature nor message sending is locked.
    return !finalChatLockStatus && !finalMsgSendLockStatus;
  }, [
    isRecorder,
    isAdmin,
    isChatLocked,
    isLockChatSendMessage,
    defaultLockSettings,
  ]);

  const handleOnDrop = (e: DragEvent) => {
    e.preventDefault();

    if (isLockChatSendMessage || isLockChatFileShare) {
      return;
    }

    if (e.dataTransfer && e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      if (files.length) {
        uploadResumableFile(
          chatFeatures?.allowedFileTypes ?? [],
          chatFeatures?.maxFileSize,
          RoomUploadedFileType.CHAT_FILE,
          files,
          (result) => {
            publishFileAttachmentToChat(result.filePath, result.fileName).then(
              () =>
                dispatch(
                  addUserNotification({
                    message: t('right-panel.file-upload-success'),
                    typeOption: 'success',
                  }),
                ),
            );
          },
        );
      }
    }
  };

return (
  <div
    className="relative flex flex-col h-full bg-white border-l border-gray-200"
    onDrop={handleOnDrop}
    onDragOver={(e) => e.preventDefault()}
  >
    {/* Header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <h3 className="text-sm font-medium text-gray-900">Session Chat</h3>
    </div>

    {/* Messages + Tabs */}
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <ChatTabs />
      </div>
    </div>

    {/* Input */}
    {canShowChatInput && (
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <TextBoxArea />
      </div>
    )}
  </div>
);

};

export default ChatComponent;
