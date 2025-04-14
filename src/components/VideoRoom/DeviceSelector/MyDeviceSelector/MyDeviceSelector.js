import React, { useContext, useEffect } from 'react';

// styles
import Style from './MyDeviceSelector.module.css';

// prime react components
import 'primeicons/primeicons.css';

// my components
import Option from './Option';

// context
import DeviceSelectorContext from '../DeviceSelectorContext.js';

const MyDeviceSelector = ({ data, selectedDevice, setSelectedDevice, isMic, isCam, isSpeaker, switchDevice, toggleCamera, toggleMicrophone, toggleSpeaker, isCameraOn, isMicrophoneOn, isSpeakerOn }) => {

    // context to control options visibility
    const {
        cameraOptionsAreOpen,
        setCameraOptionsAreOpen,
        microphoneOptionsAreOpen,
        setMicrophoneOptionsAreOpen,
        speakerOptionsAreOpen,
        setSpeakerOptionsAreOpen,
    } = useContext(DeviceSelectorContext);

    const hasDevices = data.length > 0;
    // function to handle opening and closing options
    const handleOptions = () => {
        if (isCam) {
            setCameraOptionsAreOpen(!cameraOptionsAreOpen);
            setMicrophoneOptionsAreOpen(false);
            setSpeakerOptionsAreOpen(false);
        } else if (isMic) {
            setMicrophoneOptionsAreOpen(!microphoneOptionsAreOpen);
            setCameraOptionsAreOpen(false);
            setSpeakerOptionsAreOpen(false);
        } else if (isSpeaker) {
            setSpeakerOptionsAreOpen(!speakerOptionsAreOpen);
            setCameraOptionsAreOpen(false);
            setMicrophoneOptionsAreOpen(false);
        }
    };

    const handleSpeakerMute = () => {
        toggleSpeaker();
    }

    const handleCameraMute = () => {
        toggleCamera();
    }


    const handleMicMute = () => {
        toggleMicrophone();
    }
    return (
        <div className={Style.MyDeviceSelectorContainer}>
            {(cameraOptionsAreOpen && isCam) ||
                (microphoneOptionsAreOpen && isMic) ||
                (speakerOptionsAreOpen && isSpeaker) ? (
                <div className={Style.OptionsContainer}>
                    {data.map((item) => (
                        <Option
                            key={item.deviceId}
                            label={item.label}
                            deviceId={item.deviceId}
                            selectedDevice={selectedDevice}
                            setSelectedDevice={setSelectedDevice}
                            setOptionsAreOpen={handleOptions}
                            switchDevice={switchDevice}
                        />
                    ))}
                </div>
            ) : null}

            <div className={Style.ButtonsContainer}>
                {isCam && (
                    <div className={Style.IconContainer}>
                        <i
                            className={`pi pi-video ${Style.IconCustom} ${!isCameraOn ? Style.DisabledIcon : ''}`}
                            onClick={() => handleCameraMute()}
                        >
                            {!isCameraOn && <div className={Style.Cross}></div>}
                        </i>
                    </div>
                )}
                {isMic && (
                    <div className={Style.IconContainer}>
                        <i
                            className={`pi pi-microphone ${Style.IconCustom} ${!isMicrophoneOn ? Style.DisabledIcon : ''}`}
                            onClick={() => handleMicMute()}
                        >
                            {!isMicrophoneOn && <div className={Style.Cross}></div>}
                        </i>
                    </div>
                )}
                {isSpeaker && (
                    <div className={Style.IconContainer}>
                        <i
                            className={`pi pi-headphones ${Style.IconCustom} ${!isSpeakerOn ? Style.DisabledIcon : ''}`}
                            onClick={() => handleSpeakerMute()}
                        >
                            {!isSpeakerOn && <div className={Style.Cross}></div>}
                        </i>
                    </div>
                )}
                <i
                    className={`pi pi-angle-up ${Style.ArrowCustom}`}
                    onClick={hasDevices ? handleOptions : null}
                ></i>
            </div>


        </div>
    );
};

export default MyDeviceSelector;