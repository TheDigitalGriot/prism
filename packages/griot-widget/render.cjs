'use strict';
/**
 * griot-widget · render() primitive  (GMCL-C1)
 * Generalized from prism-brainstorm/scripts/server.cjs wrapInFrame (125-127) + isFullDocument (109-112)
 * + injectChannelMeta (118-123). One slot-fill seam every Griot surface calls; never hand-authored HTML.
 */
const fs = require('fs');

const SLOT = '<!-- CONTENT -->';

function isFullDocument(html) {
  const s = (html || '').trimStart().toLowerCase();
  return s.startsWith('<!doctype') || s.startsWith('<html');
}

function injectCommMeta(html, comm) {
  if (!comm) return html;
  const tags = Object.entries(comm)
    .map(([k, v]) => `<meta name="griot-${k}" content="${String(v).replace(/"/g, '&quot;')}">`)
    .join('\n');
  if (html.includes('</head>')) return html.replace('</head>', tags + '\n</head>');
  return tags + '\n' + html;
}

function loadTemplate(opts) {
  if (opts.template != null) return opts.template;
  if (opts.templatePath) return fs.readFileSync(opts.templatePath, 'utf-8');
  throw new Error('render: opts.template or opts.templatePath is required');
}

/**
 * render(content, opts) -> framed HTML
 * opts: { template | templatePath, comm?, ember?, fidelity? }
 * A full <html> document is passed through (comm meta only); a fragment is slotted into the frame.
 */
// applyMeta: a consumer may pass its own exact meta-injector (opts.injectMeta) — this is what lets
// render() be a byte-identical drop-in for a tool's existing wrap (e.g. Brainstorm injectChannelMeta).
// Otherwise the default griot-* comm meta from opts.comm is used.
function applyMeta(html, opts) {
  return typeof opts.injectMeta === 'function' ? opts.injectMeta(html) : injectCommMeta(html, opts.comm);
}

function render(content, opts = {}) {
  content = content == null ? '' : String(content);
  if (isFullDocument(content)) return applyMeta(content, opts);

  let html = loadTemplate(opts).replace(SLOT, content);
  if (opts.ember) {
    html = html.replace('/* griotwave-tokens-end */', `  --ember:${opts.ember};\n  /* griotwave-tokens-end */`);
  }
  if (opts.fidelity) {
    html = html.replace('data-fidelity="hi"', `data-fidelity="${opts.fidelity}"`);
  }
  return applyMeta(html, opts);
}

module.exports = { render, isFullDocument, injectCommMeta, SLOT };
