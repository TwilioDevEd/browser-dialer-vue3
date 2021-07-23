<template>
  <main>
    <h1>Twilio JavaScript Voice SDK - Vue3 Tutorial</h1>
    <div v-if="!deviceInitialized">
      <form>
        <input placeholder="Enter name" v-model="clientName" />
        <button :disabled="clientName == ''" @click.prevent="initializeDevice()">Initialize Device</button>
      </form>
    </div>
    <section class="browser-dialer" v-if="deviceInitialized"> 
      <div class="call-controls">
        <h2>Client Name: {{clientName}}</h2>

          <!-- Telephone number input field -->
          <div>
            <input  
              :disabled="twilioCall"
              type="tel" 
              v-model="currentNumber"
              placeholder="+15556667777"
            >

            <button :disabled="!currentNumber" @click="backspaceDigit">Backspace</button>
            <button :disabled="!currentNumber" @click="clearCurrentNumber">Clear</button>
          </div>

          <!-- Show which keys have been pressed for call in progress -->
          <div class="current-call">
            <p v-if="twilioCall">
              {{ currentNumber }} {{inputDigits}}
            </p>
          </div>


          <!-- Audio Controls -->
          <div class="controls">
            <button 
              :disabled="!!twilioCall || !deviceInitialized ||!currentNumber" @click="makeCall()">
              Make a call
            </button>
            <button :disabled="!twilioCall" @click="hangupCall()">
              Hang Up
            </button>
            <button :disabled="!twilioCall" @click="toggleMute()">
              {{ isMuted ? "Unmute" : "Mute" }}
            </button>
          </div>

        </div>

      <!-- Keypad/DTMF Tone interface -->
      <div class="keypad">
        <ul class="keypad-keys">
          <li v-for="button in buttonMappings" :key="button.index">
            <button @click="sendDigit(button.digit)">{{ button.digit }}
              <span v-if="button.alpha">{{ button.alpha }}</span>
            </button>
          </li>
        </ul>       
      </div>

      <!-- Status logging -->
      <div>
        <h2>Twilio Device Activity Log</h2>
        <ul class="log">
          <li 
            v-bind:key="logMessage.index" 
            v-for="logMessage in logMessages"
          >
            {{logMessage}}
          </li>
        </ul>
      </div>

    </section>


  </main>
</template>

<script>
import { Device } from '@twilio/voice-sdk';

export default {
  name: 'BrowserDialer',
  props: {
    msg: String
  },
  data() {
    return {
      token: null,
      muted: false,
      logMessages: [],
      currentNumber: '',
      clientName: '',
      inputDigits: '',
      twilioCall: null,
      deviceInitialized: false,
      isMuted: false,
      keypadElements: [],
      buttonMappings: [
        { digit: '1', alpha: null },
        { digit: '2', alpha: 'A B C' },
        { digit: '3', alpha: 'D E F' }, 
        { digit: '4', alpha: 'G H I' },
        { digit: '5', alpha: 'J K L' }, 
        { digit: '6', alpha: 'M N O' }, 
        { digit: '7', alpha: 'P Q R S' },
        { digit: '8', alpha: 'T U V' }, 
        { digit: '9', alpha: 'W X Y Z' },
        { digit: '*', alpha: null },
        { digit: '0', alpha: '+' }, 
        { digit: '#', alpha: null }
      ]
    }
  },
  methods: {
    initializeDevice: async function () {
      await this.requestToken();
      this.createAndRegisterDevice(this.token);      
    },
    requestToken: async function () {
      try {
        this.log("Requesting Access Token...");
        // request a token from our /token endpoint
        const data = await fetch('http://localhost:3000/token', {
          method: "POST",
          headers: { "Content-Type" : "application/json" },
          body: JSON.stringify({ identity: this.clientName })
        });
        const response = await data.json();
        this.token = response.token;
        this.log("Successfully retrieved token.");
      } catch (error) {
        this.twilioDevice = null;
        console.log(error);
        this.log('An error occurred. Check the browser console for more info.')
      }
    },
    createAndRegisterDevice: async function() {

      // this.twilioDevice is the new Twilio.Device
      // this.twilioDevice is NOT added to the Vue
      // data property to prevent Vue reactivity
      this.twilioDevice = new Device(this.token, {
        debug: true,
        answerOnBridge: true,
        codecPreferences: ["opus", "pcmu"],
      });

      // add event listeners to log Twilio.Device events
      this.twilioDevice.on("registered", () => {
        this.log("Twilio.Device ready to make calls!");
      });

      this.twilioDevice.on("error", (error) => {
        this.log("Twilio.Device Error: " + error.message);
      });

      this.deviceInitialized = true;
    },
    makeCall: async function() {
      this.log(`Calling ${this.currentNumber} ...`);

      var params = { To: this.currentNumber };

      // Twilio.Device.connect() returns a Call object
      this.twilioCall = await this.twilioDevice.connect({ params });

      // If the call is disconnected by the caller or the callee,
      // a disconnect event will be emitted
      this.twilioCall.on('disconnect', () => {
        this.log('Call ended.')
        this.twilioCall = null;
      });
    },
    hangupCall: function() {
      // call disconnectAll on the Twilio.Device
      this.twilioDevice.disconnectAll();

      // remove the call from the Vue data property
      this.twilioCall = null;

      this.currentNumber = null;
      this.inputDigits = '';
    },
    toggleMute: function() {
      this.isMuted = !this.isMuted;
      this.twilioCall.mute(this.isMuted);
      this.log(this.isMuted ? 'Call is muted.' : 'Call is unmuted.')
    },
    sendDigit: function(digit) {
      if (this.twilioCall) {

        // Call.sendDigits() 
        this.twilioCall.sendDigits(digit)

        this.inputDigits = this.inputDigits.concat(digit);

      } else {
        if (digit === '0' && !this.currentNumber) {
          this.currentNumber = '+'
        } else {
          this.currentNumber = this.currentNumber.concat(digit);
        }
      }
    },
    backspaceDigit: function() {
      if (this.currentNumber.length === 1) {
        this.clearCurrentNumber()
      } else {
        this.currentNumber = this.currentNumber.slice(0, -1)
      }
    },
    clearCurrentNumber: function() {
      this.currentNumber = null;
    },
    log: function(message) {
      this.logMessages.push(message);
    }
  },
 }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}

.browser-dialer {
  width: 50%;
  margin: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  justify-content: center;
}

.call-controls {
  min-width: 250px;
}

.keypad-keys {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: stretch;
  min-width: 250px;
  width: 250px;
  height: 250px;
  margin: 1.5rem auto;
  padding: 0;
}

.keypad-keys span {
  display: block;
  font-size: 1rem;
}

.keypad-keys li {
  width: 100%;
  margin: 0;
}

.keypad-keys button {
  width: 100%;
  height: 100%;
  font-size: 2rem;
  padding: 0;
}

.log {
  height: 200px;
  min-width: 250px;
  overflow-y: scroll;
}

.log li {
  display: block;
  text-align: left;
  margin: 2px;
  border-bottom: 1px solid black;
}
</style>
