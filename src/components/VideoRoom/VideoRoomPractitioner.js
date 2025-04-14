import Peer from 'peerjs';
import { useRef, useState, useEffect, useContext } from 'react';

// used to generate 36-character unique id
import { v4 as uuidv4 } from 'uuid';
import Style from './VideoRoomPractitoner.module.css';

// importing params so we can use id from url
import { useParams } from 'react-router-dom';
import ConnectingAnimation from '../animations/ConnectingAnimation.js/ConnectingAnimation';

// context
import VideoRoomContext from './VideoRoomContext';
import DeviceSelector from './DeviceSelector/DeviceSelector';
import ReportForm from './ReportForm/ReportForm.js';
import EncounterInfo from './EncounterInfo/EncounterInfo.js';
import Chat from './Chat/Chat.js';

// my components
import ErrorMessageDisplay from './ErrorMessageDisplay/ErrorMessageDisplay';
import DisplayCallState from './DisplayCallState/DisplayCallState.js'
import EndCallButton from './EndCallButton/EndCallButton.js';
import InternetConnectionStatusDisplay from './InternetConnectionStatusDisplay/InternetConnectionStatusDisplay.js';
import EndCallCheck from './EndCallCheck/EndCallCheck';


const serverConfig = {
  host: '20a9-161-53-38-197.ngrok-free.app',
  port: 443,
  path: '/peerjs/videocall',
  secure: true,
};



