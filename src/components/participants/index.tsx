import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useVirtual from 'react-cool-virtual';
import { createSelector } from '@reduxjs/toolkit';
import { RootState, store, useAppDispatch, useAppSelector } from '../../store';

import ParticipantComponent from './participant';
import { participantsSelector } from '../../store/slices/participantSlice';
import RemoveParticipantAlertModal, {
  IRemoveParticipantAlertModalData,
} from './removeParticipantAlertModal';

import { SearchIconSVG } from '../../assets/Icons/SearchIconSVG';
import { CloseIconSVG } from '../../assets/Icons/CloseIconSVG';
import { updateIsActiveParticipantsPanel } from '../../store/slices/bottomIconsActivitySlice';

const selectFilteredParticipants = createSelector(
  [
    participantsSelector.selectAll,
    (state: RootState, isAdmin: boolean) => isAdmin,
    (state: RootState, isAdmin: boolean, search: string) => search,
    (
      state: RootState,
      isAdmin: boolean,
      search: string,
      allowViewOtherUsers: boolean,
    ) => allowViewOtherUsers,
    (
      state: RootState,
      isAdmin: boolean,
      search: string,
      allowViewOtherUsers: boolean,
      currentUserId: string | undefined,
    ) => currentUserId,
  ],
  (participants, isAdmin, search, allowViewOtherUsers, currentUserId) => {
    let list = participants
      .slice()
      .filter(
        (p) =>
          p.name !== '' &&
          p.userId !== 'RECORDER_BOT' &&
          p.userId !== 'RTMP_BOT',
      );

    if (!isAdmin && !allowViewOtherUsers) {
      list = list.filter(
        (p) => p.metadata.isAdmin || p.userId === currentUserId,
      );
    }

    if (search) {
      list = list.filter((p) =>
        p.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      );
    }

    if (isAdmin) {
      return list.sort((a, b) =>
        a.metadata.waitForApproval === b.metadata.waitForApproval
          ? 0
          : a.metadata.waitForApproval
          ? -1
          : 1,
      );
    }
    return list;
  },
);

interface Props {
  onToggle?: () => void;
}

const ParticipantsComponent: React.FC<Props> = ({ onToggle }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParticipant, setSearchParticipant] = useState('');
  const [removeParticipantData, setRemoveParticipantData] =
    useState<IRemoveParticipantAlertModalData>();

  const { currentUser, currentIsAdmin, currentUserUserId, allowViewOtherUsers } =
    useMemo(() => {
      const session = store.getState().session;
      const currentUser = session.currentUser;
      return {
        currentUser,
        currentIsAdmin: !!currentUser?.metadata?.isAdmin,
        currentUserUserId: currentUser?.userId,
        allowViewOtherUsers:
          !!session.currentRoom.metadata?.roomFeatures?.allowViewOtherUsersList,
      };
    }, []);

  const participants = useAppSelector((state) =>
    selectFilteredParticipants(
      state,
      currentIsAdmin,
      searchParticipant,
      allowViewOtherUsers,
      currentUserUserId,
    ),
  );

  const { outerRef, innerRef, items } = useVirtual({
    itemCount: participants.length,
  });

  const onOpenRemoveParticipantAlert = useCallback(
    (name: string, user_id: string, type: string) => {
      setRemoveParticipantData({ name, userId: user_id, removeType: type });
    },
    [],
  );

  const onCloseAlertModal = () => setRemoveParticipantData(undefined);

  const closePanel = () => {
    dispatch(updateIsActiveParticipantsPanel(false));
    onToggle?.();
  };

  const renderParticipant = useCallback(
    (index: number) => {
      const participant = participants[index];
      if (!participant) return null;

      const isRemoteParticipant = currentUser?.userId !== participant.userId;
      return (
        <ParticipantComponent
          key={participant.userId}
          participant={participant}
          isRemoteParticipant={isRemoteParticipant}
          openRemoveParticipantAlert={onOpenRemoveParticipantAlert}
          currentUser={currentUser}
        />
      );
    },
    [participants, currentUser, onOpenRemoveParticipantAlert],
  );

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-900">
          {t('left-panel.participants', { total: participants.length })}
        </p>
        <button
          onClick={closePanel}
          className="text-gray-600 hover:text-gray-800 transition"
        >
          <CloseIconSVG />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <div className="relative w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <SearchIconSVG />
          </div>
          <input
            type="text"
            name="search-participants"
            id="search-participants"
            placeholder="Search participant"
            value={searchParticipant}
            onChange={(e) => setSearchParticipant(e.target.value)}
            className="w-full h-9 pl-9 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* List */}
      <div
        ref={outerRef as any}
        className="flex-1 overflow-y-auto scrollBar p-3"
      >
        <ul ref={innerRef as any} className="space-y-2">
          {items.map(({ index, measureRef }) => (
            <li
              key={index}
              ref={measureRef}
              className="w-full list-none flex items-center"
            >
              {renderParticipant(index)}
            </li>
          ))}
        </ul>
      </div>

      {/* Remove Participant Modal */}
      {removeParticipantData && (
        <RemoveParticipantAlertModal
          name={removeParticipantData.name}
          userId={removeParticipantData.userId}
          removeType={removeParticipantData.removeType}
          closeAlertModal={onCloseAlertModal}
        />
      )}
    </div>
  );
};

export default ParticipantsComponent;
