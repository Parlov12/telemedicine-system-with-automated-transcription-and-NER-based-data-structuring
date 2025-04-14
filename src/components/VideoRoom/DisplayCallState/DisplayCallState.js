import Style from './DisplayCallState.module.css'

const DisplayCallState = ({callState, states}) => {
    return (  
        <div className={Style.StateManager}>
          <div>CALL STATE:</div>
          <div className={
            callState === states.disconnected ? Style.StateManagerDisconnected :
            callState === states.incall ? Style.StateManagerInCall :
            callState === states.incoming ? Style.StateManagerIncomingCall : 
            callState === states.outgoing ? Style.StateManagerCalling : 
            callState === states.reconnecting ? Style.StateManagerReconnecting :
            callState === states.connecting ? Style.StateManagerConnecting : 
            callState === states.connectionon ? Style.StateManagerConnectionOn :
            'default'
          }>{callState}</div>
        </div>
    );
}
 
export default DisplayCallState;