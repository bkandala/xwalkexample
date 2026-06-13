import { loadFragment } from '../fragment/fragment.js';

const TAG_PATH = '/content/_cq_tags/xwalkdemo/region';
const FRAGMENT_ROOT = '/content/xwalkdemo/fragments';
const FALLBACK_MESSAGE = 'Unable to load content for the selected region.';

const extractRegions = (data) => {
  if (Array.isArray(data?.children)) {
    return data.children;
  }

  const rootName = TAG_PATH.split('/').pop();
  return Object.values(data || {}).filter((tag) => {
    if (!tag || typeof tag !== 'object') return false;
    if (!tag.name || !tag.title) return false;
    if (tag.path) return tag.path.startsWith(`${TAG_PATH}/`);
    return tag.name !== rootName;
  });
};

async function fetchRegions() {
  try {
    const resp = await fetch(`${TAG_PATH}.json`);
    if (!resp.ok) return [];

    const data = await resp.json();
    return extractRegions(data)
      .map((tag) => ({ key: tag.name, label: tag.title }))
      .filter(({ key, label }) => key && label);
  } catch (e) {
    return [];
  }
}

function buildSelect(regions) {
  const select = document.createElement('select');
  select.className = 'region-picker-select';
  select.setAttribute('aria-label', 'Select region');

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select a region';
  placeholder.selected = true;
  placeholder.disabled = true;
  select.append(placeholder);

  regions.forEach(({ key, label }) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = label;
    select.append(option);
  });

  return select;
}

export default async function decorate(block) {
  const regions = await fetchRegions();
  const controls = document.createElement('div');
  controls.className = 'region-picker-controls';
  const content = document.createElement('div');
  content.className = 'region-picker-content';
  content.setAttribute('aria-live', 'polite');

  const select = buildSelect(regions);
  select.addEventListener('change', async (event) => {
    const { value } = event.target;
    if (!value) return;

    content.textContent = 'Loading region content...';
    try {
      const fragment = await loadFragment(`${FRAGMENT_ROOT}/${value}`);
      if (fragment) {
        content.replaceChildren(...fragment.childNodes);
        return;
      }
    } catch (e) {
      // no-op and show fallback message
    }
    content.textContent = FALLBACK_MESSAGE;
  });

  if (!regions.length) {
    select.disabled = true;
    content.textContent = 'No regions are available right now.';
  }

  controls.append(select);
  block.replaceChildren(controls, content);
}
