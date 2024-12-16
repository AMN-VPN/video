class VideoCall {
    constructor() {
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
    }

    initializeButtons() {
        const startButton = document.getElementById('startVideoCall');
        const endButton = document.getElementById('endVideoCall');
        
        if(startButton) startButton.onclick = () => this.startCall();
        if(endButton) endButton.onclick = () => this.endCall();
    }

    async startCall() {
        console.log('Starting video call...');
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                        audio: true 
                    })
            
                    document.getElementById('localVideo').srcObject = this.localStream
                    document.getElementById('videoContainer').style.display = 'flex'
                    document.getElementById('startVideoCall').style.display = 'none'
                    document.getElementById('endVideoCall').style.display = 'block'

                    // ایجاد اتصال WebRTC
                    this.peerConnection = new RTCPeerConnection({
                        iceServers: CONFIG.STUN_SERVERS
                    })

                    // اضافه کردن track های محلی
                    this.localStream.getTracks().forEach(track => {
                        this.peerConnection.addTrack(track, this.localStream)
                    })

                    // مدیریت track های دریافتی
                    this.peerConnection.ontrack = (event) => {
                        document.getElementById('remoteVideo').srcObject = event.streams[0]
                    }

                    // ارسال پیشنهاد تماس به peer دیگر
                    const offer = await this.peerConnection.createOffer()
                    await this.peerConnection.setLocalDescription(offer)

                    // ارسال offer از طریق اتصال موجود
                    connections.forEach(conn => {
                        if (conn.open) {
                            conn.send({
                                type: 'video-offer',
                                offer: offer
                            })
                        }
                    })

                } catch (error) {
                    console.error('خطا در شروع تماس تصویری:', error)
                    alert('خطا در دسترسی به دوربین و میکروفون')
                }
            }

            async handleVideoOffer(offer, conn) {
                try {
                    this.peerConnection = new RTCPeerConnection({
                        iceServers: CONFIG.STUN_SERVERS
                    })

                    this.localStream = await navigator.mediaDevices.getUserMedia({ 
                        video: true, 
                        audio: true 
                    })

                    document.getElementById('localVideo').srcObject = this.localStream
                    document.getElementById('videoContainer').style.display = 'flex'

                    this.localStream.getTracks().forEach(track => {
                        this.peerConnection.addTrack(track, this.localStream)
                    })

                    this.peerConnection.ontrack = (event) => {
                        document.getElementById('remoteVideo').srcObject = event.streams[0]
                    }

                    await this.peerConnection.setRemoteDescription(offer)
                    const answer = await this.peerConnection.createAnswer()
                    await this.peerConnection.setLocalDescription(answer)

                    conn.send({
                        type: 'video-answer',
                        answer: answer
                    })

                } catch (error) {
                    console.error('خطا در پاسخ به تماس تصویری:', error)
                }
            }

            async handleVideoAnswer(answer) {
                try {
                    await this.peerConnection.setRemoteDescription(answer)
                } catch (error) {
                    console.error('خطا در دریافت پاسخ تماس:', error)
                }
            }

            endCall() {
                if (this.localStream) {
                    this.localStream.getTracks().forEach(track => track.stop());
                }
                if (this.peerConnection) {
                    this.peerConnection.close();
                }
        
                document.getElementById('videoContainer').style.display = 'none';
                document.getElementById('startVideoCall').style.display = 'block';
                document.getElementById('endVideoCall').style.display = 'none';
        
                connections.forEach(conn => {
                    if (conn.open) {
                        conn.send({
                            type: 'end-call'
                        });
                    }
                });
            }
}

// ساخت یک نمونه گلوبال
window.videoCall = new VideoCall();const videoCall = new VideoCall();