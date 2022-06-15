<template>
      <div id="app">
          <p>
          <h3 class="text-center">Integration Mattermost with Telegram</h3>
          <div class="container">
             <div v-if="errors.length">
                 <div class="alert alert-danger" role="alert">
                    <b>Please correct the following error(s):</b>
                    <ul>
                        <li v-for="error in errors" :key=error>{{ error }}</li>
                    </ul>
                 </div>
             </div>
             <div v-if="message.length">
                 <div class="alert alert-primary" role="alert">
                     <i>{{ message }}</i>
                 </div>
             </div>

          </div>

          <div class="container">
            <h5 class="text-left"></h5>
            <form>
                <div class="col-lg-8">
                <div class="form-group">
                    <label for="matter_url">Mattermost incomming url:</label>
                    <input type="text" id="matter_url" class="form-control ml-2" placeholder=""
                    v-model="storage.secrets.mattermost.url">
                    <small id="matter_url_help" class="form-text text-muted">Mattermost url for incomming messages.</small>
                </div>
                <div class="form-group">
                    <label for="matter_token">Mattermost outgoing token:</label>
                    <input type="text" id="matter_token" class="form-control ml-2" placeholder=""
                    v-model="storage.secrets.mattermost.token">
                    <small id="matter_token_help" class="form-text text-muted">Token for origin verification</small>
                </div>

                <div class="form-group">
                    <label for="tele_token">Telegram secret token:</label>
                    <input type="text" id="tele_token" class="form-control ml-2" placeholder=""
                    v-model="storage.secrets.telegram.token">
                    <small id="tele_token_help" class="form-text text-muted">Telegram bot url: https://api.telegram.org/bot + 'secret token'</small>
                </div>
                <div class="form-group">
                    <label for="tele_chat_id">Telegram group chat ID:</label>
                    <input type="text" id="tele_chat_id" class="form-control ml-2" placeholder=""
                    v-model="storage.secrets.telegram.chat_id">
                    <small id="tele_chat_id_help" class="form-text text-muted">Telegram group chat id for origin verification</small>
                </div>

                <button type="button" class="btn btn-primary" v-on:click="checkForm">Submit</button>
                </div>
            </form>
          </div>
      </div>
</template>

<script>
    // helper functions.
    function uuidv4() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    async function getData(dataId) {
        const requestOptions = {
            method: 'GET',
            headers: { 'Content-Type':'application/json','X-Session':sessionId}
        };
        let dataUrl = "/services/data"
        if (dataId) {
            dataUrl = dataUrl+"/"+ dataId;
        }
        console.log("url... ", dataUrl);
        const response = await fetch(dataUrl, requestOptions);
        console.log(response.status);
        const data = await response.json();
        return data;
    }

    async function sendEvent(type) {
        const data = {
            type: type,
            msg: '',
        };
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type':'application/json','X-Session':sessionId},
            body: JSON.stringify(data)
        };

        console.log('Sending event ', data);

        let result = {};
        const eventUrl = "/services/2.0/extsync";
        fetch(eventUrl, requestOptions)
            .then(async response => {
                console.log("response ", response);
                if (response.ok) {
                    result = await response.json();
                }
            })
            .catch(error => {
                console.log("send Event error", error);
            });

        return result;
    }

    // helper function to generate UUID.
    // let dataUrl = "https://qa.wappsto.com/services/data"

    let x = Object.fromEntries(document.cookie.split(/; */).map(c => {
        const [ key, v ] = c.split('=', 2);
        return [ key, decodeURIComponent(v) ];
    }));

    let sessionId = x.sessionID;
    if (!sessionId) {
        sessionId = sessionStorage.getItem("sessionID");
    }

    console.log("sessionId: ", sessionId);

    export default {
        async created() {
            console.log("Hello!");

            let storage = await this.getStorage();
            if (storage.meta) {
                this.storage.meta = storage.meta;
            }
            if (storage.secrets) {
                this.storage.secrets = storage.secrets;
                console.log("config Telegram chat ID ..... ", this.storage.secrets.telegram.chat_id);
            }
            else {
                this.message = "No configuration data was found. Add one.";
            }
        },
        data() {
            return {
                errors: [],
                message: "",
                storage: {
                    data_meta: {
                      type: "wapp_storage",
                      id: "wapp_storage_secrets",
                    },
                    meta: {
                        id: undefined,
                        type: "data",
                        version: "2.0",
                    },
                    secrets: {
                        mattermost: {
                            url: undefined,
                            token: undefined,
                        },
                        telegram: {
                            chat_id: undefined,
                            token: undefined,
                        },
                    },
                }
            }
        },
        methods: {
            //
            async getStorage() {
                let storage = {
                    meta: undefined,
                    secrets: undefined,
                };

                const idList = await getData();
                if (idList !== undefined && idList.id.length !== 0) {
                    for (const id of idList.id) {
                        const obj = await getData(id);
                        if (obj && obj.data_meta && obj.data_meta.id === "wapp_storage_secrets") {
                            console.log("Found secret storage id ", obj.meta.id);
                            storage.meta = obj.meta;
                        }
                        if (obj && obj.secrets) {
                            console.log("Found config: ", obj.meta.id);
                            storage.secrets = obj.secrets;
                        }
                    }
                }
                return storage;
            },
            checkForm: function(e) {

                this.errors = [];
                if (this.storage.secrets.mattermost.url === undefined) {
                    this.errors.push("Mattermost incomming url required.");
                }
                if (this.storage.secrets.mattermost.token === undefined) {
                    this.errors.push("Mattermost outgoing token required.");
                }
                if (this.storage.secrets.telegram.chat_id === undefined) {
                    this.errors.push("Telegram chat ID required.");
                }
                if (this.storage.secrets.telegram.token === undefined) {
                    this.errors.push("Telegram token required.");
                }
                // Success.
                if (this.errors.length === 0) {
                    console.log("Creating/Updating configuration, data id ", this.storage.meta.id);
                    return this.createConf();
                }

                e.preventDefault();
            },

            async createConf() {
                let dataUrl = "/services/data";
                let method = "POST";

                // fetch if exist previous configuration meta id.
                const storage = await this.getStorage();
                if (storage.meta.id === undefined) {
                    this.storage.meta.id = uuidv4();
                }
                else {
                    this.storage.meta = storage.meta;
                    dataUrl = dataUrl + "/" + storage.meta.id;
                    method = "PUT";
                }

                const requestOptions = {
                    method: method,
                    headers: { 'Content-Type':'application/json','X-Session':sessionId},
                    body: JSON.stringify(this.storage)
                };

                console.log("Sending request: ", requestOptions.body);
                console.log("dataUrl ", dataUrl)

                fetch(dataUrl, requestOptions)
                    .then(async response => {
                        const data = await response.json();
                        if (!response.ok) {
                            console.error("Response status: ", response.status);
                            return false;
                        } else {
                            console.log("create conf request ", data);
                            this.message = "Success with configuration update!"
                            console.log("Updated conf: ", this.storage.secrets);

                            sendEvent('storage_secrets_updated');
                            return true;
                        }
                    })
                    .catch(error => {
                        this.errors.push(error);
                        console.log('There was an error', error)
                        return false;
                    });

            }
        } // methods
    }
</script>

<style>
     @import './bootstrap.min.css';
</style>

