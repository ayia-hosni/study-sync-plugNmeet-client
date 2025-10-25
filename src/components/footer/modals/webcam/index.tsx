import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../../../../store';
import {
  updateIsActiveWebcam,
  updateShowVideoShareModal,
} from '../../../../store/slices/bottomIconsActivitySlice';
import { getInputMediaDevices } from '../../../../helpers/utils';
import PreviewWebcam from './previewWebcam';
import { addVideoDevices } from '../../../../store/slices/roomSettingsSlice';
import Modal from '../../../../helpers/ui/modal';
import Dropdown from '../../../../helpers/ui/dropdown';
import ActionButton from '../../../../helpers/ui/actionButton';
import { IMediaDevice } from '../../../../store/slices/interfaces/roomSettings';

interface IShareWebcamModal {
  onSelectedDevice: (deviceId: string) => void;
  displayWebcamSelection: boolean;
  selectedDeviceId: string;
}

const ShareWebcamModal = ({
  onSelectedDevice,
  displayWebcamSelection,
  selectedDeviceId,
}: IShareWebcamModal) => {
  const showVideoShareModal = useAppSelector(
    (state) => state.bottomIconsActivity.showVideoShareModal,
  );
  const [selectedWebcam, setSelectWebcam] = useState<string>(selectedDeviceId);
  const [devices, setDevices] = useState<IMediaDevice[]>([]);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    const getDeviceWebcams = async () => {
      const inputDevices = await getInputMediaDevices('video');
      if (!inputDevices.video.length) {
        return;
      }

      setDevices(inputDevices.video);
      if (selectedDeviceId !== '') {
        setSelectWebcam(selectedDeviceId);
      } else {
        setSelectWebcam(inputDevices.video[0].id);
      }
      dispatch(addVideoDevices(inputDevices.video));
    };
    getDeviceWebcams().then();
    //eslint-disable-next-line
  }, []);

  const shareWebcam = async () => {
    onClose();
    if (!selectedWebcam) {
      return;
    }
    onSelectedDevice(selectedWebcam);
  };

  const onClose = () => {
    dispatch(updateShowVideoShareModal(false));
    dispatch(updateIsActiveWebcam(false));
  };

  return (
    showVideoShareModal && (
      <Modal
        show={showVideoShareModal}
        onClose={onClose}
        title={t('footer.modal.select-webcam')}
        renderButtons={() => (
          <div className="grid grid-cols-2 gap-5">
            <button
              className="w-full cursor-pointer h-10 3xl:h-11 text-sm 3xl:text-base font-medium 3xl:font-semibold bg-Gray-25 hover:bg-primary-color hover:text-white border border-Gray-300 rounded-[15px] flex justify-center items-center gap-2 transition-all duration-300 shadow-button-shadow"
              type="button"
              onClick={onClose}
            >
              {t('cancel')}
            </button>
            <ActionButton onClick={shareWebcam}>{t('save')}</ActionButton>
          </div>
        )}
      >
        {displayWebcamSelection && (
          <div className="webcam-dropdown mb-4">
            <Dropdown
              id="webcam"
              value={selectedWebcam}
              onChange={setSelectWebcam}
              options={devices.map((d) => ({
                value: d.id,
                text: d.label,
              }))}
            />
          </div>
        )}
        <div className="w-full">
          <PreviewWebcam deviceId={selectedWebcam} />
        </div>
      </Modal>
    )
  );
};

export default ShareWebcamModal;
