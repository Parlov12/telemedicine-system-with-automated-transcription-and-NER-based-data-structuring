// service shared by both practitioner and patient

// create peer
export const createPeer = (userId = null, options = {}) => {
    // create a new peer instance
    const peer = new Peer(userId, options)

    peer.on('open', (id) => {
        console.log('Peer connection established with ID', id);
        if(onOpen) onOpen(id); // checks if an onOpen callback function was provided when creating the peer
    })

    peer.on('error', (error) => {
        console.error('Peer connection error:', error);
        if (onError) onError(error); // checks if an onError callback function was provided when creating the peer
    })

    peer.on('disconnected', () => {
        console.error('Peer connection disconnected');
        if (onDisconnected) onDisconnected(); // checks if an onDisconnected callback function was provided when creating the peer
    })

    return peer;
}

// destroy peer
export const closePeer = (peer) => {
    if(peer) {
        peer.destroy();
        console.log("Peer connection closed!");
    }
}