const VideoRoomPractitioner = ({ }) => {

  // retrieve the ID from the URL
  // id located in http://.../:id
  const { encId, appId } = useParams();
  // const [encounterID,setEncounterId]=useState(id); 
  //console.log(encId);

  // custom id - at the moment it is called custom id
  //in the future, it will represent doctor's id but also will 
  //be probable stored in different way
  let customId = appId;


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
    disconnected: 'disconnected',     // state before a call is made or after a call ends
    disconnecting: 'disconnecting',   // call is being disconnected
    outgoing: 'calling',              // call is being made (outgoing call)
    incoming: 'incoming call',        // incoming call is received but not yet answered
    reconnecting: 'reconnecting',     // call is trying to reconnect after a connection loss
    incall: 'in call',                // call is active and ongoing
    connecting: 'connecting',         // call is being answered (incoming call)
    connectionon: 'connectionon',     // connection is On - peer connected with PeerJS server
    finished: 'finished'              // call finished
  }

  // used to display in which state is call
  const callState = useRef(states.disconnected);

  const [callStateDisplay, setCallStateDisplay] = useState(callState.current);

  
  // chat messages array - all the messages are stored here
  const [chatMessages, setChatMessages] = useState([]);

  // data connection status
  const [dataConnectionStatus, setDataConnectionStatus] = useState(false);

  // internet connection status
  const [internetConnectionStatus, setInternetConnectionStatus] = useState(true);

    // end call modal - visibility
    const [endCallCheckIsOpen, setEndCallCheckIsOpen] = useState(false);

  // when component mounts    
  useEffect(() => {
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


    // initialize new peer
    // if call is in the state that is disconnected - initialize new peer again
    if (callState.current === states.disconnected) {  
      initializePeer();
    }

    // when component unmounts, destroy peerjs connection
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      // remove event listeners
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const initializePeer = () => {

    // practitioner
    // customId - practitioner id passed to component
    peerRef.current = new Peer(customId, {
      host: '20a9-161-53-38-197.ngrok-free.app',
      port: 443,
      path: '/peerjs/videocall',
      secure: true,
    });

    // check if there is remotePeerID in session storage
    // if it exists, set it as remotePeerID
    // and it will be used for reconnection
    if (sessionStorage.getItem('remotePeerID')) {
      setRemotePeerID(sessionStorage.getItem('remotePeerID'));
    }


    // load state from session storage
    if (sessionStorage.getItem('teleh_video_call_state')) {
      manageCallState(sessionStorage.getItem('teleh_video_call_state'));
    }

    console.log('PeerJS server config:', {
      host: '20a9-161-53-38-197.ngrok-free.app',
      port: 443,
      path: '/peerjs/videocall',
      secure: true,
    });
    
    // handling when peer opens       
    peerRef.current.on('open', (id) => {
      // state - connection ON
      manageCallState(states.connectionon);

      setLocalPeerID(id);
      console.log('My peer ID is:', id);
    });

    // handle received call   
    // mediaConntection is not yet active, first call has to be answered
    peerRef.current.on('call', (call) => {
      console.log('Call incoming')
      // state - incoming call
      manageCallState(states.incoming);

      // set up current call state as call
      setCurrentCall(call);

      // open answer call modal - inside modal answer if to answer or not
      setModalAnswerCallIsOpen(true);
      //handleAcceptCall()

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

      dataConnectionRef.current.on('close', () => {
        console.log('Data connection closed');

        // set data connection status
        setDataConnectionStatus(false);
      });

      dataConnectionRef.current .on('error', (err) => {
        console.error('Data connection error: ', err);
      });

    });

    peerRef.current.on('disconnected', () => {
      console.log('Peer connection disconnected!');
      // try to connect to server again
      attemptReconnect();
      // state - reconnecting to server
      manageCallState(states.reconnecting);
    });


    peerRef.current.on('close', () => {
      console.log('Peer connection closed!');
    });

    peerRef.current.on('error', function (err) {
      // TO-DO 
      // hanlde errors
    });
  }

  const attemptReconnect = () => {
    if (peerRef.current && !peerRef.current.disconnected) {
      peerRef.current.reconnect();
    } else {
      // try to connect to server
      
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        initializePeer();
      }, 3000);
    }
  }


  // answer call
  const handleAcceptCall = async () => {

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
        manageCallState(states.connecting);

        localVideoRef.current.srcObject = stream;

        // currentCall - call we set up inside useEffect when call is received(on.('call',....))
        currentCall.answer(stream);

        currentCall.on('stream', (remoteStream) => {
          // state - in call
          manageCallState(states.incall);

          remoteVideoRef.current.srcObject = remoteStream;
        });

        currentCall.on('close', () => {
          console.log('Call closed!');
          // state - disconnected
          manageCallState(states.disconnected);
          // stop stream
          stopMediaStream(stream);
          localVideoRef.current.srcObject = null;

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

      // state - disconnecting
      manageCallState(states.disconnecting);

      console.log('Call declined!');

      const data = {
        type: 'call-declined',
        content: 'Call was declined!'
      }
      // inform user that call was declined
      sendData(data);

      // close data connection
      dataConnectionRef.current.close()

      //set current call as null
      setCurrentCall(null);
      setModalAnswerCallIsOpen(false);

      // call disconnected
      manageCallState(states.disconnected);
    }
  }

  const handleEndCall = () => {
    console.log('Clicked handleEndCall!');
    if (currentCall || dataConnectionRef.current) {
      // state - disconnecting
      manageCallState(states.disconnecting);

      console.log('Call ended!');

      const data = {
        type: 'call-ended',
        content: 'Peer ended call!'
      }
      // inform user that you ended call
      sendData(data);

      // close data connection between them
      dataConnectionRef.current.close();

      // if it exists, close it
      if(currentCall) {
        currentCall.close();
      }
      

      //set current call as null
      setCurrentCall(null);
      setModalAnswerCallIsOpen(false);

      manageCallState(states.disconnected);
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
        {!internetConnectionStatus && <InternetConnectionStatusDisplay/>}
        
        {endCallCheckIsOpen && <EndCallCheck endCall={handleEndCall} setModalVisible={setEndCallCheckIsOpen} isPractitioner={true}/>}

        <div className={Style.VideoHeader}>
          <p style={{}}>Encounter #{encId} </p>
        </div>


        <div className={Style.VideoContent}>

          <div className={Style.VideoContainer}>
            <DisplayCallState callState={callStateDisplay} states={states} />
            <video className={Style.RemoteVideo} ref={remoteVideoRef} autoPlay>
              <div className={Style.DefaultUserBackground}></div>
            </video>
            <video className={Style.LocalVideo} ref={localVideoRef} autoPlay muted></video>

            {errorMessageModalIsOpen &&
              <ErrorMessageDisplay  className={Style.ErrorMessageContainer} handleErrorMessage={handleErrorMessage} errorText={errorText} />
            }
            {callingAnimationIsOpen && <ConnectingAnimation />}

            {modalAnswerCallIsOpen &&
              <div className={Style.AnswerCallContainer}>
                <h3 className={Style.CallMessage}>Patient is trying to join a call</h3>
                <div className={Style.CallButtons}>
                  <button className={Style.AcceptCallButton} onClick={() => handleAcceptCall()}>Accept </button>
                  <button className={Style.DeclineCallButton} onClick={() => handleDeclineCall()}>Decline</button>
                </div>
              </div>
            }

          </div>
          <div className={Style.DetailsAndForm}>
            {/* <EncounterInfo encounterId={encId} /> */}
            <ReportForm encounterId={encId} />
            <Chat sendMessage={sendData} messages={chatMessages} setMessages={setChatMessages} dataConnectionStatus={dataConnectionStatus}/>
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

export default VideoRoomPractitioner;