window.addEventListener('DOMContentLoaded', function(event) {
    console.log("DOM fully loaded and parsed");
    websdkready();
    startCountdown(); 
});

async function getSignature(meetingNumber) {
    try {
        const response = await fetch('http://localhost:8000/zoom-signature.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meetingNumber: meetingNumber,
                role: 0
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to get signature');
        }

        return {
            signature: data.signature,
            sdkKey: data.sdkKey
        };
    } catch (error) {
        console.error('Error getting signature:', error);
        document.getElementById('meeting-status').innerHTML = 
            'Chyba při načítání preview. Prosím obnovte stránku.';
        throw error;
    }
}

function startCountdown() {
    const meetingTime = new Date('2024-12-30T20:00:00');
    const timeDisplay = document.getElementById('time-display');
    const meetingStatus = document.getElementById('meeting-status');

    function updateCountdown() {
        const now = new Date();
        const distance = meetingTime - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timeDisplay.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        if (distance < 0) {
            timeDisplay.innerHTML = "Webinář začíná!";
            meetingStatus.innerHTML = "Můžete se připojit";
        } else {
            meetingStatus.innerHTML = "Prosím počkejte na začátek webináře";
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

async function websdkready() {
    try {
        var testTool = window.testTool;
        if (testTool.isMobileDevice()) {
            vConsole = new VConsole();
        }

        console.log("checkSystemRequirements");
        console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Přednastavené hodnoty meetingu
        const meetingConfig = {
            mn: "92657279932",
            name: "Attendee",
            pwd: "716033",
            role: 0,
            email: "",
            lang: "cs-CZ",
            china: 0
        };

        // Nejprve získáme podpis
        console.log("Getting signature...");
        const { signature, sdkKey } = await getSignature(meetingConfig.mn);
        console.log("Got signature:", signature);
        console.log("Got sdkKey:", sdkKey);

        meetingConfig.signature = signature;
        meetingConfig.sdkKey = sdkKey;

        // Až pak inicializujeme Zoom
        ZoomMtg.init({
            leaveUrl: "/",
            patchJsMedia: true,
            success: function() {
                console.log("Init success");
                
                console.log("Joining with config:", meetingConfig);
                // Připojení k meetingu s preview oknem
                ZoomMtg.join({
                    meetingNumber: meetingConfig.mn,
                    userName: meetingConfig.name,
                    signature: signature,  // použijeme přímo signature
                    sdkKey: sdkKey,      // použijeme přímo sdkKey
                    userEmail: meetingConfig.email,
                    passWord: meetingConfig.pwd,
                    success: function(res) {
                        console.log("Join success");
                        ZoomMtg.getAttendeeslist({});
                        ZoomMtg.getCurrentUser({
                            success: function(res) {
                                console.log("success getCurrentUser", res.result.currentUser);
                            },
                        });
                    },
                    error: function(res) {
                        console.log("Join error:", res);
                        document.getElementById('meeting-status').innerHTML = 
                            'Chyba při připojování k náhledu webináře.';
                    },
                });
            },
            error: function(res) {
                console.log("Init error:", res);
                document.getElementById('meeting-status').innerHTML = 
                    'Chyba při inicializaci náhledu webináře.';
            }
        });

        // Event listenery pro sledování stavu meetingu
        ZoomMtg.inMeetingServiceListener('onUserJoin', function (data) {
            console.log('inMeetingServiceListener onUserJoin', data);
        });

        ZoomMtg.inMeetingServiceListener('onUserLeave', function (data) {
            console.log('inMeetingServiceListener onUserLeave', data);
        });

        ZoomMtg.inMeetingServiceListener('onUserIsInWaitingRoom', function (data) {
            console.log('inMeetingServiceListener onUserIsInWaitingRoom', data);
        });

        ZoomMtg.inMeetingServiceListener('onMeetingStatus', function (data) {
            console.log('inMeetingServiceListener onMeetingStatus', data);
        });

    } catch (error) {
        console.error("Error in websdkready:", error);
        document.getElementById('meeting-status').innerHTML = 
            'Chyba při přípravě webináře. Prosím obnovte stránku.';
    }
}