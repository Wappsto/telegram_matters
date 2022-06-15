import Wappsto = require('wappsto-wapp')
const axios = require('axios');


/**
 *  Enable extsync
 *  run `npx wapp configure`
 *  ? Should ExtSync be enabled for your Wapp? Yes
 */

/*
 * Example of Telegram message.
 *
 * {"update_id":219264035,"message":{"message_id":12,"from":{"id":127983167,"is_bot":false,"first_name":"Sigis","username":"sigidagi","language_code":"en"},"chat":{"id":-627583276,"title":"Seluxit Friends","type":"group","all_members_are_administrators":true},"date":1655194913,"text":"du su"}}
 *
 * ---------------------------------------------------------------------------------------------
 *
 * Example of Mattermost message
 * {"token":"5mx4ymmqhbrkmkt9yb3sgju1ah","team_id":"9r8je8u4hpy3ietukdmqy188fh","team_domain":"seluxit","channel_id":"otrp14qq13ry8dsm7jtfk4s1bh","channel_name":"telegram","timestamp":165519071580,"user_id":"u68ce975pb8ofc3dqkmfj9uwec","user_name":"sigis-seluxit.com","post_id":"twh8tcyk4bn6jyfr6np56aiw1a","text":"matter","trigger_word":"","file_ids":""}
 */



/**
 *  It is assumed that Telegram messaging service will be hosted at telegram.org.
 */
const TELEGRAM_URL = "https://api.telegram.org/bot"
const NETWORK_NAME = "Telegram <-> Mattermost";

let config : ConfigData = {} as ConfigData;

interface ConfigData {
    //
    mattermost: {
        url: string;
        token: string;
    };
    telegram : {
        token: string;
        chat_id: number;
    };
}

async function main() {
    console.log("");
    console.log("Starting background process...");

    let network : Wappsto.Network = await Wappsto.createNetwork({name: NETWORK_NAME});

    let device = await network.createDevice({
        name: 'TelegramMatters',
        description: 'Telegram messaging to Waapsto',
        protocol: 'JSON',
        communication: 'wapp',
        version: '1.0.0',
    });

    // Two read-only values for only keeping historical data.
    let valueTelegram = await device.createStringValue({
    	name: 'Telegram',
	    permission: 'r',
	    type: 'debug',
	    max: 4096,
    });

    let valueMattermost = await device.createStringValue({
    	name: 'Mattermost',
	    permission: 'r',
	    type: 'debug',
	    max: 4096,
    });


    // Receiving conguration parameters - secrets from UI.
    const storage = await Wappsto.wappStorage('secrets');
    console.log(`Init default storage, name: ${storage.name}`);

    const secrets: ConfigData = await storage.get('secrets');
    if (secrets !== undefined) {
        console.log("Loaded secrets")
        config = secrets;
        console.log("Config: ", config);
    }

    storage.onChange( async () => {
        console.log("Secrets has been updated");
        const secrets: ConfigData = await storage.get('secrets');
        config = secrets;
        console.log("Config", config);
    });

    /**
     * The same entry point for Telegram and Mattermost. Check for message content in oreder to identify direction.
     */
    Wappsto.onWebHook(async (event: any) => {
        //
        console.log('Incomming data...');
        try {
            const indata = JSON.parse(event);
            // Mattermost
            if (indata.token) {
                if (indata.token === config.mattermost.token) {
                    const url = TELEGRAM_URL + config.telegram.token + "/sendMessage";
                    let data = {
                        text: "\n@__" + indata.user_name + "__\n" + indata.text,
                        chat_id: config.telegram.chat_id,
                        parse_mode: "Markdown",
                    };
                    valueMattermost.report(JSON.stringify(data));
                    console.log(`Post to Telegram, url: ${url}`);
                    await axios.post(url, data);
                }
                else {
                    console.log(`Error, mattermost token: '${indata.token}' do not match defined: '${config.mattermost.token}'`)
                }
            }
            // Telegram, check chat_id: it should 'Seluxit Friends' channel id, go to web telegram channel: https://web.telegram.org/z/#-1513203695
            // added 100 in front of number.
            else if (indata.message && indata.message.chat && Number(indata.message.chat.id) === Number(config.telegram.chat_id)) {
                // Telegram message some time do not contain text. It could some message with added new members list, etc.
                if (indata.message.text) {
                    let data = {
                        text: indata.message.text,
                        icon_url: "https://dagilis.me/images/telegram.png",
                        username: indata.message.from.first_name,
                    };

                    valueTelegram.report(JSON.stringify(data));
                    console.log(`Post to Mattermost, url: ${config.mattermost.url}`);
                    await axios.post(config.mattermost.url, data);
                }
                else {
                    console.log("Telegram do not contain message, skip ", indata.message);
                }
            }
            else {
                console.log("Error, unknown message: ", indata);
                console.log("Telegram      chat id: ", indata.message.chat.id);
                console.log("Configuration chat id: ", config.telegram.chat_id);
            }
        }
        catch(e: any) {
            console.log("Bad! Exception: ", e.message);
        }
    });
}

// ----------------------------- START -------------------------
main();
