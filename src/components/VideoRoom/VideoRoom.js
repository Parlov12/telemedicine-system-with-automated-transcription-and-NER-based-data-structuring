import Peer from 'peerjs';
import { useRef, useState, useEffect } from 'react';

// used to generate 36-character unique id
import { v4 as uuidv4 } from 'uuid';
import Style from './VideoRoom.module.css';

// importing params so we can use id from url
import { useParams } from 'react-router-dom';
import ConnectingAnimation from '../animations/ConnectingAnimation.js/ConnectingAnimation';

// context
import VideoRoomContext from './VideoRoomContext';
import DeviceSelector from './DeviceSelector/DeviceSelector';

// my components
import ErrorMessageDisplay from './ErrorMessageDisplay/ErrorMessageDisplay';
import DisplayCallState from './DisplayCallState/DisplayCallState.js'
import EndCallButton from './EndCallButton/EndCallButton.js';

// server
const serverConfig = process.env.PEERJS_CONFIG;

const VideoRoom = ({}) => {

  // retrieve the ID from the URL
  // id located in http://.../:id
  const { id } = useParams();

  // custom id - at the moment it is called custom id
  //in the future, it will represent doctor's id but also will 
  //be probable stored in different way
  let customId = localStorage.getItem('userId');

  // used to display local peer's id
  const [localPeerID, setLocalPeerID] = useState('');
  // used to display local peer's id
  const [remotePeerID, setRemotePeerID] = useState('');

  // peerjs reference to start connection
  // reference is used so the connection can be preserved even if webpage is refreshed
  const peerRef = useRef(null);
  // data connection between two peers
  const dataConnectionRef = useRef(null);

  // references for local and remote video stream
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);



  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState('');
  const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState('');
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState('');

  // manage incoming call
  const [modalAnswerCallIsOpen, setModalAnswerCallIsOpen] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);

  // manage outgoing call
  const [callingAnimationIsOpen, setCallingAnimationIsOpen] = useState(false);

  // error state
  const [errorText, setErrorText] = useState('');
  const [errorMessageModalIsOpen, setErrorMessageModalIsOpen] = useState(false);

  const states = {
    disconnected: 'disconnected',    // state before a call is made or after a call ends
    outgoing: 'calling',             // call is being made (outgoing call)
    incoming: 'incoming call',       // incoming call is received but not yet answered
    reconnecting: 'reconnecting',    // call is trying to reconnect after a connection loss
    incall: 'in call',                // call is active and ongoing
    connecting: 'connecting'
  }

  // used to display in which state is call
  const [callState, setCallState] = useState(states.disconnected)


  // when component mounts    
  useEffect(() => {
    // important part!!!
    // since there are two routes which are routing you to VideoRoom, this part is checking that
    // if id already exists, create new peerjs connection with random id(uuid4)
    // if it is not the case, take custom id -> doctor's id and and do nothing -> wait until patient connects to call 
    if (id) {
      peerRef.current = new Peer(uuidv4(), serverConfig);
    } else {
      peerRef.current = new Peer(customId, serverConfig);
    }

    // handling when peer opens       
    peerRef.current.on('open', (id) => {
      setLocalPeerID(id);
      console.log('My peer ID is:', id);
    });

    // handle received call   
    // mediaConntection is not yet active, first call has to be answered
    peerRef.current.on('call', (call) => {

      // state - incoming call
      setCallState(states.incoming);
      sessionStorage.setItem('teleh_video_call_state', states.incoming);
      
      // set up current call state as call
      setCurrentCall(call);

      // open answer call modal - inside modal answer if to answer or not
      setModalAnswerCallIsOpen(true);

      call.on('close', () => {
        // state - disconnected
        setCallState(states.disconnected);
        sessionStorage.setItem('teleh_video_call_state',states.disconnected);

        console.log('Call closed!');
      });
    });

    // on connection event listener - manage incoming data connections
    peerRef.current.on('connection', (connection) => {

      console.log("Someone is trying to establish a data connection...");


      dataConnectionRef.current = connection;

      connection.on('open', () => {
        console.log(`Data connection established with ${connection.peer}`);
      });

      connection.on('data', (data) => {
        
        // handle received
        if (data.type === 'call-declined') {
          console.log('Call was declined by caller');
          setCallingAnimationIsOpen(false);
          // state - disconneted
          setCallState(states.disconnected);
          sessionStorage.setItem('teleh_video_call_state', states.disconnected);

          // let user know that call was canceled
          setErrorText('Poziv odbijen!');
          setErrorMessageModalIsOpen(true);
        } else if(data.type === 'call-ended') {
          console.log('Remote user ended call!');
          setCallingAnimationIsOpen(false);
          // state - disconneted
          setCallState(states.disconnected);
          sessionStorage.setItem('teleh_video_call_state', states.disconnected);

          // let user know that call was canceled
          setErrorText('Remote user ended call!');
          setErrorMessageModalIsOpen(true);
        }
         else {
          console.log('Received data: ', data);
        }
        

      });

      connection.on('close', () => {
        console.log('Data connection closed');
      });

      connection.on('error', (err) => {
        console.error('Data connection error: ', err);
      });

    });


    peerRef.current.on('error', function (err) {
      // TO-DO 
      // hanlde errors
    });

    // if id exists, try to make call
    if (id) {
      makeCall(id);
    }

    // when component unmounts, destroy peerjs connection
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // start call - call user with id = remoteId
  const makeCall = (remoteId) => {
    navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined
      },
      audio: {
        deviceId: selectedAudioInputDeviceId ? { exact: selectedAudioInputDeviceId } : undefined
      }
    })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        // establishing call by calling user with remote id remoteId
        const call = peerRef.current.call(remoteId, stream);

        // set call state
        setCallState(states.outgoing);
        sessionStorage.setItem('teleh_video_call_state', states.outgoing);

        setCurrentCall(call);

        // calling animation
        setCallingAnimationIsOpen(true);

        // handle call itself below

        call.on('stream', (remoteStream) => {
          // set call state - in call
          setCallState(states.incall);
          sessionStorage.setItem('teleh_video_call_state', states.incall);

          // close calling animation
          setCallingAnimationIsOpen(false);

          remoteVideoRef.current.srcObject = remoteStream;
        });

        call.on('close', () => {
          console.log('Call closed!');

          // state - disconnected
          setCallState(states.disconnected);
          sessionStorage.setItem('teleh_video_call_state', states.disconnected);
          
          // stop stream
          stopMediaStream(stream);
          localVideoRef.current.srcObject = null;
        });

        // establishing data connection
        const dataConnection = peerRef.current.connect(remoteId);
        dataConnectionRef.current = dataConnection;

        dataConnection.on('data', (data) => {
          // handle received
          if (data.type === 'call-declined') {
            console.log('Call was declined by caller');
            setCallingAnimationIsOpen(false);
            // state - disconneted
            setCallState(states.disconnected);
            sessionStorage.setItem('teleh_video_call_state', states.disconnected);

            // let user know that call was canceled
            setErrorText('Poziv odbijen!');
            setErrorMessageModalIsOpen(true);
          } else if(data.type === 'call-ended') {
            console.log('Remote user ended call!');
            setCallingAnimationIsOpen(false);
            // state - disconneted
            setCallState(states.disconnected);
            sessionStorage.setItem('teleh_video_call_state', states.disconnected);

            // let user know that call was canceled
            setErrorText('Remote user ended call!');
            setErrorMessageModalIsOpen(true);
          }
           else {
            console.log('Received data: ', data);
          }
        });

        dataConnection.on('close', () => {
          console.log('Data connection closed');
        });

        dataConnection.on('error', (err) => {
          console.error('Data connection error:', err);
        });

      })
      .catch((err) => {
        console.error('Failed to get local stream', err);

        // Handle specific errors
        switch (err.name) {
          case 'NotReadableError':
            setErrorText('Media devices are not readable! Another application may be using it.');
            setErrorMessageModalIsOpen(true);
            break;

          case 'NotAllowedError':
            setErrorText('Permission denied to access media devices. Please allow access to continue.');
            setErrorMessageModalIsOpen(true);
            break;

          case 'NotFoundError':
            setErrorText('No media devices found! Please connect a camera or microphone.');
            setErrorMessageModalIsOpen(true);
            break;

          case 'OverconstrainedError':
            setErrorText('The specified media device constraints could not be satisfied. Please check device settings.');
            setErrorMessageModalIsOpen(true);
            break;

          case 'SecurityError':
            setErrorText('Media device access is blocked due to security settings.');
            setErrorMessageModalIsOpen(true);
            break;

          case 'AbortError':
            setErrorText('Media device access was aborted. Please try again.');
            setErrorMessageModalIsOpen(true);
            break;

          case 'TypeError':
            setErrorText('No media devices were specified. Please select a valid video or audio device.');
            setErrorMessageModalIsOpen(true);
            break;

          default:
            setErrorText('An unknown error occurred while trying to access media devices.');
            setErrorMessageModalIsOpen(true);
            break;
        }
      });
  };

  // answer call
  const handleAcceptCall = () => {

    // hide modal - call
    setModalAnswerCallIsOpen(false);

    // handle answering call 
    // ask first user for permissions to access his camera and microphone
    navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined
      },
      audio: {
        deviceId: selectedAudioInputDeviceId ? { exact: selectedAudioInputDeviceId } : undefined
      }
    })
    .then((stream) => {
      // state - connecting
      setCallState(states.connecting);
      sessionStorage.setItem('teleh_video_call_state', states.connecting);

      localVideoRef.current.srcObject = stream;

      // currentCall - call we set up inside useEffect when call is received(on.('call',....))
      currentCall.answer(stream);

      currentCall.on('stream', (remoteStream) => {
        // state - in call
        setCallState(states.incall);
        sessionStorage.setItem('teleh_video_call_state', states.incall);

        remoteVideoRef.current.srcObject = remoteStream;
      });

    })
    .catch((err) => {
      console.error('Failed to get local stream', err);
      // Handle specific errors
      switch (err.name) {
        case 'NotReadableError':
          setErrorText('Media devices are not readable! Another application may be using it.');
          setErrorMessageModalIsOpen(true);
          break;

        case 'NotAllowedError':
          setErrorText('Permission denied to access media devices. Please allow access to continue.');
          setErrorMessageModalIsOpen(true);
          break;

        case 'NotFoundError':
          setErrorText('No media devices found! Please connect a camera or microphone.');
          setErrorMessageModalIsOpen(true);
          break;

        case 'OverconstrainedError':
          setErrorText('The specified media device constraints could not be satisfied. Please check device settings.');
          setErrorMessageModalIsOpen(true);
          break;

        case 'SecurityError':
          setErrorText('Media device access is blocked due to security settings.');
          setErrorMessageModalIsOpen(true);
          break;

        case 'AbortError':
          setErrorText('Media device access was aborted. Please try again.');
          setErrorMessageModalIsOpen(true);
          break;

        case 'TypeError':
          setErrorText('No media devices were specified. Please select a valid video or audio device.');
          setErrorMessageModalIsOpen(true);
          break;

        default:
          setErrorText('An unknown error occurred while trying to access media devices.');
          setErrorMessageModalIsOpen(true);
          break;
      }
    });

  }

  // handle declining call
  const handleDeclineCall = () => {
    // check if current call exists
    console.log("Clicked handleDeclineCall");
    if (currentCall) {
      // if it exists, close it
      currentCall.close();

      // state - disconnected
      setCallState(states.disconnected);
      sessionStorage.setItem('teleh_video_call_state', states.disconnected);

      // 


      console.log('Call declined!');

      const data = {
        type: 'call-declined',
        content: 'Call was declined!'
      }
      sendData(data);

      //set current call as null
      setCurrentCall(null);
      setModalAnswerCallIsOpen(false);
    }
  }

  const handleEndCall = () => {
    console.log('Clicked handleEndCall!');
    if (currentCall) {
      // if it exists, close it
      currentCall.close();

      // state - disconnected
      setCallState(states.disconnected);
      sessionStorage.setItem('teleh_video_call_state', states.disconnected);

      // 


      console.log('Call ended!');

      const data = {
        type: 'call-ended',
        content: 'Peer ended call!'
      }
      sendData(data);

      //set current call as null
      setCurrentCall(null);
      setModalAnswerCallIsOpen(false);
    }
  }

  const stopMediaStream = (stream) => {
    stream.getTracks().forEach(track => track.stop());
  };

  // send data message
  const sendData = (data) => {
    if (dataConnectionRef.current && dataConnectionRef.current.open) {
      try {
        dataConnectionRef.current.send(data);
        console.log('Sent data: ', data);
      } catch (error) {
        console.log('Error while sending data message!\nError: ', error);
      }

    } else {
      console.log('Data connection is not open!');
    }
  }

  const handleErrorMessage = () => {
    setErrorMessageModalIsOpen(!errorMessageModalIsOpen);
  }


  return (
    <VideoRoomContext.Provider value={{
      selectedAudioInputDeviceId,
      selectedAudioOutputDeviceId,
      selectedVideoDeviceId
    }}>

      <div className={Style.VideoRoomContainer}>


        <div className={Style.VideoHeader}>
            <p>Lorem ipsum </p>
        </div>


        <div className={Style.VideoContent}>
          <video className={Style.RemoteVideo} ref={remoteVideoRef} autoPlay>
            <div className={Style.DefaultUserBackground}></div>
          </video>
          <video className={Style.LocalVideo} ref={localVideoRef} autoPlay muted></video>
          {modalAnswerCallIsOpen &&
            <div className={Style.AnswerCallContainer}>
              <button className={Style.AcceptCallButton} onClick={() => handleAcceptCall()}>Accept </button>
              <button className={Style.DeclineCallButton} onClick={() => handleDeclineCall()}>Decline</button>
            </div>
          }
          
          {/* TEST START*/}
          {/* <DisplayCallState callState={callState} states={states}/> */}
          <div style={{position: 'absolute', bottom: '0', left: '0', marginBottom: '20px', marginLeft: '10px', zIndex: '100'}}>{customId}</div>
          {/* TEST END */}
          {errorMessageModalIsOpen &&
            <ErrorMessageDisplay handleErrorMessage={handleErrorMessage} errorText={errorText} />
          }
          {callingAnimationIsOpen && <ConnectingAnimation />}
        </div>


        <div className={Style.VideoFooter}>
          {/* DEVICE SELECTOR + END CALL BUTTON IS INSIDE IT */}
          <DeviceSelector
            setSelectedAudioInputDeviceId={setSelectedAudioInputDeviceId}
            setSelectedAudioOutputDeviceId={setSelectedAudioOutputDeviceId}
            setSelectedVideoDeviceId={setSelectedVideoDeviceId}
            selectedAudioInputDeviceId={selectedAudioInputDeviceId}
            selectedAudioOutputDeviceId={selectedAudioOutputDeviceId}
            selectedVideoDeviceId={selectedVideoDeviceId}
            stopMediaStream={stopMediaStream}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            currentCall={currentCall}
            handleEndCall={handleEndCall}
          />
        </div>
      </div>

    </VideoRoomContext.Provider>
  );
};

export default VideoRoom;
