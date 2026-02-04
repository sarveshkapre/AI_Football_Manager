const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

const setMode = (mode) => {
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === mode);
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});
