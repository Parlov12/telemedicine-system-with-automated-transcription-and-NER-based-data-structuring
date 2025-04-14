import { useEffect, useState, useContext } from "react";

// style
import Style from './DeviceSelector.module.css'

// external styles
import 'primeicons/primeicons.css';

// my components
import MyDeviceSelector from "./MyDeviceSelector/MyDeviceSelector";
import EndCallButton from "../EndCallButton/EndCallButton";

// context
import DeviceSelectorContext from "./DeviceSelectorContext";
import VideoRoomContext from "../VideoRoomContext";

const DeviceSelector = ({
  setSelectedAudioInputDeviceId,
  setSelectedAudioOutputDeviceId,
  setSelectedVideoDeviceId,
  selectedAudioInputDeviceId,
  selectedAudioOutputDeviceId,
  selectedVideoDeviceId,
  stopMediaStream,
  localVideoRef,
  remoteVideoRef,
  currentCall,
  handleEndCall,
  setEndCheckCallIsOpen
}) => {



  // devices
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);

  // options controller
  const [microphoneOptionsAreOpen, setMicrophoneOptionsAreOpen] = useState(false);
  const [cameraOptionsAreOpen, setCameraOptionsAreOpen] = useState(false);
  const [speakerOptionsAreOpen, setSpeakerOptionsAreOpen] = useState(false);

  //everything is on at the start
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicrophoneOn, setIsMicrophoneOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);




  // context
  const { setErrorText, setErrorMessageModalIsOpen } = useContext(VideoRoomContext);

  useEffect(() => {
    getDevices();
    // listen for changes to media devices (e.g., new devices connected)
    navigator.mediaDevices.addEventListener('devicechange', getDevices);


    // cleanup the event listener on unmount
    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, []);

  const getDevices = async () => {
    try {

      const devices = await navigator.mediaDevices.enumerateDevices();
      // filter available devices by its type
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');

      // set list of documents with corresponding type
      setVideoDevices(videoInputs);
      setAudioInputDevices(audioInputs);
      setAudioOutputDevices(audioOutputs);

      // Postavljanje prvog uređaja kao podrazumevani izbor
      if (videoInputs.length > 0) {
        setSelectedVideoDeviceId(sessionStorage.getItem('selectedVideoDeviceId') || videoInputs[0].deviceId);
      } else {
        setErrorText('No video input devices found.');
        setErrorMessageModalIsOpen(true);
      }
      if (audioInputs.length > 0) {
        setSelectedAudioInputDeviceId(sessionStorage.getItem('selectedAudioInputDeviceId') || audioInputs[0].deviceId);
      } else {
        setErrorText('No audio input devices found.');
        setErrorMessageModalIsOpen(true);
      }
      if (audioOutputs.length > 0) {
        setSelectedAudioOutputDeviceId(sessionStorage.getItem('selectedAudioOutputDeviceId') || audioOutputs[0].deviceId);
      } else {
        setErrorText('No audio output devices found.');
        setErrorMessageModalIsOpen(true);
      }
    } catch (error) {
      console.error('Error getting devices:', error);
    }
  };


  const switchAudioInputDevice = (deviceId) => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      stopMediaStream(localVideoRef.current.srcObject);

      navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined
        },
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined
        }
      })
        .then((stream) => {
          localVideoRef.current.srcObject = stream;

          if (currentCall) {
            currentCall.peerConnection.getSenders().forEach((sender) => {
              if (sender.track.kind === 'audio') {
                sender.replaceTrack(stream.getAudioTracks()[0]);
              }
            });
          }
        })
        .catch((err) => {
          console.error('Failed to get local stream', err);
        });
    } else {
      console.warn('No local video stream found.');
    }
  };

  const switchAudioOutputDevice = (deviceId) => {
    const videoElement = remoteVideoRef.current;

    if (videoElement && typeof videoElement.sinkId !== 'undefined') {
      videoElement.setSinkId(deviceId)
        .then(() => {
          console.log(`Success, audio output device attached: ${deviceId}`);
        })
        .catch(error => {
          let errorMessage = error;
          if (error.name === 'SecurityError') {
            errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
          }
          console.error('Error during setting audio output device:', errorMessage);
        });
    } else {
      console.warn('Browser does not support output device selection.');
    }
  };

  // switch video device
  const switchVideoDevice = (deviceId) => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      stopMediaStream(localVideoRef.current.srcObject);

      navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined
        },
        audio: {
          deviceId: selectedAudioInputDeviceId ? { exact: selectedAudioInputDeviceId } : undefined
        }
      })
        .then((stream) => {
          localVideoRef.current.srcObject = stream;

          if (currentCall) {
            currentCall.peerConnection.getSenders().forEach((sender) => {
              if (sender.track.kind === 'video') {
                sender.replaceTrack(stream.getVideoTracks()[0]);
              }
            });
          }
        })
        .catch((err) => {
          console.error('Failed to get local stream', err);
        });
    } else {
      console.warn('No local video stream found.');
    }
  };

  const toggleCamera =async () => {
      
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        if (isCameraOn) {
          // Ako je kamera uključena, isključi video stream
          const tracks = localVideoRef.current.srcObject.getVideoTracks();
          tracks.forEach((track) => track.stop());
          setIsCameraOn(false); // Postavi state na false
        } else {
          // Ako je kamera isključena, uključi je ponovno
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined
              },
              audio: {
                deviceId: selectedAudioInputDeviceId ? { exact: selectedAudioInputDeviceId } : undefined
              }
            });
            
            localVideoRef.current.srcObject = stream;
            setIsCameraOn(true); // Postavi state na true
            
            // Ako je poziv aktivan, zamijeni video track u peer connection
            if (currentCall) {
              currentCall.peerConnection.getSenders().forEach((sender) => {
                if (sender.track.kind === 'video') {
                  sender.replaceTrack(stream.getVideoTracks()[0]);
                }
              });
            }
          } catch (err) {
            console.error('Failed to get local stream', err);
          }
        }
      }
        
  };

  const toggleMicrophone = async () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      if (isMicrophoneOn) {
        // Stop the audio tracks to "mute" the microphone
        const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
        audioTracks.forEach((track) => track.enabled = false); // Instead of stop(), just disable
        setIsMicrophoneOn(false);
      } else {
        // Re-enable audio tracks to "unmute" the microphone
        const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks.forEach((track) => track.enabled = true); // Re-enable existing tracks
          setIsMicrophoneOn(true);
        } else {
          // If there are no tracks, get new audio stream
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: selectedAudioInputDeviceId ? { exact: selectedAudioInputDeviceId } : undefined },
              video: false // No need to get video stream here
            });
  
            // Add new audio tracks to the current stream
            stream.getAudioTracks().forEach((track) => localVideoRef.current.srcObject.addTrack(track));
            setIsMicrophoneOn(true);
          } catch (err) {
            console.error('Failed to get local audio stream', err);
          }
        }
  
        // Replace audio track if call is active
        if (currentCall) {
          currentCall.peerConnection.getSenders().forEach((sender) => {
            if (sender.track.kind === 'audio') {
              sender.replaceTrack(localVideoRef.current.srcObject.getAudioTracks()[0]);
            }
          });
        }
      }
    }
  };
  

  const toggleSpeaker = () => {
    const videoElement = remoteVideoRef.current;
  
    if (videoElement && typeof videoElement.sinkId !== 'undefined') {
      if (isSpeakerOn) {
        // When speakers are on, mute them by setting volume to 0
        videoElement.volume = 0;
        setIsSpeakerOn(false);
        console.log('Speakers turned off');
      } else {
        // When speakers are off, restore volume and set to the selected output device
        videoElement.volume = 1; // Restore volume
        videoElement.setSinkId(selectedAudioOutputDeviceId)
          .then(() => {
            console.log('Speakers turned on');
            setIsSpeakerOn(true);
          })
          .catch(error => console.error('Error turning on speakers:', error));
      }
    } else {
      console.warn('Browser does not support output device selection.');
    }
  };
  
  return (
    <DeviceSelectorContext.Provider value={{
      cameraOptionsAreOpen,
      setCameraOptionsAreOpen,
      microphoneOptionsAreOpen,
      setMicrophoneOptionsAreOpen,
      speakerOptionsAreOpen,
      setSpeakerOptionsAreOpen
    }}>
      <div className={Style.DeviceSelectionContainer}>
        <MyDeviceSelector data={audioOutputDevices}
          selectedDevice={selectedAudioOutputDeviceId}
          setSelectedDevice={setSelectedAudioOutputDeviceId}
          isSpeaker={true}
          switchDevice={switchAudioOutputDevice}
          toggleSpeaker={toggleSpeaker}
          isSpeakerOn={isSpeakerOn}

        />
        <MyDeviceSelector data={audioInputDevices}
          selectedDevice={selectedAudioInputDeviceId}
          setSelectedDevice={setSelectedAudioInputDeviceId}
          isMic={true}
          switchDevice={switchAudioInputDevice}
          toggleMicrophone={toggleMicrophone}
          isMicrophoneOn={isMicrophoneOn}
        />
        <MyDeviceSelector data={videoDevices}
          selectedDevice={selectedVideoDeviceId}
          setSelectedDevice={setSelectedVideoDeviceId}
          isCam={true}
          switchDevice={switchVideoDevice}
          toggleCamera={toggleCamera}
          isCameraOn={isCameraOn}
        />


        <EndCallButton setEndCallModalIsVisible={setEndCheckCallIsOpen} />

      </div>
    </DeviceSelectorContext.Provider>
  );
}

export default DeviceSelector;