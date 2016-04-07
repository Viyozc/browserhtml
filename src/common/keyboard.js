/* @flow */

/* this source code form is subject to the terms of the mozilla public
 * license, v. 2.0. if a copy of the mpl was not distributed with this
 * file, you can obtain one at http://mozilla.org/mpl/2.0/. */

/*::
import type {BindingTable, Abort, kind} from "./keyboard"
*/

import {Effects} from "reflex";
import * as OS from './os';

const platform = OS.platform();

const getCharCode =
  ({charCode, keyCode}) =>
  ( keyCode === 13
  ? 13
  : charCode == null
  ? keyCode
  : charCode >= 32
  ? charCode
  : 0
  );


if (!('key' in window.KeyboardEvent.prototype)) {
  const keyTable =
    { "3": "Enter"
    , "8": "Backspace"
    , "9": "Tab"
    , "12": "Clear"
    , "13": "Enter"
    , "16": "Shift"
    , "17": "Control"
    , "18": "Alt"
    , "19": "Pause"
    , "20": "CapsLock"
    , "27": "Escape"
    , "32": "Space"
    , "33": "PageUp"
    , "34": "PageDown"
    , "35": "End"
    , "36": "Home"
    , "37": "ArrowLeft"
    , "38": "ArrowUp"
    , "39": "ArrowRight"
    , "40": "ArrowDown"
    , "44": "PrintScreen"
    , "45": "Insert"
    , "46": "Delete"
    , "112": "F1"
    , "113": "F2"
    , "114": "F3"
    , "115": "F4"
    , "116": "F5"
    , "117": "F6"
    , "118": "F7"
    , "119": "F8"
    , "120": "F9"
    , "121": "F10"
    , "122": "F11"
    , "123": "F12"
    , "144": "NumLock"
    , "145": "ScrollLock"
    , "224": "Meta"
    , "91": "Meta"
    , "92": "Meta"
    , "93": "Meta"
    , "63273": "Home"
    , "63275": "End"
    , "63276": "PageUp"
    , "63277": "PageDown"
    , "63302": "Insert"
    };

  const getKey = function() {
    if (this.type === 'keypress') {
      const charCode = getCharCode(this)
      const key =
        ( charCode === 13
        ? keyTable[charCode]
        : String.fromCharCode(charCode)
        );

      return key
    }
    else if (this.type === 'keyup' || this.type === 'keydown') {
      return keyTable[this.keyCode]
    } else {
      return ''
    }
  };

  Object.defineProperty
  ( window.KeyboardEvent.prototype
  , 'key'
  , { get: getKey
    /*::, value: void(0)*/
    }
  );
}

const readModifiers = ({type, metaKey, shiftKey, altKey, ctrlKey}) => {
  const modifiers = [];
  // Modifier fields indicate if relevant modifier is pressed, in case
  // of 'keyup' event including those does not make sense.
  if (type != 'keyup') {
    if (metaKey) {
      modifiers.push('Meta');
    }
    if (ctrlKey) {
      modifiers.push('Control');
    }
    if (altKey) {
      modifiers.push('Alt');
    }
    if (shiftKey) {
      modifiers.push('Shift');
    }
  }
  return modifiers;
};


const readKey = key => readKey.table[key] || key;
// @FlowIssue: Sigh..
readKey.table = Object.assign(Object.create(null), {
  'ctrl': 'Control',
  'accel': platform == 'darwin' ? 'meta' : 'control',
  'ArrowLeft': 'Left',
  'ArrowRight': 'Right',
  'ArrowUp': 'Up',
  'ArrowDown': 'Down',
  'esc': 'Escape'
});

const readChord = input =>
  input
    .split(/\s+/)
    .map(readKey)
    .sort()
    .join(' ')
    .trim()
    .toLowerCase();

const writeChord = event => {
  const key = event.key
  const modifiers = readModifiers(event)
  const keys = modifiers.indexOf(key) < 0 ?
                [...modifiers, key] :
                modifiers;

  return keys
          .map(readKey)
          .join(' ')
          .toLowerCase()
          .split(' ')
          .sort()
          .join(' ');
};


export const bindings = /*::<Action>*/
  (bindingTable/*:BindingTable<Action>*/)/*:(event:KeyboardEvent) => Action | Abort*/ => {
  const bindings = Object.create(null);
  Object.keys(bindingTable).forEach(key => {
    bindings[readChord(key)] = bindingTable[key];
  });

  return (event) => {
    const combination = writeChord(event);
    const binding = bindings[combination]

    if (binding != null) {
      event.stopPropagation();
      event.preventDefault();
      return binding(event);
    }
    else {
      return {
        type: "AbortEvent"
      , action:
        { type
            : event.type === "keyup"
            ? "KeyUp"
            : event.type === "keydown"
            ? "KeyDown"
            : "KeyPress"
        , combination: combination
        , key: event.key
        , metaKey: event.metaKey
        , shiftKey: event.shiftKey
        , altKey: event.altKey
        , ctrlKey: event.ctrlKey
        }
      };
    }
  };
};
