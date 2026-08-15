
// -------------------------------------------------------
// Handle Express server routes for the CasparCG commands.
// -------------------------------------------------------
var express = require("express");
const router = express.Router();
const path = require('path');

const logger = require('../utils/logger');
logger.debug('Caspar-route loading...');
const spx = require('../utils/spx_server_functions.js');

const ip = require('ip')
const ipad = ip.address(); // my ip address
const port = config.general.port || 5656;

const PlayoutCCG = require('../utils/playout_casparCG.js');


// ROUTES CCG -----------------------------------------------------------------------------------
router.get('/', function (req, res) {
  res.send('Nothing here. Go away!');
});

router.get('/system', function (req, res) {
  res.send('Nothing here. Get lost.');
});

router.get('/requestInfo', async (req, res) => {
  var SERVER  = req.query.server;   // ?server=OVERLAY
  var COMMAND = req.query.command;  // &command=INFO
  // console.log('requestInfo from ' + SERVER + ', cmd: ' + COMMAND);
  const CCGHost = global.CCGSockets[PlayoutCCG.getSockIndex(SERVER)].spxhost;
  const CCGPort = global.CCGSockets[PlayoutCCG.getSockIndex(SERVER)].spxport;
  const net = require('net')
  CasparRequest = new net.Socket();
  CasparRequest.connect(CCGPort, CCGHost, function () {
    CasparRequest.write(COMMAND + '\r\n');
    CasparRequest.on('data', function (data) {
      res.set('Content-Type', 'text/plain'); // format
      res.status(200).send(data);
      CasparRequest.destroy();
    });

    CasparRequest.on('error', function (error) {
      return res.status(500).send(error);
      CasparRequest.destroy();
    });
  });
});

router.get('/system/:data', (req, res) => {
  // same principle as with /control/:data
  // do OpSys level stuff, open folders etc..
  //
  // NOTE: This endpoint is in the WRONG PLACE
  //       it should be moved to a more generic place
  //
  // console.log('System utilities / ' + req.params.data);
  data = JSON.parse(req.params.data);
  let directoryPath = "";
  logger.verbose('System utilities / ' + JSON.stringify(data));
  res.sendStatus(200);
  switch (data.command) {

    case 'DATAFOLDER':
      directoryPath = path.normalize(config.general.dataroot);
      require('child_process').exec('start "" ' + directoryPath);
      break;

    case 'TEMPLATEFOLDER':
      // directoryPath = path.normalize(config.general.templatefolder);
      directoryPath = path.join(spx.getStartUpFolder(), 'ASSETS', 'templates');
      require('child_process').exec('start "" ' + directoryPath);
      break;

    case 'CHECKCONNECTIONS':
      // console.log('CCG: Checking server connections...');
      spx.checkServerConnections();
      break;

    case 'RESTARTSERVER':
      // 
      logger.error('RESTART SERVER REQUEST RECEIVED. Will try to kill and restart using process manager.');
      process.exit(2);
      break;

  }
});

router.get('/control/:data', (req, res) => {
  // Principle:
  // We get data object which has
  // - data.command (ADD | STOP | UPDATE)
  // - data.fields  [{ id: 'f0', value: 'Eka' }, { id: 'f1', value: 'Toka' }];
  // - data.element headline1
  // - data.profile News
  //
  // Then we read profiles-file and search for the required element
  // such as 'headline1' and get needed data from it:
  // - templatefile
  // - server
  // - channel
  // - layer
  data = JSON.parse(req.params.data);
  logger.info('CCG/Control/ ' + JSON.stringify(data));
  res.sendStatus(200);

  if (!spx.CCGServersConfigured){   return  } // exit early, no need to do any CasparCG work

  var DataStr = "";
  const directoryPath = path.normalize(config.general.dataroot);
  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataAsJSON = spx.GetJsonData(profilefile);
  var arr = profileDataAsJSON.profiles;
  let GFX_Teml = "";
  let GFX_Serv = "";
  let GFX_Chan = "";
  let GFX_Laye = "";
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    if (obj.name == data.profile) {
      GFX_Teml = eval("obj.templates." + data.element + ".templatefile");
      GFX_Serv = eval("obj.templates." + data.element + ".server");
      GFX_Chan = eval("obj.templates." + data.element + ".channel");
      GFX_Laye = eval("obj.templates." + data.element + ".layer");
    }
  }

  logger.debug('CCG/Control - Profile ' + data.profile + "', Template: '" + GFX_Teml, "', CasparCG: " + GFX_Serv + ", " + GFX_Chan + ", " + GFX_Laye);

  if (data.command == "ADD" || data.command == "UPDATE") {
    let TEMPLATEDATA = "";
    if (data.fields) {
      data.fields.forEach(item => {
        logger.verbose('Processing field for CCG: ' + item.id + ' with value: ' + item.value);
        TEMPLATEDATA += spx.CGComponentFactory(item.id, item.value)
      });
    }
    DataSta = "<templateData>";
    DataEnd = "</templateData>";
    DataStr = DataSta + TEMPLATEDATA + DataEnd;
  }

  try {
    switch (data.command) {
      case 'ADD':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' ADD 1 "' + GFX_Teml + '" 1 "' + DataStr + '"\r\n');
        break;

      case 'UPDATE':
        console.log('TODO: This is probably not used to send update to CasparCG... See playout_casparCG.js instead! ** FIXME:**');
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' UPDATE 1 "' + DataStr + '"\r\n');
        break;

      case 'NEXT':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' NEXT 0\r\n');
        break;

      case 'STOP':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' STOP 1\r\n');
        break;

      default:
        logger.warn('CCG/Control - Unknown command: ' + data.command);
    }
  } catch (error) {
    logger.error('ERROR in /control/:data, unable to send CCG command. Server up? ' + error)
  }


}); // control ended

