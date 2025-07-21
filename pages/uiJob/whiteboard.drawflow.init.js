if (!document.getElementById('drawflow-radius-fix')) {
  var style = document.createElement('style');
  style.id = 'drawflow-radius-fix';
  style.innerHTML = `
    .drawflow .drawflow-node {
      border-radius: 20px !important;
      overflow: visible !important;
    }
    .drawflow .drawflow-node > div {
      border-radius: 20px !important;
      overflow: visible !important;
    }
  `;
  document.head.appendChild(style);
}
window.addEventListener('DOMContentLoaded', function() {
  var container = document.getElementById('whiteboard');
  if (!container) return;

  container.innerHTML = '';
  container.style.width = '100%';
  container.style.height = '600px';
  container.style.background = '#f8f9fa';
  container.style.borderRadius = '20px';

  var editor = new Drawflow(container);
  editor.reroute = true;
  editor.start();

  var inputNodeHtml = `<div style="padding:8px 16px;background:#fff;border-radius:20px;border:1px solid #ccc;min-width:120px;text-align:center;">
    <strong>Input Node</strong>
  </div>`;
  var outputNodeHtml = `<div style="padding:8px 16px;background:#fff;border-radius:20px;border:1px solid #ccc;min-width:120px;text-align:center;">
    <strong>Output Node</strong>
  </div>`;

  editor.addNode('input', 1, 1, 200, 200, 'input', {}, inputNodeHtml);
  editor.addNode('output', 1, 1, 500, 200, 'output', {}, outputNodeHtml);
  editor.addConnection(1, 2, 'output_1', 'input_1');

  function setWhiteboardBackground() {
    var theme = document.body.getAttribute('data-theme') || document.documentElement.getAttribute('data-theme') || 'light';
    if (theme === 'dark') {
      container.style.background = "radial-gradient(circle, #444 1.5px, transparent 1.5px) 0 0/20px 20px, #222";
    } else {
      container.style.background = "radial-gradient(circle, #bbb 1.5px, transparent 1.5px) 0 0/20px 20px, #fff";
    }
  }
  setWhiteboardBackground();
  const observer = new MutationObserver(setWhiteboardBackground);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function setWhiteboardSize() {
    var header = document.querySelector('header');
    var footer = document.getElementById('footer');
    var headerHeight = header ? header.offsetHeight : 0;
    var footerHeight = footer ? footer.offsetHeight : 0;
    var availableHeight = window.innerHeight - headerHeight - footerHeight;
    container.style.width = '100vw';
    container.style.height = availableHeight + 'px';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.zIndex = '1';
  }
  setWhiteboardSize();
  window.addEventListener('resize', setWhiteboardSize);
});
