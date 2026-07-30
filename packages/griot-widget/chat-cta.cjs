'use strict';
/**
 * griot-widget · agentic free-text CTA component  (GMCL-C4)
 * The reusable "Other is always typeable" affordance — ships in every widget. Renders markup;
 * bindChatCta wires textarea+send (Enter-to-send) to drive(). Browser IIFE + node-requireable.
 */
(function (global) {
  function chatCtaHtml(opts) {
    opts = opts || {};
    var id = opts.id || 'griot-chat-in';
    var placeholder = (opts.placeholder || "Type an 'Other', a new decision, or a redirect — Enter sends, it drives the agent").replace(/"/g, '&quot;');
    return '' +
      '<div class="griot-chat-cta" data-griot-chat>' +
      '<textarea id="' + id + '" class="griot-chat-in" rows="1" placeholder="' + placeholder + '"></textarea>' +
      '<button type="button" class="griot-chat-send" data-griot-send>Send ↗</button>' +
      '</div>';
  }

  // bindChatCta(root, drive) -> true if a chat CTA was found + wired.
  function bindChatCta(root, driveFn) {
    root = root || (typeof global.document !== 'undefined' ? global.document : null);
    if (!root || typeof root.querySelector !== 'function') return false;
    var wrap = root.querySelector('[data-griot-chat]');
    if (!wrap) return false;
    var input = wrap.querySelector('textarea');
    var send = wrap.querySelector('[data-griot-send]');
    var fire = function () {
      var v = ((input && input.value) || '').trim();
      if (!v) return;
      (driveFn || global.griotDrive)(v);
      if (input) input.value = '';
    };
    if (send && send.addEventListener) send.addEventListener('click', fire);
    if (input && input.addEventListener) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); fire(); }
    });
    return true;
  }

  var api = { chatCtaHtml: chatCtaHtml, bindChatCta: bindChatCta };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.griotChatCta = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