router.get('/controljson/:data', (req, res) => {

  data = JSON.parse(req.params.data);
  logger.info('CCG/controljson ' + JSON.stringify(data));
  res.sendStatus(200);
  if (!spx.CCGServersConfigured){   return  } // exit early, no need to do any CasparCG work
  const directoryPath = path.normalize(config.general.dataroot);
  let profilefile = path.join(directoryPath, 'config', 'profiles.json');
  const profileDataAsJSON = spx.GetJsonData(profilefile);
  var arr = profileDataAsJSON.profiles;
  let GFX_Teml = "";
  let GFX_Serv = "";
  let GFX_Chan = "";
  let GFX_Laye = "";
  let GFX_JSON = ""
  let stng = ""

  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    if (obj.name == data.profile) {
      GFX_Teml = eval("obj.templates." + data.element + ".templatefile");
      GFX_Serv = eval("obj.templates." + data.element + ".server");
      GFX_Chan = eval("obj.templates." + data.element + ".channel");
      GFX_Laye = eval("obj.templates." + data.element + ".layer");
      GFX_JSON = JSON.stringify(data.jsonData);
    }
  }

  logger.verbose("CCG/ControlJSON Profile: '" + data.profile + "', Template: '" + GFX_Teml, "', CasparCG: " + GFX_Serv + ", " + GFX_Chan + ", " + GFX_Laye)
  logger.debug('json' + JSON.stringify(GFX_JSON));
  stng = GFX_JSON;
  stng = stng.split('§backslash§').join('&bsol;'); // replace §backslash§ with html corresponding entity
  stng = stng.split('"').join('\\"'); // replace " with \"

  try {
    switch (data.command) {
      case 'ADD':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' ADD 1 "' + GFX_Teml + '" 1 "' + stng + '"\r\n');
        break;

      case 'UPDATE':
        global.CCGSockets[spx.getSockIndex(spx.getChannel(data))].write('CG ' + GFX_Chan + '-' + GFX_Laye + ' UPDATE 1 "' + stng + '"\r\n');
        break;

      default:
        logger.warn('CCG/ControlJSON - Unknown command: ' + data.command);
    }
  } catch (error) {
    logger.error('ERROR in /controljson/:data: ' + error)
  }
});

router.post('/disable', async (req, res) => {
  // Added in 1.1.0. Set "disabled" state of the given CasparCG server
  // This only affects playback commands. Initialization works normally.
  logger.verbose('CasparCG server ' + req.body.server + ' disabled to ' + req.body.disabled);
  try {
    var ConfigFile = global.configfileref;
    var ConfigData = await spx.GetJsonData(ConfigFile);
    if (ConfigData.casparcg.servers) {
      ConfigData.casparcg.servers.forEach((serverItem,index) => {
        if (serverItem.name == req.body.server) {
          serverItem.disabled = req.body.disabled
        }
      });
    }
    global.config = ConfigData; // update mem version also
    await spx.writeFile(ConfigFile,ConfigData);
    let response = ['Config changed']
    res.status(200).send(response); // ok 200 AJAX RESPONSE
  } catch (error) {
      console.error('ERROR', error);
      let errmsg = 'Server error in CCG disable [' + error + ']';
      logger.error(errmsg);
      res.status(500).send(errmsg)  // error 500 AJAX RESPONSE
  };
});


