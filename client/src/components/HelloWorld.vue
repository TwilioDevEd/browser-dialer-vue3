<template>
  <div class="hello">
    
    <input placeholder="Enter client name" v-model="clientName" />
    <button v-if="device === null" @click.prevent="initializeDevice()">Initialize Client</button>

  <div id="dialer" v-if="device">
    <!-- Dialer input -->
    <div class="input-group input-group-sm" v-cloak>

      <!-- Create a country code dropdown -->
      <div class="input-group-btn">
        <button type="button" class="btn btn-default dropdown-toggle" 
          data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            +<span class="country-code">{{ countryCode }}</span>
            <i class="fa fa-caret-down"></i>
        </button>
        <ul class="dropdown-menu">
          <li v-bind:key="country" v-for="country in countries">
            <a href="#" @click.prevent="selectCountry(country)">
              <div :class="'flag flag-' + country.code"></div>
              <span>{{ country.name }} (+{{ country.cc }})</span>
            </a>
          </li>
        </ul>
      </div>

      <!-- Telephone input field -->
      <input type="tel" class="form-control" v-model="currentNumber"
        placeholder="555-666-7777">
    </div>

    <!-- Audio Controls -->
    <div class="controls">
      <button class="btn btn-circle" @click="toggleCall()"
        :class="[ onPhone ? 'btn-danger': 'btn-success' ]"
        :disabled="!validPhone">
        <i class="fa fa-fw fa-phone"
          :class="[ onPhone ? 'fa-close': 'fa-phone' ]"></i>
      </button>

      <button class="btn btn-circle btn-default" v-if="onPhone" @click="toggleMute">
        <i class="fa fa-fw"
          :class="[ muted ? 'fa-microphone-slash': 'fa-microphone' ]"></i>
      </button>
    </div>

    <!-- DTMF Tone interface -->
    <div class="keys" v-if="connection" v-cloak>
      <div class="key-row">
        <button class="btn btn-circle btn-default" @click="sendDigit('1')">1</button>
        <button class="btn btn-circle btn-default" @click="sendDigit('2')">2
          <span>A B C</span>
        </button>
        <button class="btn btn-circle btn-default" @click="sendDigit('3')">3
          <span>D E F</span>
        </button>
      </div>
      <div class="key-row">
        <button class="btn btn-circle btn-default" @click="sendDigit('4')">4
          <span>G H I</span>
        </button>
        <button class="btn btn-circle btn-default" @click="sendDigit('5')">5
          <span>J K L</span>
        </button>
        <button class="btn btn-circle btn-default" @click="sendDigit('6')">6
          <span>M N O</span>
        </button>
      </div>
      <div class="key-row">
        <button class="btn btn-circle btn-default" @click="sendDigit('7')">7
          <span>P Q R S</span>
        </button>
        <button class="btn btn-circle btn-default" @click="sendDigit('8')">8
          <span>T U V</span>
        </button>
        <button class="btn btn-circle btn-default" @click="sendDigit('9')">9
          <span>W X Y Z</span>
        </button>
      </div>
      <div class="key-row">
        <button class="btn btn-circle btn-default" @click="sendDigit('*')">*</button>
        <button class="btn btn-circle btn-default" @click="sendDigit('0')">0</button>
        <button class="btn btn-circle btn-default" @click="sendDigit('#')">#</button>
      </div>
    </div>

    <!-- Status logging -->
    <div class="log" v-cloak>{{ log }}</div>
  </div>







  </div>
</template>

<script>
import { Device } from '@twilio/voice-sdk';

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  methods: {
    requestToken: async function () {

      if (this.clientName === '') {
        this.clientName = 'Client1'
      }

      try {
        console.log("Requesting Access Token...");
        
        const data = await fetch('http://localhost:3000/token', {
          method: "POST",
          headers: { "Content-Type" : "application/json" },
          body: JSON.stringify({ identity: this.clientName })
        });

          console.log('token: ', data)

        const { token } = await data.json();
        console.log("Successfully retrieved token.");
        return token;
      } catch (error) {
        this.device = null;
        console.log(error);
      }
    },
    createAndRegisterDevice: async function(token) {
      console.log('token in createAndRegisterDevice: ', token)

      const device = new Device(token, {
        debug: true,
        answerOnBridge: true,
        codecPreferences: ["opus", "pcmu"],
      });

      device.on("registered", function () {
        console.log("Twilio.Device Ready to make and receive calls!");
      });

      device.on("error", function (error) {
        console.log("Twilio.Device Error: " + error.message);
      });
      // Device must be registered in order to receive incoming calls
      

      this.device = device;
      this.device.register();
    },
    initializeDevice: async function () {
      const token = await this.requestToken();
      this.createAndRegisterDevice(token);      
    }
  },
  data() {
    return {
    // Outgoing call country code
    countryCode: '1',
    currentNumber: '',
    muted: false,
    onPhone: false,
    log: 'Connecting...',
    countries: [
      { name: 'United States', cc: '1', code: 'us' },
      { name: 'Great Britain', cc: '44', code: 'gb' },
      { name: 'Colombia', cc: '57', code: 'co' },
      { name: 'Ecuador', cc: '593', code: 'ec' },
      { name: 'Estonia', cc: '372', code: 'ee' },
      { name: 'Germany', cc: '49', code: 'de' },
      { name: 'Hong Kong', cc: '852', code: 'hk' },
      { name: 'Ireland', cc: '353', code: 'ie' },
      { name: 'Singapore', cc: '65', code: 'sg' },
      { name: 'Spain', cc: '34', code: 'es' },
      { name: 'Brazil', cc: '55', code: 'br' },
    ],
    connection: null,
    token: null,
    clientInitialized: false,
    device: null,
    clientName: ''
    }
  },
  computed: {
    // Computed property to validate the current phone number
    validPhone: function() {
      return /^([0-9]|#|\*)+$/.test(this.currentNumber.replace(/[-()\s]/g,''));
    }
  },
 }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
