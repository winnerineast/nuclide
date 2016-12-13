'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));

var _nuclideRemoteConnection;

function _load_nuclideRemoteConnection() {
  return _nuclideRemoteConnection = require('../../nuclide-remote-connection');
}

var _goToLocation;

function _load_goToLocation() {
  return _goToLocation = require('../../commons-atom/go-to-location');
}

var _createPackage;

function _load_createPackage() {
  return _createPackage = _interopRequireDefault(require('../../commons-atom/createPackage'));
}

var _featureConfig;

function _load_featureConfig() {
  return _featureConfig = _interopRequireDefault(require('../../commons-atom/featureConfig'));
}

var _textEditor;

function _load_textEditor() {
  return _textEditor = require('../../commons-atom/text-editor');
}

var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');

var _nuclideUri;

function _load_nuclideUri() {
  return _nuclideUri = _interopRequireDefault(require('../../commons-node/nuclideUri'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Use dummy 0 port for local connections.
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 */

const DUMMY_LOCAL_PORT = 0;
const REMOTE_COMMAND_SERVICE = 'RemoteCommandService';

class Activation {

  constructor() {
    var _this = this;

    this._commands = {
      openFile(uri, line, column, isWaiting) {
        return openFile(uri, line, column, isWaiting);
      },
      openRemoteFile(uri, line, column, isWaiting) {
        if ((_nuclideRemoteConnection || _load_nuclideRemoteConnection()).ServerConnection.getForUri(uri) == null) {
          return _rxjsBundlesRxMinJs.Observable.throw(new Error(`Atom is not connected to host for ${ uri }`)).publish();
        }
        return openFile(uri, line, column, isWaiting);
      },
      addProject(projectPath) {
        return (0, _asyncToGenerator.default)(function* () {
          if ((_nuclideUri || _load_nuclideUri()).default.isLocal(projectPath)) {
            atom.project.addPath(projectPath);
          } else {
            // As of Atom 1.12 atom.project.addPath won't work for remote dirs.
            const serverConnection = (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).ServerConnection.getForUri(projectPath);
            if (serverConnection != null) {
              // Creating the RemoteConnection should add it to the FileTree
              yield (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).RemoteConnection.findOrCreateFromConnection(serverConnection, (_nuclideUri || _load_nuclideUri()).default.getPath(projectPath), '');
            }
          }
        })();
      },
      dispose() {}
    };

    this._disposables = new (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).ConnectionCache((() => {
      var _ref = (0, _asyncToGenerator.default)(function* (connection) {
        const service = (0, (_nuclideRemoteConnection || _load_nuclideRemoteConnection()).getServiceByConnection)(REMOTE_COMMAND_SERVICE, connection);
        const port = connection == null ? DUMMY_LOCAL_PORT : connection.getPort();
        return service.RemoteCommandService.registerAtomCommands(port, _this._commands);
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })());
  }

  dispose() {
    this._disposables.dispose();
  }

}

function openFile(uri, line, column, isWaiting) {
  return _rxjsBundlesRxMinJs.Observable.fromPromise((0, (_goToLocation || _load_goToLocation()).goToLocation)(uri, line, column).then(editor => {
    atom.applicationDelegate.focusWindow();

    if (isWaiting && (_featureConfig || _load_featureConfig()).default.get('nuclide-remote-atom.shouldNotifyWhenCommandLineIsWaitingOnFile')) {
      const notification = atom.notifications.addInfo(`The command line has opened \`${ (_nuclideUri || _load_nuclideUri()).default.getPath(uri) }\`` + ' and is waiting for it to be closed.', {
        dismissable: true,
        buttons: [{
          onDidClick: () => {
            (_featureConfig || _load_featureConfig()).default.set('nuclide-remote-atom.shouldNotifyWhenCommandLineIsWaitingOnFile', false);
            notification.dismiss();
          },
          text: 'Don\'t show again'
        }, {
          onDidClick: () => {
            editor.destroy();
          },
          text: 'Close file'
        }]
      });
      editor.onDidDestroy(() => {
        notification.dismiss();
      });
    }

    return editor;
  })).switchMap(editor => _rxjsBundlesRxMinJs.Observable.merge(_rxjsBundlesRxMinJs.Observable.of('open'), (0, (_textEditor || _load_textEditor()).observeEditorDestroy)(editor).map(value => 'close'))).publish();
}

exports.default = (0, (_createPackage || _load_createPackage()).default)(Activation);
module.exports = exports['default'];