// Create all required Socket Connections for CasparCG servers specified in config.json
const net = require('net')
let ServerDataForLogger = [];

function emitCCGStatus(index, color, statusText) {
  if (typeof io === 'undefined' || !io) { return; }
  io.emit('SPXMessage2Client', { spxcmd: 'updateServerIndicator', indicator: 'indicator' + index, color: color });
  if (statusText) {
    io.emit('SPXMessage2Client', { spxcmd: 'updateStatusText', status: statusText });
  }
}

function attachCasparCGServer(index, CurName, CurHost, CurPort) {
  let retryDelay = 1000;
  let retryTimer = null;
  let loggedOffline = false;

  function clearRetryTimer() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function scheduleReconnect() {
    if (retryTimer) { return; }
    retryTimer = setTimeout(function () {
      retryTimer = null;
      connect();
      retryDelay = Math.min(retryDelay * 2, 30000);
    }, retryDelay);
  }

  function connect() {
    clearRetryTimer();
    const previous = global.CCGSockets[index];
    if (previous && previous.connecting && !previous.destroyed) {
      return;
    }
    if (previous && !previous.destroyed) {
      previous.removeAllListeners();
      previous.destroy();
    }

    const CurCCG = new net.Socket();
    CurCCG.spxname = CurName;
    CurCCG.spxhost = CurHost;
    CurCCG.spxport = CurPort;
    CurCCG.spxReconnect = function () {
      retryDelay = 1000;
      scheduleReconnect();
    };
    global.CCGSockets[index] = CurCCG;

    CurCCG.connect(CurPort, CurHost);

    CurCCG.on('connect', function () {
      retryDelay = 1000;
      loggedOffline = false;
      CurCCG.setKeepAlive(true, 10000);
      CurCCG.setNoDelay(true);
      emitCCGStatus(index, '#00CC00', 'Communication established with ' + CurName + '.');
      logger.verbose('SPX connected to CasparCG as \'' + CurName + '\' at ' + CurHost + ":" + CurPort + '.');
    });

    CurCCG.on('data', function (data) {
      logger.verbose('SPX received data from CasparCG ' + CurName + ': ' + data);

      let CCG_RETURN_TEXT = String(data).replace('\r','').replace('\n','');
      let CCG_RETURN_CODE = CCG_RETURN_TEXT.substring(0, 2);
      switch (CCG_RETURN_CODE) {
        case "20":
          logger.verbose('Comms good with ' + CurName + ": " + CCG_RETURN_TEXT);
          break;

        case "40":
          logger.error(CurName + ' CasparCG response: ' + CCG_RETURN_TEXT );
          logger.debug('Verify CasparCG\'s (' + CurName + ') access to templates on SPX server at ' + spx.getTemplateSourcePath());
          emitCCGStatus(index, '#00CC00', 'Error in comms with ' + CurName + '.');
          break;

        case "50":
          logger.error('Failed ' + CurName + ": " + CCG_RETURN_TEXT);
          emitCCGStatus(index, '#00CC00', CurName + ' failed.');
          break;

        default:
          logger.error('Unknown status value ' + CurName + ' - ' + CCG_RETURN_CODE + ' - ' + CCG_RETURN_TEXT);
          break;
      }

      emitCCGStatus(index, '#00CC00');
    });

    CurCCG.on('close', function () {
      emitCCGStatus(index, '#CC0000', loggedOffline ? null : 'Connection to ' + CurName + ' was closed.');
      logger.verbose('SPX connection to CasparCG "' + CurName + '" closed (' + CurHost + ':' + CurPort + '). Reconnecting...');
      scheduleReconnect();
    });

    CurCCG.on('error', function () {
      emitCCGStatus(index, '#CC0000', loggedOffline ? null : 'Communication error with ' + CurName + '.');
      if (!loggedOffline) {
        logger.warn('Unable to connect CasparCG "' + CurName + '" (' + CurHost + ':' + CurPort + '). Is it running? Will keep retrying.');
        loggedOffline = true;
      }
    });
  }

  connect();
}

if (config.casparcg) {
  config.casparcg.servers.forEach((element,index) => {
    const CurName = element.name;
    const CurHost = element.host;
    const CurPort = element.port;

    ServerDataForLogger.push({ name: CurName, host: CurHost, port: CurPort });
    global.CCGSockets[index] = null;
    attachCasparCGServer(index, CurName, CurHost, CurPort);
  });
}; // end if 

logger.debug('ServerDataForLogger during init: ' + JSON.stringify(ServerDataForLogger));
module.exports = router;