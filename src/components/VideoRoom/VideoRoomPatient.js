import Peer from 'peerjs';
import { useRef, useState, useEffect } from 'react';

// used to generate 36-character unique id
import { v4 as uuidv4 } from 'uuid';
import Style from './VideoRoomPatient.module.css';

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
import ReconnectionDisplay from './ReconnectionDisplay/ReconnectionDisplay.js';
import InternetConnectionStatusDisplay from './InternetConnectionStatusDisplay/InternetConnectionStatusDisplay.js';
import Chat from './Chat/Chat';
import EndCallCheck from './EndCallCheck/EndCallCheck.js';

// server
const serverConfig = {
  host: '4907-161-53-38-197.ngrok-free.app',
  port: 443,
  path: '/peerjs/videocall',
  secure: true,
};


const VideoRoomPatient = ({ }) => {

  // retrieve the ID from the URL
  // id located in http://.../:id
  const { appId } = useParams();

  // custom id - at the moment it is called custom id
  //in the future, it will represent doctor's id but also will 
  //be probable stored in different way
  let customId = uuidv4();

  // used to display local peer's id
  const [localPeerID, setLocalPeerID] = useState('');
  // used to display remote peer's id
  const [remotePeerID, setRemotePeerID] = useState(appId);
  sessionStorage.setItem('telehRemotePeerID', appId);
  
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

  // reconnection
  const [reconnectionMessageText, setReconnectionMessageText] = useState('Connection was interrupted!');

  const states = {
    disconnected: 'disconnected',    // state before a call is made or after a call ends
    disconnecting: 'disconnecting',
    outgoing: 'calling',             // call is being made (outgoing call)
    incoming: 'incoming call',       // incoming call is received but not yet answered
    reconnecting: 'reconnecting',    // call is trying to reconnect after a connection loss
    incall: 'in call',                // call is active and ongoing
    connecting: 'connecting'         // call is being answered (incoming call)
  }

  // used to display in which state is call
  const callState = useRef(states.disconnected)
  
  // callState text
  const [callStateDisplay, setCallStateDisplay] = useState(callState.current);

  // reconnect button - visibility
  const [reconnectButtonIsOpen, setReconnectButtonIsOpen] = useState(false);

  // internet connection status
  const [internetConnectionStatus, setInternetConnectionStatus] = useState(true);

  // check if call is answered or no
  const isCallAnswered = useRef(false);

  // number of call attempts
  const [callAttempts, setCallAttempts] = useState(0);
  
  const [isCalling, setIsCalling] = useState(false);

  const [callFinishedMessageIsOpen, setCallFinishedMessageIsOpen] = useState(false);

  // chat messages array - all the messages are stored here
  const [chatMessages, setChatMessages] = useState([]);

  // data connection status
  const [dataConnectionStatus, setDataConnectionStatus] = useState(false);

  // end call modal - visibility
  const [endCallCheckIsOpen, setEndCallCheckIsOpen] = useState(false);

  // when component mounts    
  useEffect(() => {
    console.log('Component mounting!');
    setReconnectButtonIsOpen(false);
    // get initial connection status when component mounts so it can be checkes
    setInternetConnectionStatus(navigator.onLine);

    // manage internet connection status - if OFFLINE
    const handleOffline = () => {
      console.log('No internet connection');
      setInternetConnectionStatus(false);
    };
  
    // manage internet connection status - if ONLINE
    const handleOnline = () => {
      console.log('Back online');
      setInternetConnectionStatus(true);
    };

    // set connection event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // get all neccessary permission immediately
    getPermissions();

    // important part!!!
    // since there are two routes which are routing you to VideoRoom, this part is checking that
    // if id already exists, create new peerjs connection with random id(uuid4)
    // if it is not the case, take custom id -> doctor's id and and do nothing -> wait until patient connects to call 
    if (appId) {
      attemptReconnect(15);
    } else {
      console.log('Please pass id through url...');
    }

    // when component unmounts, destroy peerjs connection
    return () => {
      console.log('Component dismounting!');

      if (peerRef.current) {
        peerRef.current.destroy();
      }

      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);



  const initializePeer = () => {

    // practitioner
    console.log('Trying to create new peer!');
    peerRef.current = new Peer(uuidv4(), {
      host: '20a9-161-53-38-197.ngrok-free.app',
      port: 443,
      path: '/peerjs/videocall',
      secure: true,
    });
    // check if there is remotePeerID in session storage
    // if it exists, set it as remotePeerID
    // and it will be used for reconnection

    if(sessionStorage.getItem('teleh_video_call_state')) {
      manageCallState(sessionStorage.getItem('teleh_video_call_state'));
      setCallStateDisplay(sessionStorage.getItem('teleh_video_call_state'));
    }

    console.log('PeerJS server config:', {
      host: '20a9-161-53-38-197.ngrok-free.app',
      port: 443,
      path: '/peerjs/videocall',
      secure: true,
    });

    // handling when peer opens       
    peerRef.current.on('open', (id) => {
      setLocalPeerID(id);
      console.log('My peer ID is:', id);
      setReconnectButtonIsOpen(false);
    });

    // handle received call   
    // mediaConntection is not yet active, first call has to be answered
    peerRef.current.on('call', (call) => {
      // state - incoming call
      manageCallState(states.incoming);
      setCallStateDisplay(states.incoming);

      // set up current call state as call
      setCurrentCall(call);

      // open answer call modal - inside modal answer if to answer or not
      setModalAnswerCallIsOpen(true);

      // set remote peer id - later can be used for reconnection
      setRemotePeerID(call.peer)
      
    });

    // on connection event listener - manage incoming data connections
    peerRef.current.on('connection', (connection) => {

      console.log("Someone is trying to establish a data connection...");

      dataConnectionRef.current = connection;

      dataConnectionRef.current.on('open', () => {
        console.log(`Data connection established with ${connection.peer}`);
        
        // set data connection status
        setDataConnectionStatus(true);

      });

      dataConnectionRef.current.on('data', (data) => {

        // handle received
        if (data.type === 'call-declined') {
          console.log('Call was declined by caller');
          setCallingAnimationIsOpen(false);
          // state - disconneted
          manageCallState(states.disconnected);
          setCallStateDisplay(states.disconnected);

          // let user know that call was canceled
          setErrorText('Poziv odbijen!');
          setErrorMessageModalIsOpen(true);
        } else if (data.type === 'call-ended') {
          console.log('Remote user ended call!');
          setCallingAnimationIsOpen(false);
          // state - disconneted
          manageCallState(states.disconnected);
          setCallStateDisplay(states.disconnected);

          // let user know that call was canceled
          setErrorText('Remote user ended call!');
          setErrorMessageModalIsOpen(true);
        }
        else {
          console.log('Received data: ', data);
        }

      });

      dataConnectionRef.current.on('close', () => {
        console.log('Data connection closed');

        // set data connection status
        setDataConnectionStatus(false);
        
        // let user know that data connection was closed
        setReconnectButtonIsOpen(true);
      });

      dataConnectionRef.current.on('error', (err) => {
        console.error('Data connection error: ', err);

      });

    });

    peerRef.current.on('disconnected', () => {
      console.log('Peer connection disconnected!');
      setReconnectButtonIsOpen(true);

      // set data connection status
      setDataConnectionStatus(false);

      // try to reconnect
      peerRef.current.reconnect();
    });


    peerRef.current.on('close', () => {
      console.log('Peer connection closed!');

      // set data connection status
      setDataConnectionStatus(false);

    });

    peerRef.current.on('error', function (err) {
      // TO-DO 
      // hanlde errors
    });
  }

  const attemptReconnect = async (numberOfTries) => {

    // first make connection with peerjs server
    await initializePeer();

    // start interval
    const intervalId = setInterval(() => {

      // update attempts
      setCallAttempts(prevAttempts => {
          // increment attemps
          if(prevAttempts === 0) {
            makeCall(appId);
          }
          const newAttempts = prevAttempts + 1;
            
          console.log(newAttempts, '. trying to call...');

          // if number of attempts is 5 or if the call has been answered
          if (newAttempts >= numberOfTries || isCallAnswered.current) {
              // clear interval
              clearInterval(intervalId);
              setCallingAnimationIsOpen(false);
    

              // if the call has not be answered after 5 attempts, do something
              if (!isCallAnswered.current) {
                  // handle not answered
                  setCallingAnimationIsOpen(false);
                  setReconnectionMessageText('No answer! Press button below and try again!');
                  setReconnectButtonIsOpen(true);
                  manageCallState(states.disconnected);
              }
          } else {
              // calling doctor
              console.log('Call attempt!')
              makeCall(appId);
          }

          // return number of attempts so it can be checked if it exceeded number of tries
          return newAttempts;
      });
    }, 3000); // 6 seconds(6000 miliseconds)

    setCallAttempts(0);
  };


  // start call - call user with id = remoteId
  const makeCall = (remoteId) => {
    // if call is already in 
    if(isCalling) {
      currentCall.close();
      setCurrentCall(null);
    };


    setIsCalling(true);

    manageCallState(states.outgoing);

    // asking local permissions
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
      if(callState.current !== states.reconnecting) {
        // if call is not trying to reconnect, set call state to be outgoing
        manageCallState(states.outgoing);  
      }
        
      setCurrentCall(call);

      // calling animation
      setCallingAnimationIsOpen(true);

      // handle call itself below

      call.on('stream', (remoteStream) => {
        // set call state - in call
        manageCallState(states.incall);
        // set call is answered
        isCallAnswered.current = true;

        // close calling animation
        setCallingAnimationIsOpen(false);
        sendData({ type: 'greeting', content: 'Hello! Thank you for answering my call!' });
        remoteVideoRef.current.srcObject = remoteStream;

        setIsCalling(false);
      });

      call.on('close', () => {
        // if call's last state is not incall
        console.log('Call closed.(inside makeCall function)');
        console.log('Last known call state: ', callState.current); 

        // stop stream
        stopMediaStream(stream);

        localVideoRef.current.srcObject = null;

        // set call is answered - false
        isCallAnswered.current = false;
        
        // open reconnection display
        setReconnectButtonIsOpen(true);
      });

    })
    .catch((err) => {
      console.error('Failed to get local stream', err);
      setIsCalling(false);
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

    // establish data connection
    establishDataConnection(remoteId);
  };

  const establishDataConnection = (remoteId) => {
    // establishing data connection - for user who is calling
    const dataConnection = peerRef.current.connect(remoteId);
    dataConnectionRef.current = dataConnection;

    dataConnection.on('open', () => {
      setDataConnectionStatus(true);
    })

    dataConnection.on('data', (data) => {
      // handle received
      if (data.type === 'call-declined') {
        console.log('Call was declined by caller');
        setCallingAnimationIsOpen(false);
        // state - disconneted
        manageCallState(states.disconnected);

        // let user know that call was canceled
        setErrorText('Poziv odbijen!');
        setErrorMessageModalIsOpen(true);
      } else if (data.type === 'call-ended') {
        console.log('Remote user ended call!');
        setCallingAnimationIsOpen(false);
        // state - disconneted
        manageCallState(states.finished);

        // let user know that call was canceled
        // setErrorText('Remote user ended call!');
        // setErrorMessageModalIsOpen(true);
        setCallFinishedMessageIsOpen(true);
      } else if(data.type === 'chat-message') {
        // set message type to receiver
        let incomingMessage = data.msg;
        incomingMessage.type = 'receiver';
        console.log('Received chat message: ', data);
        setChatMessages(prevMessages => [...prevMessages, data.msg]);

        // send back confirmation that message was received
        sendData({ type: 'chat-message-confirmation', id: data.msg.id });
      } else if(data.type === 'chat-message-confirmation') { 
        console.log('Received chat message confirmation: ', data);
        // go through all messages and set status to received
        setChatMessages(prevMessages => 
          prevMessages.map(message => {
            if(message.id === data.id) {
              return {
                ...message,
                status: 'delivered'
              }
            } else {
              return message;
            }
          })
        );
      }
      else {
        console.log('Received data: ', data);
      }
    });

    dataConnection.on('close', () => {
      setDataConnectionStatus(false);
    });

    dataConnection.on('error', (err) => {
      console.error('Data connection error:', err);
    });
  }

  const initialConnection = async () => {
    await initializePeer();
    makeCall(appId);
  }


  const handleEndCall = () => {
    console.log('Clicked handleEndCall!');
    if (currentCall || dataConnectionRef.current) {
      // if it exists, close it
      if(currentCall) {
        currentCall.close();
      }

      // state - disconnecting
      manageCallState(states.disconnecting);

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

  const sendDataCheck = () => {

  }

  const handleErrorMessage = () => {
    setErrorMessageModalIsOpen(!errorMessageModalIsOpen);
  }

  const getPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
    } catch (error) {
      console.error('Error getting permissions:', error);
    }

  }

  const finishCall = () => {
    setCallFinishedMessageIsOpen(!callFinishedMessageIsOpen);
  }

  const manageCallState = (state) => {
    callState.current = state;
    setCallStateDisplay(state);
    sessionStorage.setItem('teleh_video_call_state', state);
    console.log('Call state: ', state);
  }

  return (
    <VideoRoomContext.Provider value={{
      selectedAudioInputDeviceId,
      selectedAudioOutputDeviceId,
      selectedVideoDeviceId,
      setErrorText,
      setErrorMessageModalIsOpen
    }}>

      <div className={Style.VideoRoomContainer}>
        
        {endCallCheckIsOpen && <EndCallCheck endCall={handleEndCall} setModalVisible={setEndCallCheckIsOpen} finishCall={setCallFinishedMessageIsOpen}/>}

        {callFinishedMessageIsOpen && 
          <div className={Style.CallFinishedContainer}>
            <div className={Style.CallFinishedMessage}>Call ended</div>
            <button className={Style.CallFinishedButton} onClick={() => finishCall()}>Exit call</button>
          </div>
        } 

        <div className={Style.VideoHeader}>
          <p>Encounter #1234 </p>
        </div>


        <div className={Style.VideoContent}>

          {!internetConnectionStatus && <InternetConnectionStatusDisplay/>}

          <div className={Style.VideoContainer}>
            <DisplayCallState callState={callStateDisplay} states={states} />
            <video className={Style.RemoteVideo} ref={remoteVideoRef} autoPlay>
              <div className={Style.DefaultUserBackground}></div>
            </video>
            <video className={Style.LocalVideo} ref={localVideoRef} autoPlay muted></video>
            {/* ANIMATIONS AND MODALS */}
            {callingAnimationIsOpen && <ConnectingAnimation />}
            
            {reconnectButtonIsOpen && 
              <ReconnectionDisplay 
                triggerReconnection={() => attemptReconnect(4)} 
                setReconnectButtonIsOpen={setReconnectButtonIsOpen} 
                reconnectionMessage={reconnectionMessageText}
                setReconnectionMessageText={setReconnectionMessageText}
                setCallAttempts={setCallAttempts}
              />
            }

            {errorMessageModalIsOpen && <ErrorMessageDisplay handleErrorMessage={handleErrorMessage} errorText={errorText} />}

            

            

          </div>
          <div className={Style.SideSection}>
            <Chat sendMessage={sendData} setMessages={setChatMessages} messages={chatMessages} dataConnectionStatus={dataConnectionStatus} width={'100%'} height={'100%'}/>
          </div>
          

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
            setEndCheckCallIsOpen={setEndCallCheckIsOpen}
          />
        </div>
      </div>

    </VideoRoomContext.Provider>
  );
};

export default VideoRoomPatient;