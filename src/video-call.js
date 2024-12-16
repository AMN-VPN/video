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
        try {
            // اول فقط درخواست دسترسی به دوربین میکنیم
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: true
            });
        
            this.localStream = stream;
            const localVideo = document.getElementById('localVideo');
            if(localVideo) {
                localVideo.srcObject = stream;
            }

            document.getElementById('videoContainer').style.display = 'flex';
            document.getElementById('startVideoCall').style.display = 'none';
            document.getElementById('endVideoCall').style.display = 'block';

            // بقیه کد تماس...
        
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
            if (error.name === 'NotFoundError') {
                alert('لطفا مطمئن شوید که دوربین و میکروفون به سیستم متصل هستند');
            } else if (error.name === 'NotAllowedError') {
                alert('لطفا دسترسی به دوربین و میکروفون را تایید کنید');
            } else {
                alert('خطا در برقراری تماس تصویری');
            }
            console.error('Error accessing media devices:', error);
        }
    }
            async handleVideoOffer(offer, conn) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: "user"
                        },
                        audio: true
                    })

                    this.localStream = stream
                    const localVideo = document.getElementById('localVideo')
                    if(localVideo) {
                        localVideo.srcObject = stream
                    }

                    document.getElementById('videoContainer').style.display = 'flex'
                    document.getElementById('startVideoCall').style.display = 'none'
                    document.getElementById('endVideoCall').style.display = 'block'

                    this.peerConnection = new RTCPeerConnection({
                        iceServers: CONFIG.STUN_SERVERS
                    })

                    stream.getTracks().forEach(track => {
                        this.peerConnection.addTrack(track, stream)
                    })

                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
                    const answer = await this.peerConnection.createAnswer()
                    await this.peerConnection.setLocalDescription(answer)

                    conn.send({
                        type: 'video-answer',
                        answer: answer
                    })

                } catch (error) {
                    console.error('خطا در پاسخ به تماس تصویری:', error)
                    if (error.name === 'NotFoundError') {
                        alert('دوربین یا میکروفون در دسترس نیست')
                    }
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
